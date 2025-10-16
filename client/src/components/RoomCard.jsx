// src/components/RoomCard.jsx
import React from "react";

const RoomCard = ({ room, index = 0, onBook, isLoggedIn, onRequireLogin }) => {
  if (!room) return null;

  // Cho phép truyền isLoggedIn từ parent; nếu không có thì đọc token localStorage
  const loggedIn =
    typeof isLoggedIn === "boolean" ? isLoggedIn : !!localStorage.getItem("token");

  const imgSrc =
    room.img && typeof room.img === "string" && room.img.trim()
      ? room.img
      : "https://via.placeholder.com/800x500?text=No+Image";

  return (
    <div className="relative w-full h-auto rounded-2xl overflow-hidden bg-white text-gray-600 shadow-md hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imgSrc}
          alt={room.name || `Phòng ${room.numberRoom}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <p className="px-3 py-1 absolute top-3 left-3 text-xs bg-white/90 text-gray-800 font-semibold rounded-full shadow">
          Nổi bật
        </p>
        {room.bookedCount > 0 && (
          <p className="px-3 py-1 absolute top-3 right-3 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full shadow-md">
            Được đặt {room.bookedCount} lần
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="font-playfair text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            Phòng số {room.numberRoom}
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <span className="w-24 font-medium text-gray-700">Loại phòng:</span>
            <span className="text-gray-500">
              {room.roomType === "ROOM_VIP" ? "Phòng VIP"
                : room.roomType === "ROOM_NORMAL" ? "Phòng thường" : "-"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-24 font-medium text-gray-700">Loại giường:</span>
            <span className="text-gray-500">
              {room.bedType === "DOUBLE" ? "Phòng đôi"
                : room.bedType === "SINGLE" ? "Phòng đơn" : "-"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <p>
            <span className="text-lg font-semibold text-gray-900">
              {Number(room.price || 0).toLocaleString()} VNĐ
            </span>
            <span className="text-sm text-gray-500"> /ngày</span>
          </p>

          {loggedIn ? (
            <button
              onClick={onBook}
              className="px-5 py-2 mx-4 text-sm font-medium rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:opacity-90 transition cursor-pointer"
            >
              Đặt phòng
            </button>
          ) : (
            <button
              className="px-5 py-2 mx-4 text-xs font-medium rounded-full bg-gray-200 text-gray-700 shadow hover:bg-gray-300 transition cursor-pointer"
              aria-label="Bạn cần đăng nhập để đặt phòng"
              title="Bạn cần đăng nhập để đặt phòng"
            >
              Đăng nhập để đặt phòng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
