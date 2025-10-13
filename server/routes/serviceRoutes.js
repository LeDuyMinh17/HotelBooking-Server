import express from "express";
import Service from "../models/service.js";
import User from "../models/user.js";
import authToken from "../middleware/authMiddleware.js";
import Invoice from "../models/invoice.js";

const serviceRouter = express.Router();

// Thêm dịch vụ
serviceRouter.post("/them-dich-vu", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

    const { images, name, price, descShort, descLong } = req.body; // ✅ đổi img -> images

    if (!name || !price || !descShort || !descLong) {
      return res.status(400).json({ message: "Thiếu thông tin dịch vụ" });
    }
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: "Giá dịch vụ không hợp lệ" });
    }

    const newService = new Service({
      images: Array.isArray(images) ? images : [images], // ✅ đổi img -> images
      name,
      price,
      descShort,
      descLong,
    });

    await newService.save();
    return res.status(201).json({ message: "Thêm dịch vụ thành công", service: newService });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


//Xóa dịch vụ
serviceRouter.delete("/xoa-dich-vu/:id", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    res.status(200).json({ message: "Xóa dịch vụ thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


//Sửa dịch vụ
serviceRouter.put("/sua-dich-vu/:id", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không đủ quyền" });
    }

  const { images, name, price, descShort, descLong, isAvailable } = req.body; // ✅ đổi img -> images

  const updated = await Service.findByIdAndUpdate(
    req.params.id,
    {
      ...(images && { images: Array.isArray(images) ? images : [images] }), // ✅
      ...(name && { name }),
      ...(price && { price: Number(price) }),
      ...(descShort && { descShort }),
      ...(descLong && { descLong }),
      ...(typeof isAvailable === "boolean" && { isAvailable }),
    },
    { new: true, runValidators: true }
  );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    res.status(200).json({ message: "Cập nhật dịch vụ thành công", service: updated });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


 //Lấy toàn bộ dịch vụ
serviceRouter.get("/toan-bo-dich-vu", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: 1 });
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


//Lấy chi tiết dịch vụ theo id
serviceRouter.get("/chi-tiet-dich-vu/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }
    res.status(200).json({ service });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


// 🧩 API: Lấy top 4 dịch vụ được đặt nhiều nhất (hoặc giá cao nhất nếu chưa có lượt đặt
serviceRouter.get("/top-dich-vu", async (req, res) => {
  try {
    const bookings = await Invoice.aggregate([
      { $unwind: "$services" },
      { $group: { _id: "$services.serviceId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(bookings.map(b => [String(b._id), b.count]));

    // ✅ Lấy tất cả dịch vụ khả dụng
    const services = await Service.find(
      { isAvailable: true },
      "name descShort price images"
    );

    const enriched = services.map(s => ({
      ...s.toObject(),
      price: Number(s.price) || 0,
      bookedCount: countMap.get(String(s._id)) || 0,
    }));

    const booked = enriched.filter(s => s.bookedCount > 0);
    const unbooked = enriched.filter(s => s.bookedCount === 0);

    // ✅ Sort
    booked.sort((a, b) =>
      b.bookedCount !== a.bookedCount ? b.bookedCount - a.bookedCount : b.price - a.price
    );
    unbooked.sort((a, b) => b.price - a.price);

    // ✅ Chỉ tối đa 3 dịch vụ
    let result = [];
    if (booked.length >= 3) {
      result = booked.slice(0, 3);
    } else if (booked.length > 0) {
      result = [
        ...booked,
        ...unbooked.slice(0, 3 - booked.length),
      ];
    } else {
      result = unbooked.slice(0, 3);
    }

    return res.status(200).json({
      message: "Lấy top dịch vụ thành công",
      services: result,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy top dịch vụ:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});



export default serviceRouter;
