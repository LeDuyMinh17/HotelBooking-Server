import express from "express";
import Invoice from "../models/invoice.js";
import Room from "../models/room.js";
import Service from "../models/service.js";
import Customer from "../models/customer.js";
import authToken from "../middleware/authMiddleware.js";

const invoiceRouter = express.Router();

// 🧾 Tạo hóa đơn
invoiceRouter.post("/tao-hoa-don", authToken, async (req, res) => {
  try {
    const { name, phone, email, note, roomId, checkIn, checkOut, services = [] } = req.body;

    if (!name || !email || !phone || !checkIn)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });

    // 🧠 User đăng nhập
    const { id: userId, role } = req.user;
    const userName = req.user.name?.trim() || "Người dùng";

    // 🔍 Tìm hoặc tạo khách hàng mới (chỉ khi trùng cả 3)
    let customer = await Customer.findOne({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });

    if (!customer) {
      customer = new Customer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      await customer.save();
    }

    // ✅ Kiểm tra phòng
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng." });
    if (!room.isAvailable) return res.status(400).json({ message: "Phòng này đã được đặt." });

    // ✅ Tính tiền phòng
    let roomCharge = room.price;
    if (checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = Math.max(0, end - start);
      const days = Math.max(1, Math.ceil(diff / 86400000));
      roomCharge = room.price * days;
    }

    // ✅ Tạo hóa đơn (note lưu ở đây)
    const invoice = new Invoice({
      customerId: customer._id,
      createdBy: userId,
      roomId,
      checkIn,
      checkOut: checkOut || null,
      bookedBy: userName,
      note: note?.trim() || "",
      services,
      roomCharge,
      serviceCharge: 0,
      totalAmount: roomCharge,
      status: role === "user" ? "Chờ xác nhận" : "Chờ thanh toán",
    });

    await invoice.save();

    // Cập nhật trạng thái phòng
    room.isAvailable = false;
    await room.save();

    // Sau khi save invoice thành công
    const io = req.app.get("io");
    io.emit("newBooking", {
      customer: name,
      room: room.numberRoom,
      time: new Date(),
    });

    res.status(201).json({
      message: "Tạo hoá đơn thành công",
      invoice,
      customer,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo hoá đơn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

//Xem hoá đơn
invoiceRouter.get("/xem-hoa-don", authToken, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const invoices = await Invoice.find({ createdBy: userId })
      .populate("roomId", "numberRoom roomType bedType price")
      .populate("services.serviceId", "name price")
      .populate("customerId", "name phone email")
      .sort({ createdAt: -1 });

    if (!invoices.length) {
      return res.status(200).json({ message: "Chưa có hoá đơn nào.", invoices: [] });
    }

    return res.status(200).json({
      message: "Lấy danh sách hoá đơn thành công",
      invoices,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy hoá đơn theo user:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách hoá đơn.",
      error: error.message,
    });
  }
});

// 🧾 Lấy chi tiết hoá đơn
invoiceRouter.get("/chi-tiet-hoa-don/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate({
        path: "customerId",
        select: "name email phone userId",
      })
      .populate("roomId", "numberRoom roomType bedType price")
      .populate("services.serviceId", "name price")
      .populate("paidBy", "name email"); // ✅ thêm dòng này

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hoá đơn" });

    return res.status(200).json({
      message: "Lấy chi tiết hoá đơn thành công",
      invoice,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết hoá đơn:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 🧾 Thêm dịch vụ vào hóa đơn
invoiceRouter.post("/them-dich-vu-vao-hoa-don", authToken, async (req, res) => {
  try {
    const { invoiceId, serviceId, quantity, startDate, endDate } = req.body;
    if (!invoiceId || !serviceId || !startDate)
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hoá đơn." });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Không tìm thấy dịch vụ." });
    if (!service.isAvailable)
      return res.status(400).json({ message: "Dịch vụ này hiện không khả dụng." });

    // 🔐 Kiểm tra quyền
    const isOwner = invoice.createdBy.toString() === req.user.id;
    const isStaff = ["employee", "admin"].includes(req.user.role);
    if (!isOwner && !isStaff)
      return res.status(403).json({ message: "Bạn không thể chỉnh sửa hoá đơn này." });

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    // ✅ Kiểm tra trùng dịch vụ
    const existing = invoice.services.find(
      (s) =>
        s.serviceId.toString() === serviceId &&
        new Date(s.startDate).toDateString() === start.toDateString() &&
        ((s.endDate && endDate && new Date(s.endDate).toDateString() === new Date(endDate).toDateString()) ||
          (!s.endDate && !endDate))
    );

    if (existing) existing.quantity += quantity;
    else
      invoice.services.push({
        serviceId,
        quantity,
        startDate,
        endDate: endDate || null,
      });

    // ✅ Cập nhật tiền
    await invoice.populate("services.serviceId", "price");
    invoice.serviceCharge = invoice.services.reduce((sum, s) => {
      const price = s.serviceId.price;
      const q = s.quantity;
      const sStart = new Date(s.startDate);
      const sEnd = s.endDate ? new Date(s.endDate) : sStart;
      const days = Math.max(1, Math.ceil((sEnd - sStart) / 86400000));
      return sum + price * q * days;
    }, 0);
    invoice.totalAmount = invoice.roomCharge + invoice.serviceCharge;

    await invoice.save();

    return res.status(200).json({
      message: existing ? "Đã cập nhật dịch vụ" : "Đã thêm dịch vụ",
      invoice,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thêm dịch vụ:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 🧾 Lấy toàn bộ hoá đơn (chỉ dành cho nhân viên)
invoiceRouter.get("/toan-bo-hoa-don", authToken, async (req, res) => {
  try {
    // ✅ Chỉ cho phép role = staff hoặc admin
    if (req.user.role !== "employee" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ nhân viên mới có quyền truy cập." });
    }

    // ✅ Lấy toàn bộ hoá đơn, kèm thông tin khách và phòng
    const invoices = await Invoice.find()
      .populate("customerId", "name phone email")
      .populate("roomId", "numberRoom roomType bedType price")
      .populate("services.serviceId", "name price")
      .populate("paidBy", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ message: "Hiện chưa có hoá đơn nào.", invoices: [] });
    }

    return res.status(200).json({
      message: "Lấy danh sách toàn bộ hoá đơn thành công",
      invoices,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy toàn bộ hoá đơn:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy toàn bộ hoá đơn.",
      error: error.message,
    });
  }
});

// 🧾 Cập nhật trạng thái hoá đơn (chỉ cho nhân viên hoặc admin)
invoiceRouter.patch("/hoa-don/:id/trang-thai", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedRoles = ["admin", "employee", "staff"];
    const validStatuses = ["Chờ xác nhận", "Chờ thanh toán", "Đã thanh toán", "Đã huỷ"];

    // Kiểm tra quyền truy cập
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật hoá đơn." });
    }

    // Kiểm tra trạng thái hợp lệ
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    // Tìm và cập nhật hoá đơn
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("customerId", "name phone email note")
      .populate("roomId", "numberRoom roomType price");

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hoá đơn để cập nhật." });

    if (invoice.roomId) {
      if (status === "Đã huỷ") {
        await Room.findByIdAndUpdate(invoice.roomId._id, { isAvailable: true });
      } else if (status === "Đã thanh toán") {
        await Room.findByIdAndUpdate(invoice.roomId._id, { isAvailable: false });
      }
    }
    return res.status(200).json({
      message: "Cập nhật trạng thái hoá đơn thành công!",
      invoice,
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái hoá đơn:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật trạng thái hoá đơn.",
      error: error.message,
    });
  }
});

invoiceRouter.patch("/hoa-don/:id/thanh-toan", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();

    const invoice = await Invoice.findById(id)
    .populate("roomId", "price isAvailable")
    .populate("services.serviceId", "name price")
    .populate("customerId", "name phone email")
    .populate("paidBy", "name email");

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hoá đơn." });

    if (invoice.status === "Đã huỷ")
      return res.status(400).json({ message: "Hoá đơn này đã bị huỷ, không thể thanh toán." });

  const checkInDate = new Date(invoice.checkIn);

  // Nếu hóa đơn đã có ngày trả thì dùng ngày đó, còn không thì lấy hôm nay
  let checkOutDate = invoice.checkOut ? new Date(invoice.checkOut) : new Date(today);
  
  if (!invoice.checkOut) invoice.checkOut = checkOutDate;


  // Nếu chưa có checkOut và ngày nhận ở tương lai → báo lỗi
  if (!invoice.checkOut && checkOutDate < checkInDate)
    return res.status(400).json({ message: "Chưa đến ngày nhận phòng." });


    if (checkOutDate.toDateString() === checkInDate.toDateString())
      checkOutDate.setDate(checkOutDate.getDate());

    // 🔹 Tính số ngày ở
    const stayDays = Math.max(1, Math.ceil((checkOutDate - checkInDate) / 86400000));
    const roomPrice = invoice.roomId?.price || 0;
    const roomCharge = roomPrice * stayDays;

    // 🔹 Tính tiền dịch vụ
    let updatedServices = [];
    let serviceCharge = 0;

    if (invoice.services?.length > 0) {
      updatedServices = invoice.services.map((s) => {
        const start = new Date(s.startDate);
        const end = s.endDate ? new Date(s.endDate) : today;

        const days = Math.max(1, Math.ceil((end - start) / 86400000));
        const price = s.serviceId?.price || 0;
        const qty = s.quantity || 1;
        const total = price * qty * days;

        serviceCharge += total;
        return { ...s, endDate: end };
      });
    }

    const totalAmount = roomCharge + serviceCharge;

    // 🔹 Cập nhật hoá đơn
    invoice.checkOut = checkOutDate;
    invoice.roomCharge = roomCharge;
    invoice.serviceCharge = serviceCharge;
    invoice.totalAmount = totalAmount;
    invoice.status = "Đã thanh toán";
    invoice.paidAt = new Date();
    invoice.services = updatedServices;
    invoice.paidBy = req.user.id; // ✅ Lưu nhân viên thực hiện thanh toán

    await invoice.save();

    // 🔹 Mở lại phòng (an toàn)
    if (invoice.roomId?._id) {
      await Room.findByIdAndUpdate(invoice.roomId._id, { isAvailable: true });
    }

    return res.status(200).json({
      message: "Thanh toán hoá đơn thành công!",
      invoice,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thanh toán hoá đơn:", error);
    res.status(500).json({
      message: "Lỗi server khi thanh toán hoá đơn.",
      error: error.message,
    });
  }
});

invoiceRouter.patch("/hoa-don/:id/cap-nhat", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("customerId")
      .populate("roomId")
      .populate("services.serviceId");

    res.status(200).json({
      message: "Cập nhật hóa đơn thành công!",
      invoice,
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật hoá đơn:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật hoá đơn." });
  }
});


export default invoiceRouter;


