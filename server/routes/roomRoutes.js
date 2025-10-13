import express from "express";
import Room from "../models/room.js";
import User from "../models/user.js";
import authToken from "../middleware/authMiddleware.js";
import Invoice from "../models/invoice.js";

const roomRouter = express.Router();

// 🔧 Map ảnh theo code thay vì label tiếng Việt
  const getRoomImage = (roomType, bedType) => {
    const key = `IMG_${roomType}_${bedType}`;
    const img = process.env[key];
    if (!img) return "";
    const base = process.env.BASE_URL;
    return img.startsWith("http") ? img : `${base}/${img}`;
  };


//Thêm phòng
roomRouter.post("/them-phong", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

    const { numberRoom, roomType, bedType, price } = req.body;

    if (!numberRoom || isNaN(numberRoom))
      return res.status(400).json({ message: "Số phòng không hợp lệ" });
    if (!price || isNaN(price) || price <= 0)
      return res.status(400).json({ message: "Giá phòng không hợp lệ" });

    const existingRoom = await Room.findOne({ numberRoom });
    if (existingRoom)
      return res
        .status(409)
        .json({ message: `Phòng số ${numberRoom} đã tồn tại` });

    const img = getRoomImage(roomType, bedType);
    const room = new Room({ img, numberRoom, roomType, bedType, price });
    await room.save();

    res.status(201).json({ message: "Thêm phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

//Xoá phòng
roomRouter.delete("/xoa-phong/:id", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    return res.status(200).json({ message: "Xoá phòng thành công", room });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

//Sửa phòng
roomRouter.put("/sua-phong/:id", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

    const { numberRoom, roomType, bedType, price, isHidden } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    // ✅ Chỉ cập nhật field có trong request
    if (numberRoom !== undefined) room.numberRoom = numberRoom;
    if (price !== undefined) room.price = price;
    if (roomType !== undefined) room.roomType = roomType;
    if (bedType !== undefined) room.bedType = bedType;
    if (isHidden !== undefined) room.isHidden = isHidden;

    // ✅ Nếu thay đổi loại phòng hoặc giường → cập nhật lại ảnh
    if (roomType || bedType) {
      const getRoomImage = (type, bed) => {
        const key = `IMG_${type}_${bed}`;
        return process.env[key] || "";
      };
      room.img = getRoomImage(room.roomType, room.bedType);
    }

    await room.save();
    res.json({ message: "Cập nhật phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// ✅ Lấy tất cả phòng + invoiceId nếu phòng đang được đặt
roomRouter.get("/tat-ca-phong", async (req, res) => {
  try {
    // Lấy toàn bộ phòng
    const rooms = await Room.find();

    // Lấy danh sách hóa đơn còn hiệu lực (chưa thanh toán hoặc chưa xác nhận)
    const activeInvoices = await Invoice.find({
      status: { $in: ["Chờ xác nhận", "Chờ thanh toán"] },
    }).select("roomId status");

    // Tạo map nhanh theo roomId
    const invoiceMap = new Map();
    activeInvoices.forEach((inv) => {
      invoiceMap.set(inv.roomId.toString(), {
        invoiceId: inv._id,
        invoiceStatus: inv.status,
      });
    });

    // Gắn invoice vào mỗi phòng
    const enrichedRooms = rooms.map((room) => {
      const found = invoiceMap.get(room._id.toString());
      return {
        ...room.toObject(),
        invoiceId: found ? found.invoiceId : null,
        invoiceStatus: found ? found.invoiceStatus : null,
      };
    });

    res.status(200).json({
      message: "Lấy danh sách phòng thành công",
      rooms: enrichedRooms,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy phòng:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

//Chi tiết phòng
roomRouter.get("/chi-tiet-phong/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.status(200).json({ message: "Lấy thông tin phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


// 🧩 API: Lấy 4 phòng top theo lượt đặt (hoặc giá cao nhất)
roomRouter.get("/top-phong", async (req, res) => {
  try {
    // 1️⃣ Đếm lượt đặt của mỗi phòng
    const bookings = await Invoice.aggregate([
      { $group: { _id: "$roomId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(bookings.map(b => [b._id?.toString(), b.count]));

    // 2️⃣ Lấy phòng hợp lệ
    const rooms = await Room.find(
      { isAvailable: true, isHidden: false },
      "numberRoom roomType bedType price img"
    );

    // 3️⃣ Gắn bookedCount động
    const enriched = rooms.map(room => ({
      ...room.toObject(),
      bookedCount: countMap.get(room._id.toString()) || 0,
    }));

    // 4️⃣ Phân loại
    const bookedRooms = enriched.filter(r => r.bookedCount > 0);
    const unbookedRooms = enriched.filter(r => r.bookedCount === 0);

    let result = [];

    if (bookedRooms.length > 0) {
      // Nếu có phòng được đặt → lấy top theo bookedCount giảm dần
      bookedRooms.sort((a, b) => b.bookedCount - a.bookedCount);
      result = [...bookedRooms];
    }

    // 5️⃣ Nếu chưa đủ 4 → bổ sung phòng đắt nhất từ phần còn lại
    if (result.length < 4) {
      const remaining = unbookedRooms
        .sort((a, b) => b.price - a.price)
        .slice(0, 4 - result.length);
      result = [...result, ...remaining];
    }

    // 6️⃣ Nếu vẫn chưa đủ (ví dụ tổng <4 phòng hợp lệ) → fallback lấy phòng ẩn/không available
    if (result.length < 4) {
      const fallbackRooms = await Room.find(
        { $or: [{ isAvailable: false }, { isHidden: true }] },
        "numberRoom roomType bedType price img"
      );
      const fallback = fallbackRooms
        .map(room => ({
          ...room.toObject(),
          bookedCount: countMap.get(room._id.toString()) || 0,
        }))
        .sort((a, b) => b.price - a.price)
        .slice(0, 4 - result.length);

      result = [...result, ...fallback];
    }

    res.status(200).json({
      message: "Lấy top phòng thành công",
      rooms: result.slice(0, 3),
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy top phòng:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});


export default roomRouter;
