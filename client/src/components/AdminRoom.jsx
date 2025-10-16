import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import WarnModal from "../components/WarnForm";

const roomTypeLabel = {
  ROOM_NORMAL: "Phòng thường",
  ROOM_VIP: "Phòng VIP",
};
const bedTypeLabel = {
  SINGLE: "Phòng đơn",
  DOUBLE: "Phòng đôi",
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    numberRoom: "",
    roomType: "ROOM_NORMAL",
    bedType: "DOUBLE",
    price: "",
  });

  const [warn, setWarn] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });


  // 🔸 Phân trang local
  const [page, setPage] = useState(1);
  const pageSize = 6; // mỗi trang hiển thị 6 phòng

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 🧩 Lấy danh sách phòng
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tat-ca-phong");
      setRooms(res.data.rooms || []);
    } catch (err) {
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 🧱 Thêm / sửa
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numberRoom || !form.price)
      return toast.error("Thiếu thông tin!");

    try {
      if (editingRoom) {
        await api.put(`/sua-phong/${editingRoom._id}`, form);
        toast.success("Cập nhật phòng thành công!");
      } else {
        await api.post("/them-phong", form);
        toast.success("Thêm phòng thành công!");
      }
      setForm({
        numberRoom: "",
        roomType: "ROOM_NORMAL",
        bedType: "DOUBLE",
        price: "",
      });
      setEditingRoom(null);
      setShowForm(false);
      fetchRooms();
    } catch (err) {
      toast.error("Lỗi khi lưu phòng");
    }
  };

  const handleDelete = (id, numberRoom) => {
    setWarn({
      open: true,
      title: "Xác nhận xoá phòng",
      message: `Bạn có chắc chắn muốn xoá phòng ${numberRoom} không? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await api.delete(`/xoa-phong/${id}`);
          toast.success("Đã xoá phòng thành công!");
          fetchRooms();
        } catch {
          toast.error("Không thể xoá phòng này!");
        }
      },
    });
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setForm({
      numberRoom: room.numberRoom,
      roomType: room.roomType,
      bedType: room.bedType,
      price: room.price,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setForm({
      numberRoom: "",
      roomType: "ROOM_NORMAL",
      bedType: "DOUBLE",
      price: "",
    });
    setShowForm(false);
  };

  // 🔍 Lọc danh sách phòng
  const filteredRooms = rooms.filter(
    (r) =>
      r.numberRoom.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType.toLowerCase().includes(search.toLowerCase())
  );

  // 🔸 Phân trang local (slice dữ liệu)
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedRooms = filteredRooms.slice(startIdx, endIdx);

  // Reset về trang đầu mỗi khi tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="bg-white/95 rounded-2xl shadow-lg p-6 border border-gray-100 relative">
      {/* Header */}
      <h1 className="text-3xl font-playfair font-bold mb-6 text-gray-800">
        Quản lý phòng
      </h1>

      {/* Sticky control bar */}
      <div className="sticky top-15 z-40 flex flex-wrap gap-3 items-center bg-white/90 backdrop-blur-sm py-3">
        <button
          onClick={() => {
            setEditingRoom(null);
            setShowForm((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium cursor-pointer shadow-md transition ${
            showForm
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          {showForm ? <Minus size={18} /> : <Plus size={18} />}
          {showForm ? "Đóng form" : "Thêm phòng"}
        </button>

        <button
          onClick={fetchRooms}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer shadow-sm transition"
        >
          <RefreshCw size={16} /> Làm mới
        </button>

        <div className="relative flex-1 min-w-[250px] md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Overlay Form */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn">
            {/* Close */}
            <button
              onClick={cancelEdit}
              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              <Minus size={18} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
              {editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Số phòng"
                value={form.numberRoom}
                onChange={(e) =>
                  setForm({ ...form, numberRoom: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.roomType}
                  onChange={(e) =>
                    setForm({ ...form, roomType: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="ROOM_NORMAL">Phòng thường</option>
                  <option value="ROOM_VIP">Phòng VIP</option>
                </select>

                <select
                  value={form.bedType}
                  onChange={(e) =>
                    setForm({ ...form, bedType: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="SINGLE">Phòng đơn</option>
                  <option value="DOUBLE">Phòng đôi</option>
                </select>
              </div>

              <input
                type="number"
                placeholder="Giá tiền (VNĐ)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
                >
                  {editingRoom ? <Edit2 size={16} /> : <Plus size={16} />}
                  {editingRoom ? "Cập nhật" : "Thêm phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách phòng */}
      {loading ? (
        <p className="text-center text-gray-500 py-6">Đang tải dữ liệu...</p>
      ) : filteredRooms.length === 0 ? (
        <p className="text-center text-gray-500 py-6">
          Không tìm thấy phòng nào.
        </p>
      ) : (
        <>
          <div className="space-y-5 mt-5">
            {pagedRooms.map((room) => (
              <div
                key={room._id}
                className="flex flex-col md:flex-row items-center md:items-start justify-between border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center gap-4 w-full md:w-2/3">
                  <img
                    src={room.img}
                    alt={room.numberRoom}
                    className="w-28 h-24 object-cover rounded-lg border"
                  />
                  <div className="space-y-1">
                    <h2 className="font-semibold text-lg text-gray-800">
                      Phòng {room.numberRoom}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {roomTypeLabel[room.roomType]} /{" "}
                      {bedTypeLabel[room.bedType]}
                    </p>
                    <p className="text-amber-600 font-medium">
                      {room.price.toLocaleString()}₫/đêm
                    </p>

                    {!room.isAvailable && (
                      <p className="text-red-600 text-sm font-medium mt-1">
                        Phòng đang được sử dụng
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-3 md:mt-0 items-center">
                  {/* Toggle hiển thị phòng */}
                  <button
                    onClick={async () => {
                      if (!room.isAvailable) {
                        return toast.error(
                          "Phòng đang được sử dụng — không thể ẩn / hiện!"
                        );
                      }
                      try {
                        await api.put(`/sua-phong/${room._id}`, {
                          ...room,
                          isHidden: !room.isHidden,
                        });
                        fetchRooms();
                      } catch (err) {
                        toast.error("Không thể thay đổi trạng thái hiển thị phòng!");
                      }
                    }}
                    disabled={!room.isAvailable}
                    className={`relative w-14 h-7 rounded-full flex items-center transition-all cursor-pointer duration-300 ${
                      !room.isAvailable
                        ? "bg-gray-200 cursor-not-allowed opacity-70"
                        : room.isHidden
                        ? "bg-gray-300"
                        : "bg-green-400"
                    }`}
                    title={
                      !room.isAvailable
                        ? "Phòng đang được sử dụng — không thể thay đổi"
                        : room.isHidden
                        ? "Phòng đang bị ẩn"
                        : "Phòng đang hiển thị"
                    }
                  >
                    <span
                      className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                        room.isHidden ? "translate-x-7" : ""
                      }`}
                    ></span>
                  </button>

                  {/* Sửa */}
                  <button
                    onClick={() => room.isAvailable && handleEdit(room)}
                    disabled={!room.isAvailable}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer text-sm ${
                      room.isAvailable
                        ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 size={14} /> Sửa
                  </button>

                  {/* Xoá */}
                  <button
                    onClick={() => room.isAvailable && handleDelete(room._id, room.numberRoom)}
                    disabled={!room.isAvailable}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer text-sm ${
                      room.isAvailable
                        ? "bg-red-100 hover:bg-red-200 text-red-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 size={14} /> Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 🔸 Phân trang local */}
          {filteredRooms.length > pageSize && (
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

export default AdminRooms;
