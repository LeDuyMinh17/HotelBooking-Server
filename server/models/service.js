import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    images: [{ type: String }],
    name: { type: String, required: true },
    price: { type: Number, required: true },
    descShort: { type: String, required: true },
    descLong: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
