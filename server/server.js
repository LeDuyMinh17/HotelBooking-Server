import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import conndb from "./configs/conndb.js";
import UserRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();

const app = express();

// 🧩 Cấu hình CORS cho HTTP request
app.use(
  cors({
    origin: [
      "https://hotel-booking-eosin-sigma.vercel.app", // frontend chính thức
      "http://localhost:3000", // để test local nếu cần
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// 🧱 Tạo server HTTP độc lập cho Socket.IO
const server = http.createServer(app);

// ⚙️ Cấu hình Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "https://hotel-booking-eosin-sigma.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // đảm bảo fallback ổn định
  pingTimeout: 60000, // tránh timeout sớm trên Render
  pingInterval: 25000,
});

// 🧠 Kết nối database
conndb();

// 🔌 Quản lý admin/employee online
let onlineAdmins = new Set();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("registerRole", (role) => {
    if (role === "admin" || role === "employee") {
      onlineAdmins.add(socket.id);
      console.log(`${role} connected (${socket.id})`);
    }
  });

  socket.on("disconnect", () => {
    onlineAdmins.delete(socket.id);
    console.log("Client disconnected:", socket.id);
  });
});

// Cho phép truy cập io trong route khác nếu cần
app.set("io", io);

// 📦 Routes API
app.use("/api/v1", UserRoutes);
app.use("/api/v1", roomRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", invoiceRoutes);
app.use("/api/v1", customerRoutes);

// 🔍 Route test kiểm tra hoạt động
app.get("/", (req, res) => {
  res.send("HotelBooking API & Socket.IO đang hoạt động ");
});

// 🚀 Khởi động server
const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server & Socket.IO đang chạy tại cổng ${PORT}`);
});
