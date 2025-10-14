import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import WarnModal from "../components/WarnForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ⚙️ Helper chuyển đổi định dạng ngày
const toISODate = (d) =>
  d
    ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .slice(0, 10)
    : "";
const fromISODate = (s) => (s ? new Date(s + "T00:00:00") : null);

const DatPhongChiTiet = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showWarn, setShowWarn] = useState(false);
  const [room, setRoom] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    note: "",
  });
  const [noCheckOut, setNoCheckOut] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🧩 Lấy thông tin phòng
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/chi-tiet-phong/${id}`
        );
        setRoom(res.data.room);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin phòng:", err);
      }
    };
    fetchRoom();
  }, [id]);

  // ✅ Đưa useMemo lên trước mọi return
  const checkInDate = useMemo(() => fromISODate(formValues.checkIn), [formValues.checkIn]);
  const checkOutDate = useMemo(() => fromISODate(formValues.checkOut), [formValues.checkOut]);

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { name, phone, email, checkIn } = formValues;
    if (!name || !phone || !checkIn) {
      toast.error("Vui lòng nhập đầy đủ họ tên, số điện thoại và ngày nhận phòng.");
      return false;
    }
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Số điện thoại không hợp lệ.");
      return false;
    }
    if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      toast.error("Địa chỉ email không hợp lệ.");
      return false;
    }
    return true;
  };

  const createInvoice = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const payload = {
        name: formValues.name.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        note: formValues.note?.trim() || "",
        roomId: room._id,
        checkIn: formValues.checkIn,
        checkOut: formValues.checkOut || null,
        services: [],
      };
      await axios.post(`${BASE_URL}/tao-hoa-don`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đặt phòng thành công!");
      navigate("/");
    } catch (error) {
      console.error("Lỗi khi tạo hoá đơn:", error);
      toast.error("Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
      setShowWarn(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowWarn(true);
  };


  return (
    <div className="min-h-screen flex pt-20 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-8xl mx-auto rounded-3xl overflow-hidden gap-12 px-6 md:px-12">
        {/* 🧾 Form đặt phòng */}
        <div className="md:col-span-2 bg-white/95 p-10 flex flex-col justify-center shadow-lg rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center font-playfair">
            Đăng ký phòng
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="Họ và tên"
              className="w-full border border-gray-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-sm"
              required
            />
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border border-gray-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-sm"
            />
            <input
              type="tel"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className="w-full border border-gray-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-sm"
              required
            />

            {/* Ngày nhận phòng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày nhận phòng
              </label>
              <DatePicker
                selected={checkInDate}
                onChange={(date) =>
                  setFormValues((prev) => ({
                    ...prev,
                    checkIn: toISODate(date),
                    checkOut:
                      prev.checkOut && new Date(prev.checkOut) <= (date || new Date(0))
                        ? ""
                        : prev.checkOut,
                  }))
                }
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                locale={vi}
                placeholderText="Chọn ngày nhận phòng"
                className="w-full border border-gray-200 rounded-xl px-5 py-3 bg-white shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                required
              />
            </div>

            {/* Ngày trả phòng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày trả phòng
              </label>
              {!noCheckOut && (
                <DatePicker
                  selected={checkOutDate}
                  onChange={(date) =>
                    setFormValues((prev) => ({
                      ...prev,
                      checkOut: toISODate(date),
                    }))
                  }
                  minDate={
                    formValues.checkIn ? fromISODate(formValues.checkIn) : new Date()
                  }
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  placeholderText="Chọn ngày trả phòng"
                  className="w-full border border-gray-200 rounded-xl px-5 py-3 bg-white shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              )}
              <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={noCheckOut}
                  onChange={() => {
                    setNoCheckOut(!noCheckOut);
                    setFormValues((prev) => ({
                      ...prev,
                      checkOut: "",
                    }));
                  }}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-gray-600">Chưa xác định ngày trả phòng</span>
              </label>
            </div>

            <textarea
              name="note"
              value={formValues.note}
              onChange={handleChange}
              placeholder="Ghi chú (tuỳ chọn)"
              rows="4"
              className="w-full border border-gray-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-sm"
            ></textarea>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg cursor-pointer transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              {loading ? "Đang xử lý..." : "Đặt phòng ngay"}
            </button>
          </form>
        </div>

        {/* 🏨 Thông tin phòng */}
        <div className="md:col-span-1 bg-white/95 p-10 flex flex-col justify-center items-center shadow-lg rounded-2xl">
          <img
            src={
              room?.img ||
              "https://res.cloudinary.com/deevnyeis/image/upload/v1759223218/roomImg1_rvtovf.png"
            }
            alt="room"
            className="w-full h-[28rem] object-cover rounded-2xl shadow-lg mb-6"
          />
          <h3 className="text-3xl font-bold mb-2 text-gray-800">
            {room ? `Phòng số ${room.numberRoom}` : "Đang tải..."}
          </h3>
          <p className="text-2xl text-gray-700 mb-4 font-playfair tracking-wide">
            {room?.roomType === "ROOM_VIP" ? "Phòng VIP" : "Phòng Thường"} —{" "}
            {room?.bedType === "DOUBLE" ? "Phòng đôi" : "Phòng đơn"}
          </p>
          <p className="text-gray-600 mb-4 italic">
            SANG TRỌNG - TIỆN NGHI - ĐẲNG CẤP
          </p>
          <p className="text-3xl font-semibold text-red-500">
            {room?.price ? `${room.price.toLocaleString()} VNĐ/ngày` : ""}
          </p>
        </div>
      </div>

      {/* ⚠️ Modal xác nhận đặt phòng */}
      <WarnModal
        open={showWarn}
        title="Xác nhận đặt phòng"
        message={`Xác nhận đặt phòng ${room?.numberRoom}?`}
        onConfirm={createInvoice}
        onClose={() => setShowWarn(false)}
      />
    </div>
  );
};

export default DatPhongChiTiet;
