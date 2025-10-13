import React from 'react'

const ContactLetter = () => {
  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-center text-white py-24 flex flex-col items-center justify-center">
      
      {/* Subtitle */}
      <p className="text-indigo-400 font-medium tracking-wide uppercase text-sm drop-shadow-md">
        Đừng bỏ lỡ
      </p>

      {/* Title */}
      <h1 className="max-w-2xl font-semibold text-3xl md:text-4xl leading-snug mt-3 text-gray-100">
        Đăng nhập để không bỏ lỡ <span className="text-indigo-400">ưu đãi đặc biệt</span> mới nhất của khách sạn
      </h1>

      {/* Input + Button */}
      <div className="flex items-center justify-between mt-10 bg-slate-800/50 backdrop-blur-sm border border-slate-700 
                      focus-within:border-indigo-500 rounded-full h-14 max-w-xl w-full shadow-lg overflow-hidden">
        <input 
          type="email" 
          className="bg-transparent outline-none px-5 h-full flex-1 text-gray-200 placeholder-gray-400" 
          placeholder="Nhập email của bạn..."
        />
        <button className="bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer text-white font-medium rounded-full h-11 mr-2 px-8 flex items-center justify-center shadow-md hover:shadow-indigo-500/30">
          Đăng nhập
        </button>
      </div>
    </div>
  )
}

export default ContactLetter
