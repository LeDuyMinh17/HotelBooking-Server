import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

const WarnModal = ({ open, title, message, onConfirm, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#fffaf5] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] p-6 w-[90%] max-w-sm text-center relative border border-[#e4cba3]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* nút đóng */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={22} />
            </button>

            {/* icon cảnh báo */}
            <div className="flex justify-center mb-3">
              <AlertTriangle className="text-[#d4a373] w-8 h-8" />
            </div>

            {/* nội dung */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2 font-[Playfair_Display]">
              {title || "Cảnh báo"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>

            {/* nút hành động */}
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose?.();
                }}
                className="px-4 py-2 rounded-lg bg-[#d4a373] text-white cursor-pointer hover:bg-[#b97a56] transition"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarnModal;
