import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import WarnModal from "../components/WarnForm";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

/* ===== Helpers ===== */
const normalizeYMD = (s) => (s ? String(s).slice(0, 10) : "");
const parseYMD = (s) => {
  const ymd = normalizeYMD(s);
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const formatYMD = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const cmp = (a, b) => {
  const da = parseYMD(a);
  const db = parseYMD(b);
  if (!da || !db) return NaN;
  return da.setHours(0, 0, 0, 0) - db.setHours(0, 0, 0, 0);
};
const isAfter = (a, b) => cmp(a, b) > 0;
const isBefore = (a, b) => cmp(a, b) < 0;

/* ===== Main Component ===== */
const InvoiceDetail = () => {
  const { id } = useParams();
  const printRef = useRef();
  const printAreaRef = useRef();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [invoice, setInvoice] = useState(null);
  const [originalInvoice, setOriginalInvoice] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState("");
  const [warn, setWarn] = useState({ open: false, title: "", message: "", onConfirm: null });

  /* ===== Fetch data ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [userRes, invoiceRes, serviceRes] = await Promise.all([
          axios.get(`${BASE_URL}/thong-tin-nguoi-dung`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/chi-tiet-hoa-don/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/toan-bo-dich-vu`),
        ]);
        setRole(userRes.data.role);
        setInvoice(invoiceRes.data.invoice);
        setOriginalInvoice(invoiceRes.data.invoice);
        setServicesList(serviceRes.data.services || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  /* ===== Tính tiền lại ===== */
  const recalcTotals = (data, isPaying = false) => {
  if (!data || !data.roomId) return data;

  const today = new Date();
  const start = data.checkIn ? new Date(data.checkIn) : null;
  let end = data.checkOut ? new Date(data.checkOut) : null;

  // ❌ Nếu chưa có ngày nhận => không tính được
  if (!start) {
    return {
      ...data,
      roomCharge: data.roomCharge ?? 0,
      serviceCharge: data.serviceCharge ?? 0,
      totalAmount: data.totalAmount ?? 0,
    };
  }

  // ⚙️ Nếu chưa có ngày trả phòng
  if (!end) {
    if (start > today) {
      // Ngày nhận ở tương lai → chưa đến ngày nhận
      if (isPaying) toast.error("Chưa đến ngày nhận phòng.");
      return {
        ...data,
        roomCharge: 0,
        serviceCharge: 0,
        totalAmount: 0,
      };
    }
    // Nếu ngày nhận <= hôm nay → tính đến hôm nay
    end = today;
  }

  // 🧮 Tính số ngày ở
  const diffDays = Math.ceil((end - start) / 86400000);
  const days = diffDays > 0 ? diffDays : 1;

  // 💰 Tiền phòng
  const roomCharge = (data.roomId?.price || 0) * days;

  // 💰 Tiền dịch vụ
  const serviceCharge = (data.services || []).reduce((sum, s) => {
    const price = s?.serviceId?.price || 0;
    const qty = Number(s?.quantity || 0);
    if (!price || !qty || !s?.startDate) return sum;

    const sStart = new Date(s.startDate);
    const sEnd = s.endDate ? new Date(s.endDate) : sStart;
    const sDiff = Math.ceil((sEnd - sStart) / 86400000);
    const sDays = sDiff > 0 ? sDiff : 1;
    return sum + price * qty * sDays;
  }, 0);

  return {
    ...data,
    ...(isPaying && !data.checkOut ? { checkOut: formatYMD(end) } : {}),
    roomCharge,
    serviceCharge,
    totalAmount: roomCharge + serviceCharge,
  };
};


  const setInvoiceSafe = (updater, isPaying = false) => {
    setInvoice((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (!next?.roomId || !next?.checkIn) return next;
      return recalcTotals(next, isPaying);
    });
  };

  /* ===== Cập nhật thông tin ===== */
  const handleChangeCustomer = (field, value) => {
    setInvoiceSafe((p) => ({
      ...p,
      customerId: { ...(p.customerId || {}), [field]: value },
    }));
  };
  const handleChangeDate = (field, value) =>
    setInvoiceSafe((prev) => ({ ...prev, [field]: normalizeYMD(value) }));
  const handleServiceChange = (i, field, value) => {
    setInvoiceSafe((prev) => {
      const next = { ...prev, services: [...(prev.services || [])] };
      const cur = { ...next.services[i] };
      if (field === "serviceId") {
        const sv = servicesList.find((s) => s._id === value);
        cur.serviceId = sv ? { _id: sv._id, name: sv.name, price: sv.price } : { name: "", price: 0 };
      } else if (field === "quantity") cur.quantity = Math.max(1, Number(value || 1));
      else cur[field] = normalizeYMD(value);
      next.services[i] = cur;
      return next;
    });
  };
  const addService = () => {
    setInvoiceSafe((p) => ({
      ...p,
      services: [
        ...(p.services || []),
        {
          serviceId: { name: "", price: 0 },
          quantity: 1,
          startDate: p.checkIn || "",
          endDate: "",
        },
      ],
    }));
  };
  const removeService = (i) =>
    setInvoiceSafe((p) => ({
      ...p,
      services: (p.services || []).filter((_, idx) => idx !== i),
    }));

  /* ===== Lưu (validate 4 rule) ===== */
  const handleSave = async () => {
    try {
      if (!invoice.checkIn) return toast.error("Thiếu ngày nhận phòng.");
      if (invoice.checkOut && !isAfter(invoice.checkOut, invoice.checkIn))
        return toast.error("Ngày trả phòng phải sau ngày nhận phòng.");

      for (const s of invoice.services || []) {
        if (s.startDate && invoice.checkIn && isBefore(s.startDate, invoice.checkIn))
          return toast.error("Ngày bắt đầu dịch vụ không được trước ngày nhận phòng.");
        if (s.startDate && s.endDate && !isAfter(s.endDate, s.startDate))
          return toast.error("Ngày kết thúc dịch vụ phải sau ngày bắt đầu.");
        if (s.endDate && invoice.checkOut && isAfter(s.endDate, invoice.checkOut))
          return toast.error("Ngày kết thúc dịch vụ không được sau ngày trả phòng.");
      }

      const token = localStorage.getItem("token");
      await axios.patch(`${BASE_URL}/hoa-don/${id}/cap-nhat`, invoice, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Cập nhật thành công!");
      broadcastInvoiceChange();
      setOriginalInvoice(invoice);
      setIsEditing(false);
    } catch (err) {
      console.error("Lỗi lưu:", err);
      toast.error("Không thể cập nhật hoá đơn.");
    }
  };

  /* ===== Thanh toán / trạng thái / refetch ===== */
  const refreshInvoice = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${BASE_URL}/chi-tiet-hoa-don/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoice(res.data.invoice);
    } catch (e) {
      console.error("Refresh invoice failed:", e);
    }
  };

  const handlePay = async () => {
    try {
      const token = localStorage.getItem("token");
      const updatedInvoice = recalcTotals(invoice, true);

      // Nếu tổng tiền = 0 vì chưa đến ngày nhận phòng thì chặn thanh toán
      if (updatedInvoice.totalAmount === 0 && !invoice.checkOut && new Date(invoice.checkIn) > new Date()) {
        toast.error("Chưa đến ngày nhận phòng, không thể thanh toán.");
        return;
      }

      const res = await axios.patch(
        `${BASE_URL}/hoa-don/${id}/thanh-toan`,
        updatedInvoice,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Thanh toán thành công!");
      broadcastInvoiceChange();
      await refreshInvoice();
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      toast.error("Không thể thanh toán hoá đơn.");
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BASE_URL}/hoa-don/${id}/trang-thai`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Cập nhật trạng thái thành công!");
      broadcastInvoiceChange();
      await refreshInvoice();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  const handleCancelEdit = () => {
    setInvoice(originalInvoice);
    setIsEditing(false);
  };

  /* ===== In PDF (chỉ khi đã thanh toán) ===== */
  const handlePrint = async () => {
    if (invoice.status !== "Đã thanh toán") {
      toast.error("Chỉ có thể in hoá đơn khi đã thanh toán.");
      return;
    }
    try {
      const node = printAreaRef.current;
      if (!node) return;
      node.classList.add("print-sanitize");
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      node.classList.remove("print-sanitize");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((r) => (img.onload = r));
      const imgWidth = pageWidth - 20;
      const imgHeight = (img.height * imgWidth) / img.width;
      pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(`HoaDon_${id.slice(-6).toUpperCase()}.pdf`);
    } catch (e) {
      console.error("In PDF lỗi:", e);
      toast.error("Không thể xuất PDF.");
    }
  };

  /* ===== Render ===== */
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 text-lg animate-pulse">Đang tải hoá đơn...</p>
      </div>
    );

  if (!invoice)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg">Không tìm thấy hoá đơn.</p>
      </div>
    );

  const { customerId, roomId, services, checkIn, checkOut, roomCharge, serviceCharge, totalAmount, status, createdAt, note, bookedBy, paidBy } = invoice;
  const canEdit = (role === "employee" || role === "admin") && status !== "Đã thanh toán";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-white py-16 px-6">
      <div
        ref={printRef}
        className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-10 border border-gray-200"
      >
        <div ref={printAreaRef}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-gray-900">
                Chi tiết hoá đơn
              </h1>
              <p className="text-gray-500 mt-1">
                Mã hoá đơn:{" "}
                <span className="font-semibold text-gray-700">
                  #{id.slice(-6).toUpperCase()}
                </span>
              </p>
              <p className="text-gray-500">
                Ngày tạo:{" "}
                <span className="font-semibold text-gray-700">
                  {createdAt
                    ? new Date(createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Không rõ"}
                </span>
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() =>
                  isEditing ? handleCancelEdit() : setIsEditing(true)
                }
                className={`px-4 py-2 text-sm font-medium rounded-lg shadow transition ${
                  isEditing
                    ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {isEditing ? "Huỷ chỉnh sửa" : "Chỉnh sửa"}
              </button>
            )}
          </div>

          {/* Thông tin khách hàng */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">
              Thông tin khách hàng
            </h2>

            {["name", "email", "phone"].map((f) => (
              <p key={f}>
                <span className="font-medium capitalize">{f}:</span>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.customerId?.[f] || ""}
                    onChange={(e) => handleChangeCustomer(f, e.target.value)}
                    className="border-b border-gray-400 focus:outline-none px-2"
                  />
                ) : (
                  invoice.customerId?.[f]
                )}
              </p>
            ))}

            <p>
              <span className="font-medium">Ghi chú:</span>{" "}
              {isEditing ? (
                <input
                  type="text"
                  value={note || ""}
                  onChange={(e) =>
                    setInvoiceSafe((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Nhập ghi chú..."
                  className="border-b border-gray-400 focus:outline-none px-2 w-1/2 italic"
                />
              ) : (
                <span className="italic text-gray-600">
                  {note && note.trim() ? note : "Không có ghi chú"}
                </span>
              )}
            </p>
          </div>

          {/* Thông tin phòng */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">
              Thông tin phòng
            </h2>

            <p>
              <span className="font-medium">Phòng số:</span> {roomId?.numberRoom}
            </p>

            <p>
              <span className="font-medium">Loại phòng:</span>{" "}
              {roomId?.roomType === "ROOM_VIP"
                ? "Phòng VIP"
                : roomId?.roomType === "ROOM_NORMAL"
                ? "Phòng thường"
                : "-"}
            </p>

            <p>
              <span className="font-medium">Loại giường:</span>{" "}
              {roomId?.bedType === "DOUBLE"
                ? "Phòng đôi"
                : roomId?.bedType === "SINGLE"
                ? "Phòng đơn"
                : "-"}
            </p>

            <p>
              <span className="font-medium">Giá phòng:</span>{" "}
              {roomId?.price?.toLocaleString()} VNĐ/ngày
            </p>

            <p>
              <span className="font-medium">Ngày nhận phòng:</span>{" "}
              {isEditing ? (
                <DatePicker
                  selected={parseYMD(invoice.checkIn)}
                  onChange={(date) => handleChangeDate("checkIn", formatYMD(date))}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  className="border rounded px-2 py-1"
                />
              ) : (
                <span>
                  {checkIn
                    ? new Date(checkIn).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              )}
              <span className="ml-2">
                12:00 am
              </span>
            </p>

            <p>
              <span className="font-medium">Ngày trả phòng:</span>{" "}
              {isEditing ? (
                <DatePicker
                  selected={parseYMD(invoice.checkOut)}
                  onChange={(date) => handleChangeDate("checkOut", formatYMD(date))}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  className="border rounded px-2 py-1"
                />
              ) : (
                <span>
                  {checkOut
                    ? new Date(checkOut).toLocaleDateString("vi-VN")
                    : "Chưa xác định"}
                </span>
              )}

              {/* Chỉ hiển thị 12:00 pm khi có ngày trả phòng */}
              {checkOut && <span className="ml-2">12:00 am</span>}
            </p>
          </div>

          {/* Dịch vụ */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Dịch vụ đã chọn
            </h3>

            {(services?.length || 0) > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                <table className="min-w-full bg-white text-sm md:text-base">
                  <thead className="bg-gradient-to-r from-amber-100 to-amber-50 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left whitespace-nowrap">
                        Dịch vụ
                      </th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">
                        Số lượng
                      </th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">
                        Ngày bắt đầu
                      </th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">
                        Ngày kết thúc
                      </th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">
                        Thành tiền (₫)
                      </th>
                      {isEditing && <th className="py-3 px-4"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => {
                      const start = s.startDate ? new Date(s.startDate) : null;
                      const end = s.endDate ? new Date(s.endDate) : start;
                      const ms = start && end ? Math.max(0, end - start) : 0;
                      const days = start
                        ? Math.max(1, Math.ceil(ms / 86400000))
                        : 0;
                      const price = s.serviceId?.price || 0;
                      const qty = Number(s.quantity || 0);
                      const total = start ? price * qty * days : 0;

                      return (
                        <tr
                          key={i}
                          className={`border-t border-gray-200 hover:bg-amber-50 transition ${
                            i % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={s.serviceId?._id || ""}
                                onChange={(e) =>
                                  handleServiceChange(i, "serviceId", e.target.value)
                                }
                                className="border rounded-lg px-2 py-1 w-full md:w-auto focus:ring-amber-300 focus:border-amber-400"
                              >
                                <option value="">-- Chọn dịch vụ --</option>
                                {servicesList
                                  .filter((sv) => sv.isAvailable)
                                  .map((sv) => (
                                    <option key={sv._id} value={sv._id}>
                                      {sv.name} ({sv.price.toLocaleString()}₫)
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <span className="font-medium">
                                {s.serviceId?.name || "-"}
                              </span>
                            )}
                          </td>

                          <td className="text-center py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={s.quantity}
                                onChange={(e) =>
                                  handleServiceChange(i, "quantity", e.target.value)
                                }
                                className="border rounded-lg px-2 py-1 w-16 text-center focus:ring-amber-300 focus:border-amber-400"
                              />
                            ) : (
                              <span>{s.quantity}</span>
                            )}
                          </td>

                          <td className="text-center py-3 whitespace-nowrap">
                            {isEditing ? (
                              <DatePicker
                                selected={parseYMD(s.startDate)}
                                onChange={(date) =>
                                  handleServiceChange(i, "startDate", formatYMD(date))
                                }
                                dateFormat="dd/MM/yyyy"
                                locale={vi}
                                className="border rounded-lg px-2 py-1 focus:ring-amber-300 focus:border-amber-400"
                              />
                            ) : (
                              <span>
                                {s.startDate
                                  ? new Date(s.startDate).toLocaleDateString("vi-VN")
                                  : "-"}
                              </span>
                            )}
                          </td>

                          <td className="text-center py-3 whitespace-nowrap">
                            {isEditing ? (
                              <DatePicker
                                selected={parseYMD(s.endDate)}
                                onChange={(date) =>
                                  handleServiceChange(i, "endDate", formatYMD(date))
                                }
                                dateFormat="dd/MM/yyyy"
                                locale={vi}
                                className="border rounded-lg px-2 py-1 focus:ring-amber-300 focus:border-amber-400"
                              />
                            ) : s.endDate ? (
                              <span>
                                {new Date(s.endDate).toLocaleDateString("vi-VN")}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="text-center font-semibold text-gray-800 py-3 whitespace-nowrap">
                            {total.toLocaleString("vi-VN")}
                          </td>

                          {isEditing && (
                            <td className="text-center py-3">
                              <button
                                onClick={() => removeService(i)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-red-600 transition"
                              >
                                X
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">Chưa có dịch vụ nào.</p>
            )}

            {isEditing && (
              <button
                onClick={addService}
                className="mt-3 px-5 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition shadow-sm"
              >
                + Thêm dịch vụ
              </button>
            )}
          </div>

          {/* Tổng kết */}
          <div className="border-t pt-6 mt-10 text-right text-gray-700">
            <p>
              Tiền phòng: <b>{(roomCharge || 0).toLocaleString()} VNĐ</b>
            </p>
            <p>
              Tiền dịch vụ: <b>{(serviceCharge || 0).toLocaleString()} VNĐ</b>
            </p>
            <p className="text-xl font-bold mt-3">
              Tổng cộng:{" "}
              <span className="text-amber-600">
                {(totalAmount || 0).toLocaleString()} VNĐ
              </span>
            </p>
          </div>
        

          <div className="no-print">
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              {/* In hoá đơn */}
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer rounded-xl shadow"
              >
                In hoá đơn
              </button>

              <div className="flex gap-3 ml-auto">
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600"
                  >
                    Lưu thay đổi
                  </button>
                )}

                {!isEditing && (role === "admin" || role === "employee") && (
                  <>
                    {status === "Chờ xác nhận" && (
                      <>
                        <button
                          onClick={() =>
                            setWarn({
                              open: true,
                              title: "Cảnh báo",
                              message: "Xác nhận hoá đơn",
                              onConfirm: () => updateStatus("Chờ thanh toán"),
                            })
                          }
                          className="px-6 py-2 font-bold bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
                        >
                          Xác nhận
                        </button>

                        <button
                          onClick={() =>
                            setWarn({
                              open: true,
                              title: "Cảnh báo",
                              message: "Xác nhận huỷ hoá đơn",
                              onConfirm: () => updateStatus("Đã huỷ"),
                            })
                          }
                          className="px-6 py-2 font-bold bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600"
                        >
                          Huỷ
                        </button>
                      </>
                    )}

                    {status === "Chờ thanh toán" && (
                      <button
                        onClick={() =>
                          setWarn({
                            open: true,
                            title: "Cảnh báo",
                            message: "Xác nhận thanh toán hóa đơn",
                            onConfirm: handlePay,
                          })
                        }
                        className="px-6 py-2 font-bold bg-green-500 text-white cursor-pointer rounded-lg hover:bg-green-600"
                      >
                        Thanh toán
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 itali">
            Người đặt hoá đơn: {bookedBy || "Không rõ"}
          </p>
          {paidBy && (
            <p className="text-xs text-gray-500 italic mt-1">
              Nhân viên thanh toán: {paidBy?.name || "Không rõ"}
            </p>
          )}
        </div>
      </div>

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

const broadcastInvoiceChange = () => {
  localStorage.setItem("invoice_updated", Date.now());
};

export default InvoiceDetail;
