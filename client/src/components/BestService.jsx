import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceCard from "./ServiceCard";
import Title from "./Title";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BestService = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/top-dich-vu`);
        setServices(res.data.services || []);
      } catch (err) {
        console.error("Lỗi khi tải top dịch vụ:", err);
      }
    };
    fetchTopServices();
  }, []);

  return (
    <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20">
      <Title
        title="DỊCH VỤ NỔI BẬT"
        subTitle="Trải nghiệm những dịch vụ được yêu thích nhất – nơi mỗi khoảnh khắc đều trở nên đặc biệt."
      />

      {services.length === 0 ? (
        <p className="text-gray-500 mt-10">Chưa có dịch vụ nổi bật nào.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 mt-10 w-[75%]">
          {services.map((service, index) => (
            <ServiceCard key={service._id} service={service} index={index} />
          ))}
        </div>
      )}

      <button
        onClick={() => {
          navigate("/dich-vu");
          scrollTo(0, 0);
        }}
        className="my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer"
      >
        Xem toàn bộ dịch vụ
      </button>
    </div>
  );
};

export default BestService;
