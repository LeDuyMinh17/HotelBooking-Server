import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default:"" },
  userId: { type: mongoose.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
