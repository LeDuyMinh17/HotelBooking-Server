import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { authAction } from "../redux/slice";
import {
  User,
  FileText,
  LogOut,
  BarChart3,
  Users,
  Home,
  Briefcase,
  ClipboardList,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminRooms from "../components/AdminRoom.jsx";
import Invoices from "../components/Invoice.jsx";
import AdminServices from "../components/AdminService.jsx";
import AdminCustomer from "../components/AdminCustomer.jsx";
import AdminEmployee from "../components/AdminEmployee.jsx";
import WarnModal from "../components/WarnForm.jsx";
import toast from "react-hot-toast";
import Dashboard from "../components/DashBoard.jsx";
import { getSocket } from "../lib/socket";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Suy ra origin cho Socket nếu chưa set VITE_SOCKET_URL
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (BASE_URL ? new URL(BASE_URL).origin : "");

const Profile = () => {
  const dispatch = useDispatch();
  const { avatar } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("invoice");
  const [role, setRole] = useState("");
  const [formValues, setFormValues] = useState({ name: "", email: "", phone: "" });
  const [originalValues, setOriginalValues] = useState({ name: "", phone: "" });
  const [pendingCount, setPendingCount] = useState(0);
  const [warn, setWarn] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Lấy thông tin người dùng
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/thong-tin-nguoi-dung`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = {
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          role: res.data.role || "user",
        };

        setFormValues(userData);
        setOriginalValues(userData);
        setRole(userData.role);

        // Luôn mở Dashboard cho admin, Invoice cho user khi vào Profile
        handleTabChange(userData.role === "admin" ? "dashboard" : "invoice");

        if (["employee", "admin"].includes(userData.role)) {
          const invoiceRes = await axios.get(`${BASE_URL}/toan-bo-hoa-don`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const count = (invoiceRes.data.invoices || []).filter(
            (inv) => inv.status === "Chờ xác nhận"
          ).length;
          setPendingCount(count);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người dùng:", err);
      }
    };
    fetchUser();
  }, []);

  // Logout
  const handleLogout = () => {
    dispatch(authAction.logout());
    localStorage.clear();
    navigate("/");
  };

  // Xóa tài khoản
  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/xoa-tai-khoan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tài khoản đã được xoá!");
      handleLogout();
    } catch (error) {
      console.error("Lỗi xoá tài khoản:", error);
      toast.error("Không thể xoá tài khoản.");
    }
  };

  // Cập nhật thông tin người dùng
  const handleChange = (e) =>
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const hasChanges =
    formValues.name !== originalValues.name || formValues.phone !== originalValues.phone;

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/cap-nhat-thong-tin`, formValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Cập nhật thành công!");
      setOriginalValues((prev) => ({ ...prev, name: formValues.name, phone: formValues.phone }));
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại!");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "hotel_uploads");

      // Upload trực tiếp lên Cloudinary
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/deevnyeis/image/upload",
        formData
      );

      // Gửi URL mới lên backend
      await axios.put(
        `${BASE_URL}/doi-avatar`,
        { avatarUrl: res.data.secure_url },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      toast.success("Đổi avatar thành công!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Không thể đổi avatar.");
    }
  };

  // Lắng nghe socket (dùng singleton, không disconnect khi unmount)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      console.log("🟢 Socket connected:", socket.id);
      if (role) socket.emit("registerRole", role);
    };
    const onDisconnect = () => {
      console.log("⚪ Socket disconnected");
    };
    const onConnectError = (err) => {
      console.warn("[Socket] connect_error:", err?.message || err);
    };
    const onNewBooking = (data) => {
      if (["admin", "employee"].includes(role)) {
        toast.custom(() => (
          <div className="bg-white border-l-4 border-amber-500 shadow-xl p-4 rounded-xl">
            <p className="font-semibold text-gray-800">Có đặt phòng mới!</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.customer} vừa đặt phòng {data.room}.
            </p>
            <p className="text-xs text-gray-400">
              {new Date(data.time).toLocaleTimeString("vi-VN")}
            </p>
          </div>
        ));
        setPendingCount((prev) => prev + 1);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("newBooking", onNewBooking);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("newBooking", onNewBooking);
    };
  }, [role]);

  // Emit lại role khi thay đổi và socket đã kết nối
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && role) {
      socket.emit("registerRole", role);
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex flex-col md:flex-row pt-16 md:pt-20">
      {/* Sidebar */}
      <aside className="md:w-72 w-full bg-white/80 backdrop-blur shadow-xl p-4 md:p-6 flex md:flex-col items-center justify-between md:justify-start rounded-b-2xl md:rounded-r-2xl fixed md:static top-0 left-0 z-20">
        {/* Avatar */}
        <div className="flex flex-col items-center mt-6 space-y-3">
          {/* Ảnh đại diện */}
          <div className="relative group">
            <img
              src={avatar || "/default-avatar.png"}
              alt="avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-amber-300 shadow-md transition-all duration-300 group-hover:brightness-90"
            />
            {/* Overlay khi hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all duration-300">
              <label
                htmlFor="avatarUpload"
                className="text-white text-sm font-medium bg-amber-600/90 px-4 py-2 rounded-full shadow cursor-pointer hover:bg-amber-500 transition-all"
              >
                Thay đổi
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <nav className="mt-6 space-y-2 w-full">
          {role === "admin" ? (
            <>
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "dashboard"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <BarChart3 size={18} /> <span className="hidden md:inline">Dashboard</span>
              </button>

              {/* moved up: hide duplicate */}
              <button
                onClick={() => handleTabChange("invoice")}
                className={"relative flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm " +
                  (activeTab === "invoice" ? "bg-amber-500 text-white shadow" : "hover:bg-gray-100 text-gray-700")}
              >
                <FileText size={18} />
                <span className="hidden md:inline">Hóa đơn</span>
                {pendingCount > 0 && (
                  <span
                    title={`${pendingCount} hóa đơn chờ xác nhận`}
                    className="absolute right-3 md:right-4 top-2 md:top-2 bg-red-500 text-white text-[10px] leading-none px-1.5 py-1 rounded-full shadow"
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange("rooms")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "rooms"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Home size={18} /> <span className="hidden md:inline">Phòng</span>
              </button>

              <button
                onClick={() => handleTabChange("services")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "services"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Briefcase size={18} /> <span className="hidden md:inline">Dịch vụ</span>
              </button>

              <button
                onClick={() => handleTabChange("customers")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "customers"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Users size={18} /> <span className="hidden md:inline">Khách hàng</span>
              </button>

              <button
                onClick={() => handleTabChange("employees")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "employees"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ClipboardList size={18} /> <span className="hidden md:inline">Nhân viên</span>
              </button>

              <button style={{display:'none'}}
                onClick={() => handleTabChange("invoice")}
                className={`relative flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "invoice"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <FileText size={18} />
                <span className="hidden md:inline">Hóa đơn</span>
                {pendingCount > 0 && (
                  <span
                    title={`${pendingCount} hóa đơn chờ xác nhận`}
                    className="absolute right-3 md:right-4 top-2 md:top-2 bg-red-500 text-white text-[10px] leading-none px-1.5 py-1 rounded-full shadow"
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleTabChange("invoice")}
                className={`relative flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "invoice"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <FileText size={18} />
                <span className="hidden md:inline">Hóa đơn</span>
              </button>
            </>
          )}

          {role === "user" && (
            <>
              <button
                onClick={() => handleTabChange("info")}
                className={`flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer transition text-sm ${
                  activeTab === "info"
                    ? "bg-amber-500 text-white shadow"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <User size={18} /> <span className="hidden md:inline">Thông tin cá nhân</span>
              </button>

              <button
                onClick={() =>
                  setWarn({
                    open: true,
                    title: "Xoá tài khoản",
                    message: "Bạn có chắc muốn xoá tài khoản này? Hành động này không thể hoàn tác.",
                    onConfirm: handleDeleteAccount,
                  })
                }
                className="flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer text-red-600 hover:bg-red-50 transition text-sm"
              >
                <Trash2 size={18} /> <span className="hidden md:inline">Xoá tài khoản</span>
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start gap-2 w-full px-3 py-2 md:px-5 md:py-3 rounded-xl font-medium cursor-pointer text-red-600 hover:bg-red-50 transition text-sm"
          >
            <LogOut size={18} /> <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 md:p-10 mt-25 md:mt-0">
        {activeTab === "invoice" && <Invoices role={role} />}
        {role === "admin" && activeTab === "rooms" && <AdminRooms />}
        {role === "admin" && activeTab === "dashboard" && (
          <div className="mt-[85px] md:mt-0">
            <Dashboard role={role} />
          </div>
        )}
        {role === "admin" && activeTab === "services" && <AdminServices />}
        {role === "admin" && activeTab === "customers" && <AdminCustomer />}
        {role === "admin" && activeTab === "employees" && <AdminEmployee />}

        {/* Thông tin người dùng */}
        {role === "user" && activeTab === "info" && (
          <div className="flex justify-center items-center">
            <div className="bg-white/90 rounded-2xl shadow-lg p-4 md:p-8 w-full max-w-lg">
              <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 text-center">
                Thông tin người dùng
              </h1>
              <div className="space-y-5 text-sm md:text-base">
                <div>
                  <label className="block text-gray-700 mb-1">Họ tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div className="pt-4 text-center">
                  <button
                    onClick={handleUpdate}
                    disabled={!hasChanges}
                    className={`px-6 py-2 rounded-lg cursor-pointer shadow transition ${
                      hasChanges
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <WarnModal
        open={warn.open}
        title={warn.title}
        message={warn.message}
        onConfirm={() => {
          warn.onConfirm?.();
          setWarn({ open: false, title: "", message: "", onConfirm: null });
        }}
        onClose={() => setWarn({ open: false, title: "", message: "", onConfirm: null })}
      />
    </div>
  );
};

export default Profile;
