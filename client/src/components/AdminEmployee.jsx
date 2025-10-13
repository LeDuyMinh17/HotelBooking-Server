import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import WarnModal from "../components/WarnForm";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [warn, setWarn] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const token = localStorage.getItem("token");

  // 🧩 Fetch danh sách nhân viên
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/tat-ca-nhan-vien`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const base = res.data.employees || [];

      // Gọi song song để tính tổng hoá đơn từng nhân viên
      const enriched = await Promise.all(
        base.map(async (emp) => {
          try {
            const detail = await axios.get(
              `${BASE_URL}/hoa-don-nhan-vien/${emp._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const created = detail.data.createdInvoices || [];
            const paid = detail.data.paidInvoices || [];
            const unique = new Set([...created, ...paid].map((i) => i._id?.toString()));
            return { ...emp, totalInvoices: unique.size };
          } catch {
            return { ...emp, totalInvoices: 0 };
          }
        })
      );

      setEmployees(enriched);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách nhân viên:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 🧩 Xem chi tiết nhân viên
  const handleViewDetail = useCallback(
    async (id) => {
      try {
        const res = await axios.get(`${BASE_URL}/hoa-don-nhan-vien/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const empDetail = res.data;
        setSelectedEmployee(empDetail);
        setStats({
          totalCreated: empDetail.createdInvoices?.length || 0,
          totalPaid: empDetail.paidInvoices?.length || 0,
        });
        setShowModal(true);
      } catch (err) {
        console.error("Lỗi khi xem chi tiết nhân viên:", err);
      }
    },
    [token]
  );

  // 🧩 Mở form thêm/sửa
  const handleAdd = () => {
    setIsEditing(false);
    setFormData({ name: "", email: "", phone: "", password: "" });
    setShowForm(true);
  };

  const handleEdit = (emp) => {
    setIsEditing(true);
    setEditId(emp._id); // ✅ thêm dòng này
    setFormData({ name: emp.name, email: emp.email, phone: emp.phone, password: "" });
    setShowForm(true);
  };

  // 🧩 Lưu nhân viên (thêm hoặc sửa)
  const handleSave = async () => {
    try {
      const url = isEditing
        ? `${BASE_URL}/admin-cap-nhat-nhan-vien/${editId}`
        : `${BASE_URL}/admin-them-nhan-vien`;

      const method = isEditing ? axios.put : axios.post; // ✅ bổ sung dòng này

      await method(
        url,
        { ...formData, ...(isEditing ? {} : { role: "employee" }) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isEditing ? "Cập nhật thông tin thành công!" : "Thêm nhân viên thành công!");
      setShowForm(false);
      fetchEmployees(); // reload lại danh sách nhẹ (nếu có)
    } catch (err) {
      console.error("Lỗi khi lưu nhân viên:", err);
      toast.error("Lỗi khi lưu dữ liệu.");
    }
  };


  // 🧩 Xoá nhân viên
  const handleDelete = (id, name) => {
    setWarn({
      open: true,
      title: "Xác nhận xoá nhân viên",
      message: `Bạn có chắc chắn muốn xoá nhân viên "${name}" không? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          const res = await axios.delete(
            `${BASE_URL}/xoa-nhan-vien/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setEmployees((prev) => prev.filter((e) => e._id !== id));
          toast.success(res.data.message || "Đã xoá nhân viên thành công!");
          setWarn({ open: false, title: "", message: "", onConfirm: null });
        } catch (err) {
          console.error(err);
          toast.error("Không thể xoá nhân viên.");
        }
      },
    });
  };


  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-600 text-lg animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );

  return (
    <div className="bg-white/90 rounded-3xl shadow-xl p-8 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý nhân viên</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-green-500 cursor-pointer hover:bg-green-600 text-white rounded-lg shadow"
        >
          + Thêm nhân viên
        </button>
      </div>

      {/* Danh sách nhân viên */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 md:p-6 overflow-x-auto">
        {employees.length === 0 ? (
          <p className="text-gray-500 italic">Không tìm thấy nhân viên nào.</p>
        ) : (
          <table className="min-w-full text-sm md:text-base">
            <thead className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">STT</th>
                <th className="py-3 px-4 text-left">Tên nhân viên</th>
                <th className="py-3 px-4 text-left">Tài khoản</th>
                <th className="py-3 px-4 text-left">SĐT</th>
                <th className="py-3 px-4 text-center">Tổng hoá đơn</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr
                  key={e._id}
                  className={`border-t hover:bg-blue-50 transition ${
                    i % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                  <td className="px-4 py-3 text-gray-600">{e.email}</td>
                  <td className="px-4 py-3 text-gray-600">{e.phone}</td>
                  <td className="text-center font-semibold text-gray-700">{e.totalInvoices ?? 0}</td>
                  <td className="text-center py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleViewDetail(e._id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(e)}
                      className="px-3 py-1 bg-yellow-400 text-white rounded-lg cursor-pointer hover:bg-yellow-500 text-xs"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(e._id, e.name)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600 text-xs"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal chi tiết */}
      {showModal && selectedEmployee && (
        <EmployeeDetailModal
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee} 
          stats={stats}
          setShowModal={setShowModal}
        />
      )}

      {/* Modal thêm/sửa */}
      {showForm && (
        <EmployeeFormModal
          isEditing={isEditing}
          editId={editId}   
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
          setShowForm={setShowForm}
        />
      )}
      {/* ✅ Thêm WarnModal ngay trong return */}
      {warn.open && (
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
      )}
    </div>
  );
};

// ============================
// Modal chi tiết nhân viên (có local pagination)
// ============================
const EmployeeDetailModal = ({ selectedEmployee, setSelectedEmployee, stats, setShowModal }) => {
  const [pageCreated, setPageCreated] = useState(1);
  const [pagePaid, setPagePaid] = useState(1);
  const pageSize = 8;

  const { createdPageData, paidPageData, createdTotal, paidTotal } = useMemo(() => {
    const calc = (list, page) => {
      const total = Math.ceil((list?.length || 0) / pageSize) || 1;
      const start = (page - 1) * pageSize;
      return { data: list.slice(start, start + pageSize), total };
    };
    const c = calc(selectedEmployee.createdInvoices || [], pageCreated);
    const p = calc(selectedEmployee.paidInvoices || [], pagePaid);
    return {
      createdPageData: c.data,
      createdTotal: c.total,
      paidPageData: p.data,
      paidTotal: p.total,
    };
  }, [selectedEmployee, pageCreated, pagePaid]);

  const token = localStorage.getItem("token");

  const toggleActive = async () => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/kich-hoat-dang-nhap/${selectedEmployee.employee._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Giờ sẽ chạy được vì modal có props setSelectedEmployee
      setSelectedEmployee((prev) => ({
        ...prev,
        employee: { ...prev.employee, isActive: res.data.isActive },
      }));

    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Không thể thay đổi trạng thái hoạt động.");
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-6xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex justify-between items-center mb-8">
        {/* Thông tin nhân viên */}
        <div>
          <h2 className="text-xl font-bold text-gray-700">
            {selectedEmployee.employee?.name}
          </h2>
          <p className="text-gray-600">{selectedEmployee.employee?.email}</p>
          <p className="text-gray-600">{selectedEmployee.employee?.phone}</p>
        </div>

        {/* Toggle + trạng thái + nút đóng */}
        <div className="flex items-center gap-4">
          {/* Nút bật/tắt */}
          <div
            onClick={toggleActive}
            className={`relative w-14 h-7 flex items-center rounded-full cursor-pointer transition-colors ${
              selectedEmployee.employee?.isActive ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                selectedEmployee.employee?.isActive ? "translate-x-7" : ""
              }`}
            ></div>
          </div>

          {/* Trạng thái chữ */}
          <span
            className={`text-sm font-medium ${
              selectedEmployee.employee?.isActive ? "text-green-600" : "text-gray-500"
            }`}
          >
            {selectedEmployee.employee?.isActive ? "Đang hoạt động" : "Bị khoá"}
          </span>

          {/* Nút đóng modal */}
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-red-500 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

        {/* Thống kê */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-gray-50 p-3 rounded-lg border text-center shadow-sm">
              <p className="text-xs text-gray-500">Đã tạo</p>
              <p className="text-lg font-bold text-gray-700">{stats.totalCreated}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border text-center shadow-sm">
              <p className="text-xs text-gray-500">Đã thanh toán</p>
              <p className="text-lg font-bold text-green-700">{stats.totalPaid}</p>
            </div>
          </div>
        )}

        {/* Hai bảng hóa đơn */}
        <InvoiceTable title="Hoá đơn đã tạo" list={createdPageData} />
        <Pagination page={pageCreated} totalPages={createdTotal} setPage={setPageCreated} />
        <InvoiceTable title="Hoá đơn đã thanh toán" list={paidPageData} />
        <Pagination page={pagePaid} totalPages={paidTotal} setPage={setPagePaid} />
      </div>
    </div>
  );
};

// ============================
// Component bảng hoá đơn
// ============================
const InvoiceTable = ({ title, list }) => (
  <>
    <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">{title}</h3>
    {list.length ? (
      <table className="min-w-full text-sm border border-gray-100 rounded-xl overflow-hidden mb-8">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="py-2 px-3 text-left">Mã</th>
            <th className="py-2 px-3 text-left">Khách hàng</th>
            <th className="py-2 px-3 text-left">Ngày đặt</th>
            <th className="py-2 px-3 text-left">Ngày trả</th>
            <th className="py-2 px-3 text-right">Tổng tiền</th>
            <th className="py-2 px-3 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {list.map((inv, i) => (
            <tr key={inv._id} className={`${i % 2 ? "bg-gray-50" : ""}`}>
              <td className="px-3 py-2 font-semibold text-gray-700">#{inv._id.slice(-6)}</td>
              <td className="px-3 py-2">{inv.customerId?.name}</td>
              <td className="px-3 py-2">{new Date(inv.checkIn).toLocaleDateString("vi-VN")}</td>
              <td className="px-3 py-2">
                {inv.checkOut ? new Date(inv.checkOut).toLocaleDateString("vi-VN") : "Chưa trả"}
              </td>
              <td className="px-3 py-2 text-right">{inv.totalAmount?.toLocaleString("vi-VN")} ₫</td>
              <td className="px-3 py-2 text-center">{inv.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 italic mb-8">Không có dữ liệu.</p>
    )}
  </>
);

// ============================
// Pagination
// ============================
const Pagination = ({ page, totalPages, setPage }) => (
  <div className="flex justify-center items-center gap-4 mb-8">
    <button
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 text-sm"
    >
      ← Trước
    </button>
    <span className="text-gray-600 text-sm">
      Trang {page}/{totalPages}
    </span>
    <button
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 text-sm"
    >
      Sau →
    </button>
  </div>
);

// ============================
// Form thêm/sửa nhân viên
// ============================
const EmployeeFormModal = ({ isEditing, editId, formData, setFormData, handleSave, setShowForm }) => (
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
    onClick={() => setShowForm(false)}
  >
    <div
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-6 text-gray-700 text-center">
        {isEditing ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
      </h2>

      <div className="space-y-4">
        {["name", "email", "phone"].map((f) => (
          <input
            key={f}
            type={f === "email" ? "email" : "text"}
            placeholder={f === "name" ? "Họ tên" : f === "email" ? "Tài khoản" : "Số điện thoại"}
            value={formData[f]}
            onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        ))}
        {!isEditing && (
          <input
            type="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Huỷ
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          {isEditing ? "Lưu thay đổi" : "Thêm mới"}
        </button>
      </div>
    </div>
  </div>
);

export default AdminEmployee;
