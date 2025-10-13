import express from "express";
import User from "../models/user.js";
import Customer from "../models/customer.js";
import Invoice from "../models/invoice.js";
import authToken from "../middleware/authMiddleware.js";

const customerRouter = express.Router();

/**
 * 📊 Lấy chi tiết & thống kê KH theo ID (ID của USER – người đặt)
 * Trả về: info user + danh sách invoice (mỗi invoice đã populate customerId là người được đặt hộ)
 */
customerRouter.get("/chi-tiet/:id", authToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    // user (người đặt)
    const customerUser = await User.findById(req.params.id).select("name email phone isActive");
    if (!customerUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // toàn bộ hoá đơn do user này đặt
    const invoices = await Invoice.find({ createdBy: req.params.id })
      .populate("customerId", "name email phone")
      .populate("roomId", "numberRoom roomType bedType price")
      .sort({ createdAt: -1 });

    const stats = {
      tongHoaDon: invoices.length,
      choXacNhan: invoices.filter((i) => i.status === "Chờ xác nhận").length,
      choThanhToan: invoices.filter((i) => i.status === "Chờ thanh toán").length,
      daThanhToan: invoices.filter((i) => i.status === "Đã thanh toán").length,
      daHuy: invoices.filter((i) => i.status === "Đã huỷ").length,
    };

    return res.status(200).json({
      message: "Lấy chi tiết khách hàng thành công",
      customer: customerUser,  // người đặt (User)
      invoices,                // mỗi hoá đơn đã có customerId (người được đặt hộ)
      stats,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết khách hàng:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

/**
 * 🔍 Tìm kiếm trong bảng Customer (người được đặt hộ)
 * (giữ nguyên nếu bạn cần)
 */
customerRouter.get("/tim-kiem", authToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    const { keyword } = req.query;
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Từ khoá tìm kiếm không hợp lệ" });
    }

    const regex = new RegExp(keyword, "i");
    const results = await Customer.find({
      $or: [{ name: regex }, { email: regex }, { phone: regex }],
    });

    return res.status(200).json({
      message: `Tìm thấy ${results.length} khách hàng phù hợp`,
      results,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tìm kiếm khách hàng:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

export default customerRouter;
