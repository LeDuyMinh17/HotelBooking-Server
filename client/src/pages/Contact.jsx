import React, { useState } from "react"
import { hotelDummyData } from "../assets/assets"
import { MapPin, Phone, Facebook, Instagram } from "lucide-react"
import toast from "react-hot-toast"

const ContactPage = () => {
  const hotel = hotelDummyData
  const [showFullDesc, setShowFullDesc] = useState(false)
  const shortDesc = hotel.description.slice(0, 180)

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.error("Chức năng này đang được xây dựng!")
  }

  return (
    <div className="relative min-h-screen bg-[url('/src/assets/heroImage.jpg')] bg-no-repeat bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative py-28 md:py-36 px-4 md:px-16 lg:px-24 xl:px-32 max-w-7xl mx-auto text-white">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold drop-shadow-lg">
            Liên Hệ Với {hotel.name}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg">
            {showFullDesc ? hotel.description : `${shortDesc}...`}
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="ml-2 font-medium text-yellow-300 hover:underline"
            >
              {showFullDesc ? "Thu gọn" : "Xem thêm"}
            </button>
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Info */}
          <div className="space-y-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 text-gray-800">
            <h2 className="text-2xl font-playfair font-bold">Thông tin khách sạn</h2>
            <div className="space-y-4">
              <p className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <span>{hotel.address}</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-primary" />
                <a
                  href={`tel:${hotel.contact}`}
                  className="hover:underline text-primary font-medium"
                >
                  {hotel.contact}
                </a>
              </p>
              <div className="flex gap-6 pt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Facebook size={20} /> Facebook
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-pink-500 hover:text-pink-600"
                >
                  <Instagram size={20} /> Instagram
                </a>
              </div>
            </div>

            {/* Google Maps */}
            <div className="mt-6">
              <iframe
                title="Hotel Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.487706912829!2d108.44551881533477!3d11.940419039391073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31711360e4c8cfaf%3A0xb30f5c5ad5d2f19d!2zSMOyIFh1w6JuIEjGsMahbmggLSBEw6AgTOG6oXQ!5e0!3m2!1svi!2s!4v1633436582639!5m2!1svi!2s"
                className="w-full h-64 md:h-80 rounded-xl shadow-md"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-11">
            <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>
            <form className="space-y-5 text-gray-800">
              <input
                type="text"
                placeholder="Họ và tên"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <textarea
                rows="5"
                placeholder="Nội dung tin nhắn"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
              ></textarea>
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-medium py-3 rounded-lg shadow-md hover:opacity-90 transition cursor-pointer"
              >
                Gửi Tin Nhắn
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
