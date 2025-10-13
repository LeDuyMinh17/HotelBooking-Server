import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  img: { type: String, required: true },
  numberRoom: { type: String, required: true },
  roomType: {
    type: String,
    enum: ["ROOM_NORMAL", "ROOM_VIP"],
    default: "ROOM_NORMAL",
  },
  bedType: {
    type: String,
    enum: ["SINGLE", "DOUBLE"],
    default: "DOUBLE",
  },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
