import mongoose from "mongoose";

const VerifyCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true, expires: 300 } // tự xóa sau 300s = 5 phút
});

export default mongoose.model("VerifyCode", VerifyCodeSchema);
