import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({

  customerId: { type: mongoose.Types.ObjectId, ref: "Customer", required: true },
  note: { type: String, default: "" },
  roomId: { type: mongoose.Types.ObjectId, ref: "Room", required: true },

  checkIn: { type: Date, required: true },
  checkOut: { type: Date },

  services: [
    {
      serviceId: { type: mongoose.Types.ObjectId, ref: "Service" },
      quantity: { type: Number, default: 1 },
      startDate: { type: Date, required: true },  // ngày bắt đầu sử dụng dịch vụ
      endDate: { type: Date}  
    }
  ],

  bookedBy: { type: String, required: true },
  createdBy: { type: mongoose.Types.ObjectId, ref: "User"},
  paidAt: { type: Date },

  roomCharge: { type: Number, default: 0 },     // tiền phòng
  serviceCharge: { type: Number, default: 0 },  // tiền dịch vụ
  paidBy: { type: mongoose.Types.ObjectId, ref: "User", default: null },
  status: {
    type: String,
    enum: ["Chờ xác nhận", "Chờ thanh toán", "Đã thanh toán","Đã huỷ"],
    default: "Chờ xác nhận",
  },

  totalAmount: { type: Number, default:0, required: true },
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema)