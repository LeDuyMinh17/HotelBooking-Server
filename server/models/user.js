import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  avatar: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/128/3177/3177440.png",
  },
  role: {
    type: String,
    enum: ["user", "employee","admin"],
    default: "user",
  },
   isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
