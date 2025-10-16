import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import AuthModal from "../components/AuthForm";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Suy ra origin cho socket nếu chưa set biến riêng
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (BASE_URL ? new URL(BASE_URL).origin : "");

const Navbar = () => {
  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Đặt phòng", path: "/dat-phong" },
    { name: "Dịch vụ", path: "/dich-vu" },
    { name: "Liên hệ", path: "/lien-he" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [role, setRole] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const location = useLocation();
  const { isLoggedIn, avatar } = useSelector((state) => state.user);

  // Theo dõi scroll
  useEffect(() => {
    if (location.pathname === "/") {
      setIsScrolled(false);
      const handleScroll = () => setIsScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
    setIsScrolled(true);
  }, [location.pathname]);

  // Fetch role & pendingCount nếu là admin/employee
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setRole("");
          setPendingCount(0);
          return;
        }

        const userRes = await axios.get(`${BASE_URL}/thong-tin-nguoi-dung`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userRole = userRes.data.role;
        setRole(userRole);

        if (["employee", "admin"].includes(userRole)) {
          const invoiceRes = await axios.get(`${BASE_URL}/toan-bo-hoa-don`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const count = (invoiceRes.data.invoices || []).filter(
            (inv) => inv.status === "Chờ xác nhận"
          ).length;

          setPendingCount(count);
        } else {
          setPendingCount(0);
        }
      } catch (err) {
        console.error("Lỗi khi lấy pendingCount:", err);
        setPendingCount(0);
      }
    };

    // Gọi một lần đầu ngay khi login/logout thay đổi
    fetchPending();

    // Kiểm tra lại mỗi 30s (nếu vẫn đang đăng nhập)
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) fetchPending();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Lắng nghe socket (dùng singleton, không disconnect khi unmount)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      if (role) socket.emit("registerRole", role);
    };
    const onDisconnect = () => {
      console.log("⚪ WebSocket disconnected");
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
    <>
      <nav
        className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${
          isScrolled
            ? "bg-white/50 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4"
            : "py-4 md:py-6"
        }`}
      >
        {/* Logo */}
        <div className="flex-1 flex items-center">
          <Link to="/">
            <img
              src={assets.logo}
              alt="logo"
              className={`h-8 ${isScrolled && "invert opacity-80"}`}
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 lg:gap-16 flex-1 justify-center">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              to={link.path}
              className={`group flex flex-col gap-0.5 text-lg font-semibold ${
                isScrolled ? "text-gray-700" : "text-white"
              }`}
            >
              {link.name}
              <div
                className={`${
                  isScrolled ? "bg-gray-700" : "bg-white"
                } h-0.5 w-0 group-hover:w-full transition-all duration-300`}
              />
            </Link>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          {!isLoggedIn ? (
            <button
              onClick={() => {
                setAuthMode("login");
                setIsAuthOpen(true);
              }}
              className="px-8 py-2.5 text-lg font-semibold rounded-full ml-4 transition-all duration-500 text-white bg-black hover:bg-gray-800 cursor-pointer"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="relative group">
              <Link to="/thong-tin-ca-nhan">
                <img
                  src={avatar}
                  alt="avatar"
                  className={`h-10 w-10 rounded-full cursor-pointer border-2 ${
                    ["employee", "admin"].includes(role) && pendingCount > 0
                      ? "border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                      : "border-gray-300"
                  }`}
                />
                {/* Badge nhỏ ở góc avatar */}
                {["employee", "admin"].includes(role) && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-ping-slow shadow">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(true)}>
            <img src={assets.menuIcon} alt="menu" className="h-6 w-6" />
          </button>
        </div>

        <div
          className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            className="absolute top-4 right-4"
            onClick={() => setIsMenuOpen(false)}
          >
            <img src={assets.closeIcon} alt="closeIcon" className="h-6" />
          </button>

          {navLinks.map((link, i) => (
            <Link key={i} to={link.path} onClick={() => setIsMenuOpen(false)}>
              {link.name}
            </Link>
          ))}

          {!isLoggedIn ? (
            <button
              onClick={() => {
                setAuthMode("login");
                setIsAuthOpen(true);
                setIsMenuOpen(false);
              }}
              className="px-8 py-2.5 text-lg font-semibold rounded-full transition-all duration-500 text-white bg-black hover:bg-gray-800 cursor-pointer"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link to="/thong-tin-ca-nhan">
                <img
                  src={avatar}
                  alt="avatar"
                  className={`h-10 w-10 rounded-full border-2 ${
                    ["employee", "admin"].includes(role) && pendingCount > 0
                      ? "border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                      : "border-gray-300"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                />
              </Link>
              {["employee", "admin"].includes(role) && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-ping-slow shadow">
                  {pendingCount}
                </span>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          switchMode={setAuthMode}
        />
      )}
    </>
  );
};

export default Navbar;

