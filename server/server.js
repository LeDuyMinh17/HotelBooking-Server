import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import conndb from "./configs/conndb.js";
import UserRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ Tạo server HTTP riêng để gắn Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Cho phép client React kết nối
});

// 🧩 Quản lý admin/employee online
let onlineAdmins = new Set();

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

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

// Cho phép truy cập io trong các route khác
app.set("io", io);

// 🧠 Kết nối database
conndb();

// 📦 Khai báo các routes
app.use("/api/v1", UserRoutes);
app.use("/api/v1", roomRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", invoiceRoutes);
app.use("/api/v1", customerRoutes);

// 🚀 Khởi động server (phải là server.listen, không phải app.listen)
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server & Socket.IO đang chạy tại cổng ${PORT}`);
});
