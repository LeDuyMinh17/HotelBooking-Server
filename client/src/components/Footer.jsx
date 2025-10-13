import React from 'react'
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa"

const Footer = () => {
  return (
    <footer className="flex flex-col md:flex-row items-center justify-between w-full py-6 px-6 md:px-16 
                       bg-gradient-to-r from-slate-900 to-slate-800 text-gray-400 text-sm">
      
      {/* Bản quyền */}
      <p className="mb-4 md:mb-0">
        © 2025 <span className="text-white font-medium">Nho Mot Nguoi</span>. All rights reserved.
      </p>

      {/* Liên kết */}
      <div className="flex items-center gap-6">
        <a href="#" className="hover:text-white transition-colors">Liên hệ</a>
        <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
        <a href="#" className="hover:text-white transition-colors">Quy định khách sạn</a>
      </div>

      {/* Social */}
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <a href="https://www.facebook.com/le.duy.minh.607103/" className="hover:text-white transition-colors"><FaFacebookF /></a>
        <a href="#" className="hover:text-white transition-colors"><FaInstagram /></a>
        <a href="#" className="hover:text-white transition-colors"><FaTwitter /></a>
      </div>
    </footer>
  )
}

export default Footer

