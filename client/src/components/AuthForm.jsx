import React, { useState, useEffect } from "react";
import axios from "axios";
import { authAction } from "../redux/slice.js";
import { useDispatch } from "react-redux";
import { X } from "lucide-react"; // icon đóng
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthModal = ({ mode, onClose, switchMode }) => {
  const [animateClass, setAnimateClass] = useState("animate-slideDown");
  const [waitingVerify, setWaitingVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [Values, setValues] = useState({
    email: "",
    password: "",
  });

  const [registerValues, setRegisterValues] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const dispatch = useDispatch();

  useEffect(() => {
    setAnimateClass(mode === "login" ? "animate-slideRight" : "animate-slideLeft");
  }, [mode]);

  const change = (e) => {
    setValues({
      ...Values,
      [e.target.name]: e.target.value,
    });
  };

  // Đăng nhập
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (!Values.email || !Values.password) {
        toast.error("Thiếu thông tin");
        return;
      }

      const response = await axios.post(`${BASE_URL}/dang-nhap`, Values);
      dispatch(authAction.login());
      dispatch(authAction.changeRole(response.data.role));
      dispatch(authAction.setAvatar(response.data.avatar));

      localStorage.setItem("id", response.data.id);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("avatar", response.data.avatar);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, phone, email, password, confirmPassword } = registerValues;

    if (!name || !phone || !email || !password || !confirmPassword)
      return toast.error("Thiếu thông tin!");

    if (password !== confirmPassword) return toast.error("Mật khẩu nhập lại không khớp!");

    alert("Đã ấn nút đăng ký!")

    try {
      const res = await axios.post(`${BASE_URL}/dang-ky`, {
        name,
        phone,
        email,
        password,
        role: "user",
      });

      toast.success(res.data.message);
      setRegisteredEmail(email);
      setWaitingVerify(true);

      setResendCooldown(30);
      const t = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(t);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-8 transform ${animateClass}`}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
        >
          <X size={24} />
        </button>

        {waitingVerify ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Nhập mã xác minh</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Mã đã gửi tới <b>{registeredEmail}</b>. Kiểm tra email (kể cả thư rác).
            </p>

            <input
              type="text"
              placeholder="Nhập mã 6 chữ số"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:ring-2 focus:ring-primary focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!verifyCode) return toast.error("Vui lòng nhập mã xác minh.");
                  try {
                    const r = await axios.post(`${BASE_URL}/verify-email`, {
                      email: registeredEmail,
                      code: verifyCode,
                    });
                    toast.error(r.data.message);
                    setWaitingVerify(false);
                    setVerifyCode("");
                    switchMode("login");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Xác minh thất bại");
                  }
                }}
                className="flex-1 bg-primary text-white py-3 cursor-pointer rounded-lg"
              >
                Xác minh
              </button>

              <button
                onClick={async () => {
                  if (resendCooldown > 0) return;
                  try {
                    const r = await axios.post(`${BASE_URL}/resend-code`, {
                      email: registeredEmail,
                    });
                    toast.success(r.data.message);
                    setResendCooldown(30);
                    const t = setInterval(() => {
                      setResendCooldown((s) => {
                        if (s <= 1) {
                          clearInterval(t);
                          return 0;
                        }
                        return s - 1;
                      });
                    }, 1000);
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Không thể gửi lại mã");
                  }
                }}
                className="bg-gray-200 px-4 py-3 cursor-pointer rounded-lg"
              >
                {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại mã"}
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3 text-center">
              Nếu không nhận được email, kiểm tra thư rác hoặc liên hệ quản trị.
            </p>
          </>
        ) : mode === "login" ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng nhập</h2>
            <form className="space-y-5" onSubmit={submit}>
              {/* đổi từ type="email" → type="text" */}
              <input
                type="text"
                name="email"
                placeholder="Tên đăng nhập hoặc email..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                required
                value={Values.email}
                onChange={change}
              />
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                required
                value={Values.password}
                onChange={change}
              />
              <div className="text-right mt-2">
                <span
                  onClick={() => toast.error("Chức năng quên mật khẩu sẽ cập nhật sau")}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Quên mật khẩu
                </span>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white font-medium py-3 rounded-lg shadow-md hover:bg-primary/90 transition cursor-pointer"
              >
                Đăng nhập
              </button>
            </form>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Chưa có tài khoản?{" "}
              <span
                onClick={() => switchMode("register")}
                className="text-primary cursor-pointer hover:underline"
              >
                Đăng ký ngay
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng ký</h2>
            <form className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
                value={registerValues.name}
                onChange={(e) =>
                  setRegisterValues({
                    ...registerValues,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                value={registerValues.phone}
                onChange={(e) =>
                  setRegisterValues({
                    ...registerValues,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Email (để xác minh)"
                value={registerValues.email}
                onChange={(e) =>
                  setRegisterValues({
                    ...registerValues,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={registerValues.password}
                onChange={(e) =>
                  setRegisterValues({
                    ...registerValues,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={registerValues.confirmPassword}
                onChange={(e) =>
                  setRegisterValues({
                    ...registerValues,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                type="submit"
                onClick={handleRegister}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg shadow-md cursor-pointer hover:bg-primary/90 transition"
              >
                Đăng ký
              </button>
            </form>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Đã có tài khoản?{" "}
              <span
                onClick={() => switchMode("login")}
                className="text-primary cursor-pointer hover:underline"
              >
                Đăng nhập ngay
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
