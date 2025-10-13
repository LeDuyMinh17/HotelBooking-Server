import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [activeInvoices, setActiveInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoiceId: "",
    quantity: 1,
    startDate: null,
    endDate: null,
  });

  // 🧾 Lấy chi tiết dịch vụ
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/chi-tiet-dich-vu/${id}`
        );
        setService(res.data.service);
        setMainImage(res.data.service.images[0]);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết dịch vụ:", err);
        toast.error("Không thể tải dịch vụ.");
      }
    };
    fetchService();
  }, [id]);

  // 🧾 Lấy danh sách hoá đơn còn hiệu lực
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/xem-hoa-don`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const active = res.data.invoices.filter(
          (inv) =>
            inv.status === "Chờ xác nhận" || inv.status === "Chờ thanh toán"
        );

        setActiveInvoices(active);
        if (active.length > 0)
          setFormData((prev) => ({ ...prev, invoiceId: active[0]._id }));
      } catch (error) {
        console.warn("Không tìm thấy hoá đơn hợp lệ:", error);
      }
    };
    fetchInvoices();
  }, []);

  // 🧾 Gửi form đặt dịch vụ
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceId || !formData.startDate)
      return toast.error("Vui lòng chọn hóa đơn và ngày bắt đầu.");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${BASE_URL}/them-dich-vu-vao-hoa-don`,
        {
          invoiceId: formData.invoiceId,
          serviceId: service._id,
          quantity: Number(formData.quantity),
          startDate: formData.startDate.toISOString().split("T")[0],
          endDate: formData.endDate
            ? formData.endDate.toISOString().split("T")[0]
            : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message);
    } catch (error) {
      console.error("Lỗi khi đặt dịch vụ:", error);
      toast.error("Không thể đặt dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  if (!service)
    return (
      <p className="pt-20 text-center text-gray-600 animate-pulse">
        Đang tải dịch vụ...
      </p>
    );

  const selectedInvoice = activeInvoices.find(
    (inv) => inv._id === formData.invoiceId
  );

  const checkIn = selectedInvoice?.checkIn
    ? new Date(selectedInvoice.checkIn)
    : null;
  const checkOut = selectedInvoice?.checkOut
    ? new Date(selectedInvoice.checkOut)
    : null;

  return (
    <div className="py-28 px-4 md:px-16 lg:px-24 xl:px-32 max-w-7xl mx-auto">
      {/* Tiêu đề + trạng thái */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900">
          {service.name}
        </h1>
        <span
          className={`px-4 py-1 rounded-full text-sm font-medium shadow-sm ${
            service.isAvailable
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {service.isAvailable ? "Còn dịch vụ" : "Hết dịch vụ"}
        </span>
      </div>

      {/* Hình ảnh */}
      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        <div className="lg:w-2/3 w-full">
          <img
            src={mainImage}
            alt="service-main"
            className="w-full h-[400px] md:h-[500px] rounded-2xl shadow-xl object-cover"
          />
        </div>
        {service?.images.length > 1 && (
          <div className="lg:w-1/3 w-full grid grid-cols-3 lg:grid-cols-1 gap-4">
            {service.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="service-thumbnail"
                onClick={() => setMainImage(image)}
                className={`w-full h-28 lg:h-32 object-cover rounded-xl shadow-md cursor-pointer transition ${
                  mainImage === image
                    ? "ring-4 ring-amber-400"
                    : "hover:opacity-80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thông tin cơ bản */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-10 gap-4">
        <h2 className="text-2xl md:text-3xl font-playfair text-gray-800 leading-snug max-w-2xl">
          {service.descShort}
        </h2>
        <p className="text-xl font-bold text-amber-600 whitespace-nowrap">
          {service.price.toLocaleString()} VNĐ/người
        </p>
      </div>

      {/* Mô tả dài */}
      <div className="mt-6 text-gray-700 text-base leading-relaxed max-w-3xl whitespace-pre-line">
        {service.descLong}
      </div>

      {/* Form đặt dịch vụ */}
      {service.isAvailable && (
        <div className="mt-12 bg-white/90 p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Đặt dịch vụ
          </h3>

          {activeInvoices.length > 0 ? (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {/* Chọn phòng */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-2">Chọn phòng</label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceId: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400"
                >
                  {activeInvoices.map((inv) => (
                    <option key={inv._id} value={inv._id}>
                      Phòng {inv.roomId?.numberRoom || "?"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày bắt đầu */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-2">Ngày bắt đầu</label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: date,
                      endDate:
                        prev.endDate && date && prev.endDate <= date
                          ? null
                          : prev.endDate,
                    }))
                  }
                  minDate={checkIn}
                  maxDate={checkOut}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  placeholderText="Chọn ngày bắt đầu"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>

              {/* Ngày kết thúc */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-2">Ngày kết thúc</label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, endDate: date }))
                  }
                  minDate={
                    formData.startDate
                      ? new Date(formData.startDate.getTime() + 86400000)
                      : checkIn
                  }
                  maxDate={checkOut}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  placeholderText="Chọn ngày kết thúc"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>

              {/* Số lượng */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-2">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-4 flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 rounded-xl font-medium text-white shadow-md cursor-pointer transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {loading ? "Đang xử lý..." : "Xác nhận đặt dịch vụ"}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-red-600 font-medium text-lg">
              ⚠️ Bạn cần đặt phòng trước khi sử dụng dịch vụ.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;
