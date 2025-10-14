import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & filter UI (giữ nguyên)
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("");

  // ── Phân trang local: BẢNG KHÁCH HÀNG (mới thêm)
  const [customerPage, setCustomerPage] = useState(1);
  const customerPageSize = 10; // mỗi trang 10 khách

  // ── Phân trang local: BẢNG HOÁ ĐƠN TRONG MODAL (giữ nguyên)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem("token");
  // 🔹 Lấy toàn bộ khách hàng + tự tính tổng hóa đơn
useEffect(() => {
  const fetchCustomersWithStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/tat-ca-khach-hang`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const baseCustomers = res.data.customers || [];
      const customersWithStats = [];

      // 🔁 Duyệt tuần tự để tránh spam server
      for (const cust of baseCustomers) {
        try {
          const detailRes = await axios.get(
            `${BASE_URL}/chi-tiet/${cust._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const invoices = detailRes.data.invoices || [];

          const tongHoaDon = invoices.length;
          const tongTienThanhToan = invoices
            .filter((i) => i.status === "Đã thanh toán")
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

          customersWithStats.push({
            ...cust,
            stats: { tongHoaDon, tongTienThanhToan },
          });
        } catch (err) {
          console.warn(`Không lấy được chi tiết cho ${cust.name}:`, err.message);
          customersWithStats.push({
            ...cust,
            stats: { tongHoaDon: 0, tongTienThanhToan: 0 },
          });
        }
      }

      setCustomers(customersWithStats);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchCustomersWithStats();
}, []);


  // 🔎 Lọc + sắp xếp local (giữ nguyên logic)
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (search.trim()) {
      const kw = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(kw) ||
          c.email?.toLowerCase().includes(kw) ||
          c.phone?.toLowerCase().includes(kw)
      );
    }

    switch (sortType) {
      case "invoiceCountDesc":
        list.sort((a, b) => (b.stats?.tongHoaDon || 0) - (a.stats?.tongHoaDon || 0));
        break;
      case "invoiceCountAsc":
        list.sort((a, b) => (a.stats?.tongHoaDon || 0) - (b.stats?.tongHoaDon || 0));
        break;
      case "paidTotalDesc":
        list.sort(
          (a, b) => (b.stats?.tongTienThanhToan || 0) - (a.stats?.tongTienThanhToan || 0)
        );
        break;
      case "paidTotalAsc":
        list.sort(
          (a, b) => (a.stats?.tongTienThanhToan || 0) - (b.stats?.tongTienThanhToan || 0)
        );
        break;
      default:
      // giữ nguyên thứ tự
    }

    return list;
  }, [customers, search, sortType]);

  // Phân trang local: danh sách KHÁCH HÀNG (mới thêm)
  const {
    pagedCustomers,
    customerTotalPages,
    customerStartIdx,
  } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize));
    const safePage = Math.min(Math.max(1, customerPage), totalPages);
    const start = (safePage - 1) * customerPageSize;
    const end = start + customerPageSize;
    return {
      pagedCustomers: filteredCustomers.slice(start, end),
      customerTotalPages: totalPages,
      customerStartIdx: start,
    };
  }, [filteredCustomers, customerPage]);

  // Khi filter thay đổi → reset về trang 1 để tránh "trang rỗng"
  useEffect(() => {
    setCustomerPage(1);
  }, [search, sortType]);

  // 🔹 Xem chi tiết khách hàng (giữ nguyên flow) + tối ưu callback
  const handleViewDetail = useCallback(async (id) => {
    try {
      const res = await axios.get(`${BASE_URL}/chi-tiet/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const customer = res.data.customer;
      const invs = res.data.invoices || [];

      // Tính thống kê thực tế từ invoices (giữ nguyên logic modal)
      const tongHoaDon = invs.length;
      const choXacNhan = invs.filter((i) => i.status === "Chờ xác nhận").length;
      const choThanhToan = invs.filter((i) => i.status === "Chờ thanh toán").length;
      const daThanhToan = invs.filter((i) => i.status === "Đã thanh toán").length;
      const daHuy = invs.filter((i) => i.status === "Đã huỷ").length;
      const tongTienThanhToan = invs
        .filter((i) => i.status === "Đã thanh toán")
        .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

      const localStats = {
        tongHoaDon,
        choXacNhan,
        choThanhToan,
        daThanhToan,
        daHuy,
        tongTienThanhToan,
      };

      // Gán state cho modal (giữ nguyên UI)
      setSelectedCustomer(customer);
      setStats(localStats);
      setInvoices(invs);
      setPage(1);
      setShowModal(true);

      // Cập nhật lại customers bên ngoài để filter/sort hiển thị đúng (giữ nguyên)
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === id
            ? {
                ...c,
                stats: {
                  ...c.stats,
                  tongHoaDon: localStats.tongHoaDon,
                  tongTienThanhToan: localStats.tongTienThanhToan,
                },
              }
            : c
        )
      );
    } catch (err) {
      console.error("Lỗi khi xem chi tiết khách hàng:", err);
    }
  }, [token]);

  // Phân trang local cho bảng hoá đơn trong modal (giữ nguyên)
  const { totalPages, pagedInvoices } = useMemo(() => {
    const total = Math.max(1, Math.ceil(invoices.length / pageSize));
    const safePage = Math.min(Math.max(1, page), total);
    const startIdx = (safePage - 1) * pageSize;
    return {
      totalPages: total,
      pagedInvoices: invoices.slice(startIdx, startIdx + pageSize),
    };
  }, [invoices, page]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-600 text-lg animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-3xl shadow-xl p-8 border border-gray-200">
      <h1 className="text-3xl font-playfair font-bold mb-6 text-gray-800">
        Quản lý khách hàng
      </h1>

      {/* Accordion Filter trên mobile (giữ nguyên) */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowFilter((p) => !p)}
          className="w-full flex justify-between items-center bg-gradient-to-r from-amber-50 to-white px-4 py-3 rounded-xl border shadow-sm font-medium"
        >
          Bộ lọc khách hàng
          <span className={`transform transition ${showFilter ? "rotate-180" : ""}`}>▼</span>
        </button>

        {showFilter && (
          <div className="mt-3 p-4 bg-white rounded-xl border shadow-inner space-y-4">
            {/* Tìm kiếm */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tìm kiếm</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên / Email / SĐT..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Sắp xếp tổng hoá đơn */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tổng hoá đơn
              </label>
              <select
                value={sortType.startsWith("invoiceCount") ? sortType : ""}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="">Mặc định</option>
                <option value="invoiceCountDesc">Nhiều → Ít</option>
                <option value="invoiceCountAsc">Ít → Nhiều</option>
              </select>
            </div>

            {/* Sắp xếp tổng tiền */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tổng tiền đã thanh toán
              </label>
              <select
                value={sortType.startsWith("paidTotal") ? sortType : ""}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="">Mặc định</option>
                <option value="paidTotalDesc">Nhiều → Ít</option>
                <option value="paidTotalAsc">Ít → Nhiều</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Layout chính 2/3 - 1/3 (giữ nguyên UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Bảng khách hàng (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md p-4 md:p-6 overflow-x-auto">
          {filteredCustomers.length === 0 ? (
            <p className="text-gray-500 italic">Không tìm thấy khách hàng nào.</p>
          ) : (
            <>
              <table className="min-w-full text-sm md:text-base">
                <thead className="bg-gradient-to-r from-amber-100 to-amber-50 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">STT</th>
                    <th className="py-3 px-4 text-left">Tên người dùng</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Số điện thoại</th>
                    <th className="py-3 px-4 text-center">Tổng hoá đơn</th>
                    <th className="py-3 px-4 text-center">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCustomers.map((c, i) => (
                    <tr
                      key={c._id}
                      className={`border-t border-gray-200 hover:bg-amber-50 transition ${
                        (customerStartIdx + i) % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {customerStartIdx + i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                      <td className="text-center font-semibold text-gray-700">
                        {c.stats?.tongHoaDon || 0}
                      </td>
                      <td className="text-center py-3">
                        <button
                          onClick={() => handleViewDetail(c._id)}
                          className="px-4 py-1 bg-amber-500 text-white rounded-lg cursor-pointer hover:bg-amber-600 transition"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Phân trang local cho KHÁCH HÀNG (mới thêm) */}
              {filteredCustomers.length > customerPageSize && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                    disabled={customerPage === 1}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-50 text-sm"
                  >
                    ← Trước
                  </button>
                  <span className="text-gray-600 text-sm">
                    Trang {customerPage}/{customerTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCustomerPage((p) => Math.min(customerTotalPages, p + 1))
                    }
                    disabled={customerPage === customerTotalPages}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-50 text-sm"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bộ lọc (1/3 - desktop) (giữ nguyên UI) */}
        <div className="hidden lg:block bg-gradient-to-br from-amber-50 to-white border border-gray-200 rounded-2xl shadow-inner p-5 sticky top-24 h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex justify-between">
            Bộ lọc
            <button
              onClick={() => {
                setSearch("");
                setSortType("");
              }}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
            >
              Xoá
            </button>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên / Email / SĐT..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tổng hoá đơn
              </label>
              <select
                value={sortType.startsWith("invoiceCount") ? sortType : ""}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="">Mặc định</option>
                <option value="invoiceCountDesc">Nhiều → Ít</option>
                <option value="invoiceCountAsc">Ít → Nhiều</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tổng tiền đã thanh toán
              </label>
              <select
                value={sortType.startsWith("paidTotal") ? sortType : ""}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="">Mặc định</option>
                <option value="paidTotalDesc">Nhiều → Ít</option>
                <option value="paidTotalAsc">Ít → Nhiều</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 🪟 Modal chi tiết khách hàng (GIỮ NGUYÊN UI) */}
      {showModal && selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-5xl relative max-h-[90vh] overflow-y-auto transform scale-95 animate-zoomIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Góc trên bên phải */}
            <div className="absolute top-5 right-5 flex items-center gap-5">
              {/* Toggle kích hoạt đăng nhập */}
              <div
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await axios.patch(
                      `${BASE_URL}/kich-hoat-dang-nhap/${selectedCustomer._id}`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success(res.data.message);
                    setSelectedCustomer((prev) => ({
                      ...prev,
                      isActive: res.data.isActive,
                    }));
                  } catch (err) {
                    toast.error("Lỗi.");
                  }
                }}
                className={`relative w-14 h-7 flex items-center rounded-full cursor-pointer transition-colors ${
                  selectedCustomer?.isActive ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    selectedCustomer?.isActive ? "translate-x-7" : ""
                  }`}
                ></div>
              </div>
              <span
                className={`text-sm font-medium ${
                  selectedCustomer?.isActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                {selectedCustomer?.isActive ? "Đang hoạt động" : "Bị khoá"}
              </span>

              {/* Nút đóng modal */}
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 cursor-pointer hover:text-red-500 cursor-pointer text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Header (giữ nguyên) */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-700 font-playfair">
                Họ tên: {selectedCustomer.name}
              </h2>
              <p className="text-xl font-bold text-gray-700 font-playfair">
                Email: {selectedCustomer.email}
              </p>
              <p className="text-xl font-bold text-gray-700 font-playfair">
                SĐT: {selectedCustomer.phone}
              </p>
            </div>

            {/* Thống kê (giữ nguyên) */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <div className="bg-gray-50 p-3 rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-gray-500">Tổng</p>
                  <p className="text-lg font-bold text-gray-700">{stats.tongHoaDon}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-gray-500">Chờ xác nhận</p>
                  <p className="text-lg font-bold text-yellow-700">{stats.choXacNhan}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-gray-500">Chờ thanh toán</p>
                  <p className="text-lg font-bold text-blue-700">{stats.choThanhToan}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-gray-500">Đã thanh toán</p>
                  <p className="text-lg font-bold text-green-700">{stats.daThanhToan}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-gray-500">Đã huỷ</p>
                  <p className="text-lg font-bold text-red-700">{stats.daHuy}</p>
                </div>
              </div>
            )}

            {/* Danh sách hoá đơn (giữ nguyên UI) */}
            <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
              Danh sách hoá đơn
            </h3>

            {invoices.length > 0 ? (
              <>
                <table className="min-w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="py-2 px-3 text-left">Mã hoá đơn</th>
                      <th className="py-2 px-3 text-left">Khách hàng</th>
                      <th className="py-2 px-3 text-left">Ngày đặt phòng</th>
                      <th className="py-2 px-3 text-left">Ngày trả phòng</th>
                      <th className="py-2 px-3 text-right">Tổng tiền</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                      <th className="py-2 px-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInvoices.map((inv, idx) => (
                      <tr
                        key={inv._id}
                        className={`border-t ${idx % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
                      >
                        <td className="px-3 py-2 text-gray-800 font-semibold">
                          #{inv._id.slice(-6)}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{inv.customerId?.name}</p>
                        </td>
                        <td className="px-3 py-2">
                          {new Date(inv.checkIn).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          {inv.checkOut
                            ? new Date(inv.checkOut).toLocaleDateString("vi-VN")
                            : "Chưa xác định"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {inv.totalAmount?.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              inv.status === "Đã thanh toán"
                                ? "bg-green-100 text-green-700"
                                : inv.status === "Chờ xác nhận"
                                ? "bg-yellow-100 text-yellow-700"
                                : inv.status === "Chờ thanh toán"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() =>
                              window.open(`/chi-tiet-hoa-don/${inv._id}`, "_blank")
                            }
                            className="px-3 py-1 text-xs bg-amber-500 text-white rounded-lg cursor-pointer hover:bg-amber-600"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 🔸 Phân trang local cho HOÁ ĐƠN (giữ nguyên) */}
                {invoices.length > pageSize && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-50 text-sm"
                    >
                      ← Trước
                    </button>
                    <span className="text-gray-600 text-sm">
                      Trang {page}/{totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-50 text-sm"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 italic text-sm mt-3">
                Khách hàng này chưa có hoá đơn nào.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomer;
