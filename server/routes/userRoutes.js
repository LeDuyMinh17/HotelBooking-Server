import express from "express";
import User from "../models/user.js";
import Invoice from "../models/invoice.js";
import Customer from "../models/customer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authToken from "../middleware/authMiddleware.js"
import VerifyCode from "../models/vertifyCode.js"; 
import { sendVerificationEmail } from "../middleware/sendEmail.js";

const genCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const userRouter = express.Router();

// Đăng ký
userRouter.post("/dang-ky", async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!name || name.length < 5) return res.status(400).json({ message: "Tên quá ngắn" });
    if (!email || !password || !phone) return res.status(400).json({ message: "Thiếu thông tin" });

    let user = await User.findOne({ $or: [{ email }, { phone }] });

    // Nếu user tồn tại và đã kích hoạt
    if (user && user.isActive) {
      return res.status(400).json({ message: "Email hoặc SĐT đã được đăng ký" });
    }

    // Nếu user không tồn tại -> tạo user mới với isActive = false
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        email,
        password: hashedPassword,
        name,
        phone,
        role: role || "user",
        isActive: false,
      });
      await user.save();
    } else {
      // user tồn tại nhưng isActive = false -> cập nhật thông tin nếu muốn
      // tránh ghi đè password nếu người đã tạo trước đó
      const hashed = await bcrypt.hash(password, 10);
      user.name = name;
      user.phone = phone;
      user.password = hashed;
      user.role = role || user.role || "user";
      await user.save();
    }

    // 2) tạo mã xác minh và lưu VerifyCode (xóa mã cũ của email nếu có)
    const code = genCode();
    await VerifyCode.deleteMany({ email }); // xóa mã cũ (nếu có)
    const verify = new VerifyCode({ userId: user._id, email, code });
    await verify.save();

    // 3) gửi email
    await sendVerificationEmail(email, code);

    return res.status(200).json({
      message: "Đã gửi mã xác minh đến email. Mã có hiệu lực 5 phút.",
      email,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message:
          field === "phone"
            ? "Số điện thoại đã được sử dụng"
            : "Email đã được sử dụng",
      });
    }
    return res.status(500).json({ message: "Lỗi server" + error.message });
  }
});

// Endpoint verify
userRouter.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Thiếu email hoặc mã" });

    const record = await VerifyCode.findOne({ email, code });
    if (!record) return res.status(400).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });

    // kích hoạt user
    const user = await User.findById(record.userId || (await User.findOne({ email }))._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.isActive = true;
    await user.save();

    // xóa mã
    await VerifyCode.deleteMany({ email });

    return res.status(200).json({ message: "Xác minh thành công. Bạn có thể đăng nhập." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server khi verify" });
  }
});

// Endpoint resend
userRouter.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Thiếu email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user để gửi lại mã." });
    if (user.isActive) return res.status(400).json({ message: "Tài khoản đã kích hoạt." });

    // Tạo mã mới
    const code = genCode();
    await VerifyCode.deleteMany({ email });
    const verify = new VerifyCode({ userId: user._id, email, code });
    await verify.save();

    await sendVerificationEmail(email, code);

    return res.status(200).json({ message: "Đã gửi lại mã xác minh." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server khi gửi lại mã" });
  }
});

// Đăng nhập
userRouter.post("/dang-nhap", async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    // ✅ Kiểm tra trạng thái kích hoạt
    if (!checkUser.isActive) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ cho khách sạn." });
    }

    const isMatch = await bcrypt.compare(password, checkUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const payload = { id: checkUser._id, name: checkUser.name, role: checkUser.role };
    const token = jwt.sign(payload, "NhoMotNguoi", { expiresIn: "30d" });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      id: checkUser._id,
      role: checkUser.role,
      avatar: checkUser.avatar,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi kết nối server" });
  }
});

//Lấy thông tin user
userRouter.get("/thong-tin-nguoi-dung", authToken, async (req, res) => {
  try {
    // Lấy id từ JWT decode
    const userId = req.user.id; 

    const data = await User.findById(userId).select("-password");
    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ message: "Lỗi kết nối server" });
  }
});

//Cập nhật thông tin user
userRouter.put("/cap-nhat-thong-tin", authToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password, name, phone, avatar } = req.body;
    const updateFields = {};

    // 🔍 Kiểm tra email trùng (ngoại trừ chính user đang sửa)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Tài khoản (email) đã tồn tại." });
      }
      updateFields.email = email;
    }

    // 🔍 Kiểm tra SĐT trùng (ngoại trừ chính user đang sửa)
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhone) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại." });
      }
      updateFields.phone = phone;
    }

    if (name) updateFields.name = name;
    if (avatar) updateFields.avatar = avatar;

    // 🔒 Nếu có mật khẩu mới → hash lại
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    // 🧩 Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    }).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật." });

    return res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Lỗi server, vui lòng thử lại." });
  }
});

// Đổi ảnh đại diện (frontend gửi avatarUrl đã upload Cloudinary)
userRouter.put("/doi-avatar", authToken, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl)
      return res.status(400).json({ message: "Thiếu đường dẫn ảnh avatar." });

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      message: "Cập nhật avatar thành công!",
      avatar: updated.avatar,
    });
  } catch (err) {
    console.error("❌ Lỗi khi đổi avatar:", err);
    res.status(500).json({ message: "Không thể cập nhật avatar." });
  }
});


// 🧨 Xoá tài khoản người dùng (User tự xoá)
userRouter.delete("/xoa-tai-khoan", authToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    // 🚫 Không cho admin tự xoá để tránh mất quyền quản trị
    if (user.role === "admin")
      return res.status(403).json({ message: "Admin không thể tự xoá tài khoản." });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Tài khoản đã được xoá thành công." });
  } catch (error) {
    console.error("❌ Lỗi khi xoá tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server khi xoá tài khoản." });
  }
});

// 🧩 Lấy danh sách toàn bộ user có role = "user" (Admin-only)
userRouter.get("/tat-ca-khach-hang", authToken, async (req, res) => {
  try {
    // 🔒 Kiểm tra quyền admin
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    // 🧩 Lấy toàn bộ user có role = "user"
    const users = await User.find({ role: "user" }).select("name email phone");

    // 🔍 Lấy toàn bộ customer & invoice 1 lần duy nhất
    const [allCustomers, allInvoices] = await Promise.all([
      Customer.find().select("userId email phone"),
      Invoice.find().select("customerId status totalAmount"),
    ]);

    // ⚙️ Tạo map cho customer theo userId / email / phone để tìm nhanh
    const customerMap = new Map();
    for (const c of allCustomers) {
      if (c.userId) customerMap.set(c.userId.toString(), c);
      if (c.email) customerMap.set(c.email, c);
      if (c.phone) customerMap.set(c.phone, c);
    }

    // ⚙️ Gom invoice theo customerId
    const invoiceMap = new Map();
    for (const inv of allInvoices) {
      const id = inv.customerId?.toString();
      if (!id) continue;
      if (!invoiceMap.has(id)) invoiceMap.set(id, []);
      invoiceMap.get(id).push(inv);
    }

    // 🧮 Ghép và tính thống kê
    const result = users.map((user) => {
      const matchedCustomer =
        customerMap.get(user._id.toString()) ||
        customerMap.get(user.email) ||
        customerMap.get(user.phone);

      const invoices = matchedCustomer
        ? invoiceMap.get(matchedCustomer._id.toString()) || []
        : [];

      const tongHoaDon = invoices.length;
      const tongTienThanhToan = invoices
        .filter((inv) => inv.status === "Đã thanh toán")
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      return {
        ...user.toObject(),
        stats: { tongHoaDon, tongTienThanhToan },
      };
    });

    // ✅ Trả về
    return res.status(200).json({
      message: "Lấy danh sách khách hàng thành công",
      customers: result,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách khách hàng:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 🔒 Admin toggle quyền đăng nhập user
userRouter.patch("/kich-hoat-dang-nhap/:id", authToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền này." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user." });

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      message: user.isActive
        ? "Đã kích hoạt lại tài khoản người dùng."
        : "Đã vô hiệu hoá đăng nhập của người dùng.",
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi toggle tài khoản.", error: error.message });
  }
});

// userRoutes.js
userRouter.get("/tat-ca-nhan-vien", authToken, async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("name email phone avatar isActive createdAt");
    res.status(200).json({ employees });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhân viên" });
  }
});

// ✅ Chi tiết hóa đơn của nhân viên (đã tạo + đã thanh toán)
userRouter.get("/hoa-don-nhan-vien/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ admin hoặc employee được phép xem
    if (req.user.role !== "admin" && req.user.role !== "employee") {
      return res.status(403).json({ message: "Không có quyền truy cập." });
    }

    // 🧾 Lấy tất cả hóa đơn mà nhân viên này liên quan
    const invoices = await Invoice.find({
      $or: [{ createdBy: id }, { paidBy: id }],
    })
      .populate("customerId", "name email phone")
      .populate("roomId", "numberRoom roomType bedType price")
      .populate("services.serviceId", "name price")
      .populate("createdBy", "name email")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });

    if (!invoices || invoices.length === 0) {
      return res.status(200).json({
        employee: await User.findById(id).select("name email phone role isActive"),
        createdInvoices: [],
        paidInvoices: [],
      });
    }

    // ⚙️ Phân loại đúng logic — cho phép 1 hóa đơn nằm ở cả hai nhóm
    const createdInvoices = [];
    const paidInvoices = [];

    for (const inv of invoices) {
      const creatorId = inv.createdBy?._id?.toString() || inv.createdBy?.toString();
      const payerId = inv.paidBy?._id?.toString() || inv.paidBy?.toString();

      if (creatorId === id) createdInvoices.push(inv);
      if (payerId === id) paidInvoices.push(inv);
    }

    // 🧩 Lấy thông tin nhân viên
    const employee = await User.findById(id).select("name email phone role isActive");
    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    }

    return res.status(200).json({
      employee,
      createdInvoices,
      paidInvoices,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết nhân viên:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy chi tiết nhân viên.",
      error: error.message,
    });
  }
});

// 🧩 Admin thêm nhân viên (bỏ qua verify email)
userRouter.post("/admin-them-nhan-vien", authToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Chỉ admin mới có quyền thêm nhân viên." });

    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });

    // Kiểm tra trùng
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email đã tồn tại." });

    const hashed = await bcrypt.hash(password, 10);
    const newEmp = new User({
      name,
      email,
      phone,
      password: hashed,
      role: "employee",
      isActive: true, // nhân viên được kích hoạt ngay
    });
    await newEmp.save();

    return res.status(201).json({ message: "Thêm nhân viên thành công!", user: newEmp });
  } catch (error) {
    console.error("❌ Lỗi khi thêm nhân viên:", error);
    res.status(500).json({ message: "Lỗi server khi thêm nhân viên." });
  }
});

userRouter.delete("/xoa-nhan-vien/:id", authToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Chỉ admin mới được phép." });

    const user = await User.findById(req.params.id);
    if (!user || user.role !== "employee")
      return res.status(404).json({ message: "Không tìm thấy nhân viên." });

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Đã xoá nhân viên thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xoá nhân viên." });
  }
});

// ✅ Admin cập nhật thông tin nhân viên
userRouter.put("/admin-cap-nhat-nhan-vien/:id", authToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền chỉnh sửa nhân viên." });
    }

    const { id } = req.params;
    const { email, password, name, phone, avatar, role } = req.body;
    const updateFields = {};

    // 🔍 Check email trùng (ngoại trừ chính nhân viên này)
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail)
        return res.status(400).json({ message: "Email đã tồn tại cho tài khoản khác." });
      updateFields.email = email;
    }

    // 🔍 Check phone trùng (ngoại trừ chính nhân viên này)
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: id } });
      if (existingPhone)
        return res.status(400).json({ message: "Số điện thoại đã tồn tại cho tài khoản khác." });
      updateFields.phone = phone;
    }

    if (name) updateFields.name = name;
    if (avatar) updateFields.avatar = avatar;
    if (role) updateFields.role = role;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    const updated = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).select("-password");

    if (!updated) return res.status(404).json({ message: "Không tìm thấy nhân viên." });

    return res.status(200).json({ message: "Cập nhật nhân viên thành công!", user: updated });
  } catch (err) {
    console.error("❌ Lỗi khi admin cập nhật nhân viên:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật nhân viên." });
  }
});


export default userRouter;
