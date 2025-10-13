import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ⚙️ Helper chuyển đổi định dạng ngày dùng chung
const fromISODate = (s) => (s ? new Date(s + "T00:00:00") : null);
const toISODate = (d) =>
  d
    ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .slice(0, 10)
    : "";

// ✅ SAFE_PARSE để đọc dữ liệu filter từ localStorage an toàn
const SAFE_PARSE = (str, fallback) => {
  try {
    if (!str || str === "undefined" || str === "null") return fallback;
    const obj = JSON.parse(str);
    return obj && typeof obj === "object" ? { ...fallback, ...obj } : fallback;
  } catch {
    return fallback;
  }
};

const AdminInvoices = ({ role }) => {
  const token = localStorage.getItem("token");

  // Default filter
  const defaultFilters = {
    status: "",
    checkInFrom: "",
    checkInTo: "",
    checkOutFrom: "",
    checkOutTo: "",
    totalMin: 0,
    totalMax: 100000000,
    search: "",
    sortOrder: "none",
    createdByRole: "", 
    paidByRole: "",
  };

  const [filters, setFilters] = useState(() =>
    SAFE_PARSE(localStorage.getItem("invoiceFilters"), defaultFilters)
  );
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(filters.search || "");
  const [page, setPage] = useState(1);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const pageSize = 8;

  // 🧩 Cập nhật filter + lưu localStorage
  const handleFilterChange = (update) => {
    setFilters((prev) => {
      const next =
        typeof update === "function" ? update(prev) : { ...prev, ...update };
      localStorage.setItem("invoiceFilters", JSON.stringify(next));
      return next;
    });
    setPage(1);
  };

  // Reset filter
  const resetFilters = () => {
    localStorage.removeItem("invoiceFilters");
    setFilters(defaultFilters);
    setSearchText("");
    setPage(1);
  };

  // 🧾 Lấy danh sách hóa đơn
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const url =
          role === "admin" || role === "employee"
            ? `${BASE_URL}/toan-bo-hoa-don`
            : `${BASE_URL}/xem-hoa-don`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data.invoices || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách hoá đơn:", error);
      } finally {
        setLoading(false);
      }
    };
    if (role) fetchInvoices();
  }, [role, token]);

  useEffect(() => {
    const refetchInvoices = async () => {
      try {
        const url =
          role === "admin" || role === "employee"
            ? `${BASE_URL}/toan-bo-hoa-don`
            : `${BASE_URL}/xem-hoa-don`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error("Lỗi refetch sau khi cập nhật:", err);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "invoice_updated") {
        refetchInvoices();
      }
    };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, [role, token]);


  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => handleFilterChange({ search: searchText }), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // 🔍 Lọc + sắp xếp
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchStatus = !filters.status || inv.status === filters.status;
      const matchCheckIn =
        (!filters.checkInFrom ||
          new Date(inv.checkIn) >= new Date(filters.checkInFrom)) &&
        (!filters.checkInTo ||
          new Date(inv.checkIn) <= new Date(filters.checkInTo));

      const matchCheckOut =
        (!filters.checkOutFrom ||
          (inv.checkOut &&
            new Date(inv.checkOut) >= new Date(filters.checkOutFrom))) &&
        (!filters.checkOutTo ||
          (inv.checkOut &&
            new Date(inv.checkOut) <= new Date(filters.checkOutTo)));

      const matchTotal =
        (!filters.totalMin || inv.totalAmount >= Number(filters.totalMin)) &&
        (!filters.totalMax || inv.totalAmount <= Number(filters.totalMax));

      const kw = String(filters.search || "").trim().toLowerCase();
      const matchSearch =
        !kw ||
        inv._id?.toLowerCase().includes(kw) ||
        inv.customerId?.name?.toLowerCase().includes(kw) ||
        inv.customerId?.phone?.includes(kw) ||
        inv.customerId?.email?.toLowerCase().includes(kw);

      const matchCreatedBy =
        !filters.createdByRole ||
        (inv.createdBy?.role === filters.createdByRole);

      const matchPaidBy =
        !filters.paidByRole ||
        (inv.paidBy?.role === filters.paidByRole);


      return matchStatus && matchCheckIn && matchCheckOut && matchTotal && matchSearch && matchCreatedBy && matchPaidBy;
    })
    .sort((a, b) => {
      if (filters.sortOrder === "total-high") return b.totalAmount - a.totalAmount;
      if (filters.sortOrder === "total-low") return a.totalAmount - b.totalAmount;
      if (filters.sortOrder === "date-new")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (filters.sortOrder === "date-old")
        return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pagedInvoices = filteredInvoices.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-8 relative">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair border-b pb-3 md:pb-4">
        {role === "employee" ? "Danh sách hoá đơn cần xử lý" : "Lịch sử hoá đơn"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Danh sách hóa đơn */}
        <div className="lg:col-span-2 bg-white/90 rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100 order-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <p className="text-gray-600 text-base md:text-lg animate-pulse">
                Đang tải hoá đơn...
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>Không tìm thấy hoá đơn</p>
            </div>
          ) : (
            <>
              <div className="space-y-5 md:space-y-6">
                {pagedInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className={`border rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                      invoice.status === "Chờ xác nhận"
                        ? "border-amber-400 bg-amber-50"
                        : invoice.status === "Chờ thanh toán"
                        ? "border-yellow-400 bg-yellow-50"
                        : invoice.status === "Đã thanh toán"
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 font-playfair">
                          Hoá đơn #{invoice._id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          Ngày tạo:{" "}
                          {new Date(invoice.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-gray-600 text-sm md:text-base">
                          <span className="font-medium">Phòng:</span>{" "}
                          {invoice.roomId?.numberRoom}
                        </p>
                        <p className="text-gray-600 text-sm md:text-base">
                          <span className="font-medium">Khách hàng:</span>{" "}
                          {invoice.customerId?.name}
                        </p>
                        <p className="text-gray-600 text-sm md:text-base">
                          <span className="font-medium">Tổng:</span>{" "}
                          {invoice.totalAmount.toLocaleString()}₫
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-right">
                        <span
                          className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-semibold ${
                            invoice.status === "Đã thanh toán"
                              ? "bg-green-100 text-green-700"
                              : invoice.status === "Chờ thanh toán"
                              ? "bg-amber-100 text-amber-700"
                              : invoice.status === "Chờ xác nhận"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {invoice.status}
                        </span>

                        <button
                          onClick={() =>
                            window.open(`/chi-tiet-hoa-don/${invoice._id}`, "_blank")
                          }
                          className="px-4 py-1.5 text-xs md:text-sm font-medium bg-amber-500 text-white rounded-lg cursor-pointer hover:bg-amber-600 shadow-sm transition-all"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {filteredInvoices.length > pageSize && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-lg disabled:opacity-50 text-sm"
                  >
                    ← Trước
                  </button>
                  <span className="text-gray-600 text-sm">
                    Trang {page}/{totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-lg disabled:opacity-50 text-sm"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* MOBILE Filter */}
        <div className="lg:hidden order-1 border border-gray-200 rounded-2xl shadow-md bg-gradient-to-br from-amber-50 to-white">
          <div className="bg-amber-100/90 backdrop-blur-md border-b border-gray-300 rounded-t-2xl">
            <button
              onClick={() => setShowMobileFilter((p) => !p)}
              className="w-full flex justify-between items-center px-5 py-3 font-semibold text-gray-800"
            >
              <span>Bộ lọc hoá đơn</span>
              <span>{showMobileFilter ? "▲" : "▼"}</span>
            </button>
          </div>

          <div
            className={`transition-all duration-300 ${
              showMobileFilter
                ? "max-h-[70vh] opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh] bg-white/90">
              <FilterContent
                filters={filters}
                handleFilterChange={handleFilterChange}
                resetFilters={resetFilters}
                role={role} 
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block order-3 bg-gradient-to-br from-amber-50 to-white border border-gray-200 rounded-2xl shadow-inner p-4 md:p-6 h-fit sticky top-24">
          <FilterContent
            filters={filters}
            handleFilterChange={handleFilterChange}
            resetFilters={resetFilters}
            role={role} 
          />
        </div>
      </div>
    </div>
  );
};

// ================== 🧠 FILTER SIDEBAR ==================
const FilterContent = ({ filters, handleFilterChange, resetFilters, role }) => {
  const checkInFromDate = useMemo(
    () => fromISODate(filters.checkInFrom),
    [filters.checkInFrom]
  );
  const checkInToDate = useMemo(
    () => fromISODate(filters.checkInTo),
    [filters.checkInTo]
  );
  const checkOutFromDate = useMemo(
    () => fromISODate(filters.checkOutFrom),
    [filters.checkOutFrom]
  );
  const checkOutToDate = useMemo(
    () => fromISODate(filters.checkOutTo),
    [filters.checkOutTo]
  );

  return (
    <>
      <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
        <span>Bộ lọc hoá đơn</span>
        <button
          onClick={resetFilters}
          className="text-xs px-2 py-1 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded text-gray-700"
        >
          Xoá
        </button>
      </h2>

      {/* 🔍 Tìm kiếm */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tìm kiếm
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder="Tên / Email / SĐT..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Trạng thái */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trạng thái
        </label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
        >
          <option value="">Tất cả</option>
          <option value="Chờ xác nhận">Chờ xác nhận</option>
          <option value="Chờ thanh toán">Chờ thanh toán</option>
          <option value="Đã thanh toán">Đã thanh toán</option>
          <option value="Đã huỷ">Đã huỷ</option>
        </select>
      </div>

      {/* Ngày nhận phòng */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày nhận phòng
        </label>
        <div className="flex flex-col gap-3">
          <DatePicker
            selected={checkInFromDate}
            onChange={(date) =>
              handleFilterChange({
                checkInFrom: toISODate(date),
                checkInTo:
                  filters.checkInTo &&
                  new Date(filters.checkInTo) <= (date || new Date(0))
                    ? ""
                    : filters.checkInTo,
              })
            }
            dateFormat="dd/MM/yyyy"
            locale={vi}
            placeholderText="Từ ngày"
            className="border rounded-lg px-3 py-2 text-sm w-full bg-white shadow-sm focus:ring-2 focus:ring-amber-400"
          />
          <DatePicker
            selected={checkInToDate}
            onChange={(date) => handleFilterChange({ checkInTo: toISODate(date) })}
            minDate={checkInFromDate}
            dateFormat="dd/MM/yyyy"
            locale={vi}
            placeholderText="Đến ngày"
            className="border rounded-lg px-3 py-2 text-sm w-full bg-white shadow-sm focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Ngày trả phòng */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày trả phòng
        </label>
        <div className="flex flex-col gap-3">
          <DatePicker
            selected={checkOutFromDate}
            onChange={(date) =>
              handleFilterChange({
                checkOutFrom: toISODate(date),
                checkOutTo:
                  filters.checkOutTo &&
                  new Date(filters.checkOutTo) <= (date || new Date(0))
                    ? ""
                    : filters.checkOutTo,
              })
            }
            dateFormat="dd/MM/yyyy"
            locale={vi}
            placeholderText="Từ ngày"
            className="border rounded-lg px-3 py-2 text-sm w-full bg-white shadow-sm focus:ring-2 focus:ring-amber-400"
          />
          <DatePicker
            selected={checkOutToDate}
            onChange={(date) => handleFilterChange({ checkOutTo: toISODate(date) })}
            minDate={checkOutFromDate}
            dateFormat="dd/MM/yyyy"
            locale={vi}
            placeholderText="Đến ngày"
            className="border rounded-lg px-3 py-2 text-sm w-full bg-white shadow-sm focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Khoảng giá (₫)
        </label>
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min="0"
            max="100000000"
            step="100000"
            value={filters.totalMin || 0}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              if (newMin >= (filters.totalMax || 100000000) - 500000) return;
              handleFilterChange({ totalMin: newMin });
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="100000000"
            step="100000"
            value={filters.totalMax || 100000000}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              if (newMax <= (filters.totalMin || 0) + 500000) return;
              handleFilterChange({ totalMax: newMax });
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex justify-between text-sm text-gray-700">
            <span>{Number(filters.totalMin || 0).toLocaleString()} ₫</span>
            <span>{Number(filters.totalMax || 100000000).toLocaleString()} ₫</span>
          </div>
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sắp xếp
        </label>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange({ sortOrder: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
        >
          <option value="none">Mặc định</option>
          <option value="total-high">Tổng tiền: Cao → Thấp</option>
          <option value="total-low">Tổng tiền: Thấp → Cao</option>
          <option value="date-new">Ngày tạo: Mới → Cũ</option>
          <option value="date-old">Ngày tạo: Cũ → Mới</option>
        </select>
      </div>
      
      {/* Chỉ hiển thị khi là Admin */}
      {role === "admin" && (
        <>
          {/* Người đặt */}
          <div className="mb-4 mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người đặt
            </label>
            <select
              value={filters.createdByRole}
              onChange={(e) => handleFilterChange({ createdByRole: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="user">Khách hàng</option>
              <option value="employee">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Người thanh toán */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người thanh toán
            </label>
            <select
              value={filters.paidByRole}
              onChange={(e) => handleFilterChange({ paidByRole: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="employee">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </>
      )}
    </>
  );
};

export default AdminInvoices;
