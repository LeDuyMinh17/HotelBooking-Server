// src/components/ServiceCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ServiceCard = ({ service, index = 0, isLoggedIn, onRequireLogin }) => {
  if (!service) return null;

  // Cho phép truyền isLoggedIn từ parent; nếu không có, fallback đọc token
  const loggedIn =
    typeof isLoggedIn === "boolean" ? isLoggedIn : !!localStorage.getItem("token");

  const imgSrc =
    service.images?.[0] && service.images[0].trim()
      ? service.images[0]
      : "/default-service.jpg";

  return (
    <div className="relative w-full h-auto rounded-2xl overflow-hidden bg-white text-gray-600 shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imgSrc}
          alt={service.name || "Dịch vụ"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        {service.bookedCount > 0 && (
          <p className="absolute top-3 right-3 px-3 py-1 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full shadow-md">
            Được gọi {service.bookedCount} lần
          </p>
        )}
      </div>

      <div className="p-5">
        <p className="font-semibold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
          {service.name}
        </p>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {service.descShort}
        </p>

        <div className="flex justify-between items-center mt-4">
          <span className="text-indigo-600 font-semibold text-base">
            {Number(service.price || 0).toLocaleString("vi-VN")}₫ /người
          </span>

          {loggedIn ? (
            <Link
              to={`/chi-tiet-dich-vu/${service._id}`}
              className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-full cursor-pointer hover:bg-indigo-600 transition"
            >
              Đặt ngay
            </Link>
          ) : (
            <button
              type="button"
              className="px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-full cursor-pointer hover:bg-gray-300 transition"
              aria-label="Bạn cần đăng nhập để đặt dịch vụ"
              title="Bạn cần đăng nhập để đặt dịch vụ"
            >
              Đăng nhập để đặt dịch vụ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
