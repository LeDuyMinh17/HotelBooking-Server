import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthModal from "../components/AuthForm";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ListService = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal đăng nhập
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Redux: kiểm tra đăng nhập
  const { isLoggedIn } = useSelector((state) => state.user);

  // Lấy dữ liệu dịch vụ từ API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/toan-bo-dich-vu`);
        setServices(res.data.services || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách dịch vụ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <p className="text-lg font-medium text-gray-600 animate-pulse">
          Đang tải danh sách dịch vụ...
        </p>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto mt-20">
      <h2 className="text-3xl font-playfair mb-6 text-gray-800">Danh sách dịch vụ</h2>
      {services.length === 0 ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-gray-500 text-lg text-center">
              Hiện tại chưa có dịch vụ nào.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
            <div
              key={service._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
            >
              {/* Ảnh dịch vụ */}
              {service.images?.length > 0 ? (
                <img
                  src={service.images[0]}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Không có ảnh
                </div>
              )}

              {/* Thông tin dịch vụ */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-600 mt-1 flex-1">{service.descShort}</p>

                {/* Giá + Trạng thái (luôn cùng 1 dòng) */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-primary font-semibold text-base">
                    {service.price.toLocaleString()} VNĐ/người
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.isAvailable
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {service.isAvailable ? "Còn dịch vụ" : "Hết dịch vụ"}
                  </span>
                </div>

                {/* Nút đặt dịch vụ hoặc yêu cầu đăng nhập */}
                {service.isAvailable && (
                  <>
                    {isLoggedIn ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chi-tiet-dich-vu/${service._id}`);
                          scrollTo(0, 0);
                        }}
                        className="mt-6 w-full bg-gray-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition cursor-pointer"
                      >
                        Đặt dịch vụ
                      </button>
                    ) : (
                      <p className="mt-6 text-sm text-gray-600 text-center">
                        Bạn cần{" "}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAuthOpen(true);
                          }}
                          className="text-red-600 font-medium hover:underline cursor-pointer"
                        >
                          đăng nhập
                        </span>{" "}
                        để đặt dịch vụ
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          switchMode={setAuthMode}
        />
      )}
    </div>
  );
};

export default ListService;
