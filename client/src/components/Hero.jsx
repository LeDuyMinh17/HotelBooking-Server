import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen bg-[url('/src/assets/heroImage.jpg')] bg-no-repeat bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-16 lg:px-24 xl:px-32 text-white">
        <p className="inline-block bg-[#3B82F6]/60 px-4 py-1 rounded-full text-sm md:text-base tracking-wide">
          Đến một lần, vấn vương một đời
        </p>

        <h1 className="font-playfair text-3xl md:text-5xl lg:text-[56px] leading-tight font-extrabold max-w-2xl mt-6">
          Chào mừng đến với khách sạn Nhớ Một Người
        </h1>

        <p className="max-w-xl mt-4 text-sm md:text-lg text-gray-200 leading-relaxed">
          Được xây dựng từ những năm đầu thập niên 2000, cho đến nay, Nhớ Một Người luôn nằm trong top 10 địa điểm nghỉ dưỡng bạn bắt buộc phải ghé qua
          khi đến với thành phố Đà Lạt mộng mơ. Sang trọng, tiện nghi, đẳng cấp là những gì bạn sẽ cảm nhận được khi đặt chân đến khách sạn của chúng tôi.
        </p>

        {/* Nút CTA */}
        <style>{`
          @keyframes rotate {
            100% {
              transform: rotate(1turn);
            }
          }
          .rainbow::before {
            content: '';
            position: absolute;
            z-index: -2;
            left: -50%;
            top: -50%;
            width: 200%;
            height: 200%;
            background-position: 100% 50%;
            background-repeat: no-repeat;
            background-size: 50% 50%;
            filter: blur(8px);
            background-image: conic-gradient(
              from 0deg,
              #facc15,
              #ffffff,
              #86efac,
              #facc15
            );
            animation: rotate 6s linear infinite;
          }
        `}</style>

        <div className="rainbow relative z-0 bg-white/15 overflow-hidden p-0.5 flex items-center justify-center rounded-full hover:scale-105 transition duration-300 active:scale-100 mt-8">
          <button
            onClick={() => navigate("/dat-phong")}
            className="px-15 text-lg py-4 text-white rounded-full font-medium bg-gray-900/80 backdrop-blur cursor-pointer hover:bg-gray-900/60 transition"
          >
            Đặt phòng ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
