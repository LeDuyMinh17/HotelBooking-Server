import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthModal from "../components/AuthForm";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Checkbox component
const Checkbox = ({ label, selected = false, onChange = () => {} }) => (
  <label className="flex gap-3 items-center cursor-pointer mt-2 text-sm">
    <input
      type="checkbox"
      checked={selected}
      onChange={(e) => onChange(e.target.checked, label)}
      className="w-4 h-4 accent-blue-600 rounded"
    />
    <span
      className={`select-none ${
        selected ? "text-gray-800 font-medium" : "text-gray-600"
      }`}
    >
      {label}
    </span>
  </label>
);

// RadioButton component
const RadioButton = ({ label, selected = false, onChange = () => {} }) => (
  <label className="flex gap-3 items-center cursor-pointer mt-2 text-sm">
    <input
      type="radio"
      value={label}
      checked={selected}
      onChange={() => onChange(label)}
      className="w-4 h-4 accent-blue-600"
    />
    <span
      className={`select-none ${
        selected ? "text-gray-800 font-medium" : "text-gray-600"
      }`}
    >
      {label}
    </span>
  </label>
);

const ListRoom = () => {
  const navigate = useNavigate();

  // Modal đăng nhập
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Redux: kiểm tra đăng nhập
  const { isLoggedIn } = useSelector((state) => state.user);

  // Filter state
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedBedType, setSelectedBedType] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [showFilter, setShowFilter] = useState(false);


  // Data
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");


  // 🧩 Lấy role người dùng
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${BASE_URL}/thong-tin-nguoi-dung`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(res.data.role || "");
      } catch (err) {
        console.error("Lỗi khi lấy role:", err);
      }
    };
    fetchUserRole();
  }, []);

  // 🧾 Lấy danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/tat-ca-phong`);
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Lỗi khi load phòng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/tat-ca-phong`);
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Lỗi khi load phòng:", err);
      }
    };

    // 🔁 Khi có bất kỳ cập nhật hoá đơn nào (ở tab khác)
    const handleStorageChange = (e) => {
      if (e.key === "invoice_updated") {
        fetchRooms(); // reload lại danh sách phòng
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  // Bộ lọc
  const roomType = ["Phòng thường", "Phòng VIP"];
  const bedType = ["Phòng đơn", "Phòng đôi"];
  const availability = [
    { label: "Còn trống", value: true },
    { label: "Đã đặt", value: false },
  ];
  const priceRange = [
    "Dưới 1.000.000 VNĐ",
    "1.000.000 - 2.000.000 VNĐ",
    "2.000.000 - 3.000.000 VNĐ",
    "Trên 3.000.000 VNĐ",
  ];
  const sortOptions = ["Giá thấp đến cao", "Giá cao đến thấp"];

  const filteredRooms = rooms
    .filter((room) => !room.isHidden)
    .filter((room) => {
      if (selectedRoomType && room.roomType !== selectedRoomType) return false;
      if (selectedBedType && room.bedType !== selectedBedType) return false;
      if (
        selectedAvailability !== "" &&
        room.isAvailable !== selectedAvailability
      )
        return false;
      if (selectedPriceRange) {
        const price = room.price;
        if (selectedPriceRange === "Dưới 1.000.000 VNĐ" && price >= 1000000)
          return false;
        if (
          selectedPriceRange === "1.000.000 - 2.000.000 VNĐ" &&
          (price < 1000000 || price > 2000000)
        )
          return false;
        if (
          selectedPriceRange === "2.000.000 - 3.000.000 VNĐ" &&
          (price < 2000000 || price > 3000000)
        )
          return false;
        if (selectedPriceRange === "Trên 3.000.000 VNĐ" && price <= 3000000)
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === "Giá thấp đến cao") return a.price - b.price;
      if (selectedSort === "Giá cao đến thấp") return b.price - a.price;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 text-lg">Đang tải danh sách phòng...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 md:pt-35 px-4 md:px-16 lg:px-24 xl:px-32 flex flex-col lg:flex-row gap-8">
      {/* Bộ lọc (Mobile) */}
      <div className="lg:hidden w-full bg-white rounded-xl shadow-md border border-gray-200 mb-6 sticky top-20 z-30">
        {/* Header cố định */}
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="w-full flex justify-between items-center text-gray-800 font-medium text-base px-4 py-3 border-b"
        >
          <span className="flex items-center gap-2">
            Bộ lọc
          </span>
          <span
            className={`transform transition-transform duration-300 ${
              showFilter ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </button>

        {/* Nội dung filter */}
        {showFilter && (
          <div className="animate-fadeIn px-4 py-3 max-h-[75vh] overflow-y-auto">
            {/* Loại phòng */}
            <div>
              <p className="font-medium text-gray-700 mb-1">Loại phòng</p>
              {roomType.map((type, index) => (
                <Checkbox
                  key={index}
                  label={type}
                  selected={selectedRoomType === type}
                  onChange={(checked, label) =>
                    setSelectedRoomType(checked ? label : "")
                  }
                />
              ))}
            </div>

            {/* Loại giường */}
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">Loại giường</p>
              {bedType.map((type, index) => (
                <Checkbox
                  key={index}
                  label={type}
                  selected={selectedBedType === type}
                  onChange={(checked, label) =>
                    setSelectedBedType(checked ? label : "")
                  }
                />
              ))}
            </div>

            {/* Tình trạng */}
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">Tình trạng</p>
              {availability.map((item, index) => (
                <Checkbox
                  key={index}
                  label={item.label}
                  selected={selectedAvailability === item.value}
                  onChange={(checked) =>
                    setSelectedAvailability(checked ? item.value : "")
                  }
                />
              ))}
            </div>

            {/* Khoảng giá */}
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">Khoảng giá</p>
              {priceRange.map((range, index) => (
                <Checkbox
                  key={index}
                  label={range}
                  selected={selectedPriceRange === range}
                  onChange={(checked, label) =>
                    setSelectedPriceRange(checked ? label : "")
                  }
                />
              ))}
            </div>

            {/* Sắp xếp */}
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">Sắp xếp theo</p>
              {sortOptions.map((option, index) => (
                <RadioButton
                  key={index}
                  label={option}
                  selected={selectedSort === option}
                  onChange={(label) => setSelectedSort(label)}
                />
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setSelectedRoomType("");
                setSelectedBedType("");
                setSelectedAvailability("");
                setSelectedPriceRange("");
                setSelectedSort("");
              }}
              className="w-full mt-5 mb-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium shadow transition text-sm"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Danh sách phòng */}
      <div className="w-full lg:w-4/5 flex flex-col gap-6">
        <div className="flex flex-col items-start text-left">
          <h1 className="font-playfair text-4xl md:text-[40px]">
            Danh sách phòng
          </h1>
          <p className="text-sm md:text-base text-gray-500/90 mt-2 max-w-xl">
            Nhanh tay đặt phòng để được hưởng ưu đãi mới nhất của khách sạn
          </p>
        </div>

        <div className="flex flex-col gap-6 mt-6 mb-10">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-xl shadow-md p-4 transition-all ${
                !room.isAvailable
                  ? "bg-gray-100 opacity-90"
                  : "bg-white hover:shadow-lg"
              }`}
            >
              <img
                src={room.img}
                alt="room"
                className={`w-full sm:w-48 h-36 object-cover rounded-lg ${
                  !room.isAvailable ? "opacity-70" : ""
                }`}
              />
              <div className="flex flex-col justify-between flex-1 text-left">
                <div>
                  <h2 className="text-2xl font-playfair text-gray-800">
                    Phòng số {room.numberRoom}
                  </h2>
                  <p>
                    <span className="font-medium">Loại phòng:</span>{" "}
                    {room.roomType === "ROOM_VIP"
                      ? "Phòng VIP"
                      : room.roomType === "ROOM_NORMAL"
                      ? "Phòng thường"
                      : "-"}
                  </p>

                  <p>
                    <span className="font-medium">Loại giường:</span>{" "}
                    {room.bedType === "DOUBLE"
                      ? "Phòng đôi"
                      : room.bedType === "SINGLE"
                      ? "Phòng đơn"
                      : "-"}
                  </p>
                  <p
                    className={`text-sm mt-1 font-medium ${
                      room.isAvailable ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    Tình trạng:{" "}
                    {room.isAvailable
                      ? "Còn trống"
                      : `Đã đặt`}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-semibold text-gray-800">
                    {room.price.toLocaleString()} VNĐ / đêm
                  </p>

                  {/* 🧠 Điều kiện nút hành động */}
                  {["admin", "employee"].includes(role) && !room.isAvailable ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          window.open(`/chi-tiet-hoa-don/${room.invoiceId}`, "_blank")
                        }
                        disabled={!room.invoiceId}
                        className="px-4 py-2 text-sm ml-5 font-medium border border-blue-500 text-blue-600 cursor-pointer rounded hover:bg-blue-50 disabled:opacity-50"
                      >
                        Xem thông tin
                      </button>
                    </div>
                  ) : room.isAvailable ? (
                    <>
                      {isLoggedIn ? (
                        <button
                          className="px-4 py-2 ml-10 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dat-phong/${room._id}`);
                            scrollTo(0, 0);
                          }}
                        >
                          Đặt phòng
                        </button>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Bạn cần{" "}
                          <span
                            onClick={() => setIsAuthOpen(true)}
                            className="text-red-600 font-medium hover:underline cursor-pointer"
                          >
                            đăng nhập
                          </span>{" "}
                          để đặt phòng
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Phòng đang được đặt
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter (Desktop) */}
      <div className="hidden lg:block w-1/5">
        <div className="sticky top-28 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Bộ lọc</h2>
            <button
              onClick={() => {
                setSelectedRoomType("");
                setSelectedBedType("");
                setSelectedAvailability("");
                setSelectedPriceRange("");
                setSelectedSort("");
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Loại phòng */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="font-medium text-gray-700 mb-2">Loại phòng</p>
            {roomType.map((type, index) => (
              <Checkbox
                key={index}
                label={type}
                selected={selectedRoomType === type}
                onChange={(checked, label) =>
                  setSelectedRoomType(checked ? label : "")
                }
              />
            ))}
          </div>

          {/* Loại giường */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="font-medium text-gray-700 mb-2">Loại giường</p>
            {bedType.map((type, index) => (
              <Checkbox
                key={index}
                label={type}
                selected={selectedBedType === type}
                onChange={(checked, label) =>
                  setSelectedBedType(checked ? label : "")
                }
              />
            ))}
          </div>

          {/* Tình trạng */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="font-medium text-gray-700 mb-2">Tình trạng</p>
            {availability.map((item, index) => (
              <Checkbox
                key={index}
                label={item.label}
                selected={selectedAvailability === item.value}
                onChange={(checked) =>
                  setSelectedAvailability(checked ? item.value : "")
                }
              />
            ))}
          </div>

          {/* Khoảng giá */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="font-medium text-gray-700 mb-2">Khoảng giá</p>
            {priceRange.map((range, index) => (
              <Checkbox
                key={index}
                label={range}
                selected={selectedPriceRange === range}
                onChange={(checked, label) =>
                  setSelectedPriceRange(checked ? label : "")
                }
              />
            ))}
          </div>

          {/* Sắp xếp */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="font-medium text-gray-700 mb-2">Sắp xếp theo</p>
            {sortOptions.map((option, index) => (
              <RadioButton
                key={index}
                label={option}
                selected={selectedSort === option}
                onChange={(label) => setSelectedSort(label)}
              />
            ))}
          </div>
        </div>
      </div>

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

export default ListRoom;
