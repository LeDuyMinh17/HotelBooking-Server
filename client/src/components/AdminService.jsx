import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Upload,
  ImagePlus,
} from "lucide-react";
import toast from "react-hot-toast";
import WarnModal from "../components/WarnForm";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    descShort: "",
    descLong: "",
    images: [],
  });

  const [warn, setWarn] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });


  // 🔸 Phân trang local
  const [page, setPage] = useState(1);
  const pageSize = 4; // hiển thị 6 dịch vụ mỗi trang

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 📦 Lấy danh sách dịch vụ
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/toan-bo-dich-vu");
      setServices(res.data.services || []);
    } catch (err) {
      console.error("Lỗi tải dịch vụ:", err);
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // 🧠 Upload ảnh
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + form.images.length > 4)
      return toast.error("Chỉ được chọn tối đa 4 ảnh!");
    setForm({ ...form, images: [...form.images, ...files] });
  };

  const uploadImagesToCloudinary = async (images) => {
    const uploadedUrls = [];
    for (const file of images) {
      if (typeof file === "string") {
        uploadedUrls.push(file);
        continue;
      }
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "hotel_uploads");
      try {
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/deevnyeis/image/upload",
          data
        );
        uploadedUrls.push(res.data.secure_url);
      } catch (err) {
        console.error("Lỗi upload ảnh:", err);
        toast.error("Lỗi upload ảnh lên Cloudinary!");
      }
    }
    return uploadedUrls;
  };

  // 🧱 Thêm / Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error("Nhập đủ thông tin!");

    try {
      setUploading(true);
      const uploadedUrls = await uploadImagesToCloudinary(form.images);
      const payload = { ...form, images: uploadedUrls };

      if (editing) {
        await api.put(`/sua-dich-vu/${editing._id}`, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await api.post("/them-dich-vu", payload);
        toast.success("Thêm thành công!");
      }

      resetForm();
      setShowForm(false);
      fetchServices();
    } catch (err) {
      toast.error("Lỗi khi lưu dịch vụ!");
    } finally {
      setUploading(false);
    }
  };

  // 🔄 Reset form
  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      price: "",
      descShort: "",
      descLong: "",
      images: [],
    });
  };

  // ✏️ Sửa
  const handleEdit = (svc) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      price: svc.price,
      descShort: svc.descShort,
      descLong: svc.descLong,
      images: svc.images || [],
    });
    if (!showForm) setShowForm(true);
  };

  // 🗑️ Xoá
  const handleDelete = (id, name) => {
    setWarn({
      open: true,
      title: "Xác nhận xoá dịch vụ",
      message: `Bạn có chắc chắn muốn xoá dịch vụ "${name}" không? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await api.delete(`/xoa-dich-vu/${id}`);
          toast.success("Xoá thành công!");
          fetchServices();
        } catch {
          toast.error("Không thể xoá dịch vụ này!");
        }
      },
    });
  };

  // 🔘 Toggle hiển thị
  const toggleAvailable = async (svc) => {
    try {
      await api.put(`/sua-dich-vu/${svc._id}`, {
        ...svc,
        isAvailable: !svc.isAvailable,
      });
      fetchServices();
    } catch {
      toast.error("Lỗi khi đổi trạng thái!");
    }
  };

  // 🗑️ Xoá ảnh trong form
  const removeImage = (i) => {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });
  };

  // 🔸 Tính toán phân trang local
  const totalPages = Math.max(1, Math.ceil(services.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedServices = services.slice(startIdx, endIdx);

  return (
    <div className="bg-white/95 rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Tiêu đề trang */}
      <h1 className="text-3xl font-playfair font-bold mb-6 text-gray-800">
        Quản lý dịch vụ
      </h1>

      {/* Sticky action bar */}
      <div className="sticky top-15 z-30 flex items-center gap-3 bg-white/80 backdrop-blur-sm py-3">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium cursor-pointer shadow-md transition ${
            showForm
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          {showForm ? <Minus size={18} /> : <Plus size={18} />}
          {showForm ? "Đóng form" : "Thêm dịch vụ"}
        </button>
        <button
          onClick={fetchServices}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium shadow-sm transition"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Form thêm / sửa dịch vụ */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-fadeIn relative">
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              <Minus size={18} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              {editing ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Tên dịch vụ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Giá tiền (VNĐ)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <textarea
                placeholder="Tiêu đề / mô tả ngắn"
                value={form.descShort}
                onChange={(e) =>
                  setForm({ ...form, descShort: e.target.value })
                }
                className="border rounded-xl px-4 py-3 text-[15px] leading-relaxed text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-300 focus:outline-none resize-none shadow-sm"
              />
              <textarea
                placeholder="Mô tả chi tiết"
                value={form.descLong}
                onChange={(e) =>
                  setForm({ ...form, descLong: e.target.value })
                }
                className="border rounded-xl px-4 py-4 min-h-[120px] text-[15px] leading-relaxed text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-300 focus:outline-none resize-none shadow-sm"
              />

              {/* Upload ảnh */}
              <div className="flex flex-col gap-3">
                <label className="font-medium text-sm text-gray-700">
                  Ảnh dịch vụ (tối đa 4)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
                >
                  <ImagePlus size={18} /> Chọn ảnh
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={
                            typeof img === "string"
                              ? img
                              : URL.createObjectURL(img)
                          }
                          alt="preview"
                          className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
                >
                  {editing ? <Edit2 size={16} /> : <Plus size={16} />}
                  {uploading
                    ? "Đang xử lý..."
                    : editing
                    ? "Cập nhật dịch vụ"
                    : "Thêm dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách dịch vụ */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Chưa có dịch vụ nào.</p>
      ) : (
        <>
          <div className="flex flex-col gap-5 mt-4">
            {pagedServices.map((svc) => (
              <div
                key={svc._id}
                className="border rounded-2xl p-5 shadow-md hover:shadow-xl transition-all bg-white"
              >
                {svc.images?.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {svc.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="service"
                        className="w-28 h-24 object-cover rounded-lg border shadow-sm"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {svc.name}
                  </h2>
                  <p className="text-amber-600 font-medium">
                    {svc.price.toLocaleString()} ₫
                  </p>
                  <p className="text-gray-600 text-sm mt-1">{svc.descShort}</p>
                </div>

                <div className="flex justify-between items-center mt-5">
                  <button
                    onClick={() => toggleAvailable(svc)}
                    className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer shadow-sm transition ${
                      svc.isAvailable
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {svc.isAvailable ? (
                      <>
                        <ToggleRight size={18} /> Còn dịch vụ
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={18} /> Hết dịch vụ
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(svc)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm flex cursor-pointer items-center gap-1 font-medium"
                    >
                      <Edit2 size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(svc._id, svc.name)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm flex cursor-pointer items-center gap-1 font-medium"
                    >
                      <Trash2 size={14} /> Xoá
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🔸 Phân trang local */}
          {services.length > pageSize && (
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
      )}

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

export default AdminServices;
