// src/components/BestRoom.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import RoomCard from "./RoomCard";
import Title from "./Title";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BestRoom = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/top-phong`);
        setRooms(res.data.rooms || []);
      } catch (e) {
        console.error("Lỗi khi load top phòng:", e);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-600">Đang tải phòng nổi bật...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20">
      <Title
        title="SANG TRỌNG"
        subTitle="Không gian từng căn phòng với thiết kế tinh tế, nội thất cao cấp và không gian rộng rãi."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 mt-10 w-[80%]">
        {rooms.map((room, index) => (
          <RoomCard
            key={room._id}
            room={room}
            index={index}
            onBook={() => {
              navigate(`/dat-phong/${room._id}`);
              scrollTo(0, 0);
            }}
          />
        ))}
      </div>

      <button
        onClick={() => {
          navigate("/dat-phong");
          scrollTo(0, 0);
        }}
        className="my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer"
      >
        Xem toàn bộ phòng
      </button>
    </div>
  );
};

export default BestRoom;
