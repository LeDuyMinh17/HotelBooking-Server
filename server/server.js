import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import conndb from "./configs/conndb.js";
import User from "./models/user.js";
import VerifyCode from "./models/vertifyCode.js";

dotenv.config();

const app = express();
app.use(express.json());

// CORS configuration: use FRONTEND_ORIGINS (comma-separated) or fallback
// FRONTEND_ORIGINS=https://your-prod.vercel.app,https://your-domain.com,http://localhost:5173
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_ORIGINS = [
  "https://hotel-booking-eosin-sigma.vercel.app",
  "http://localhost:5173",
];
const ALLOWED_ORIGINS = FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : DEFAULT_ORIGINS;
const FRONTEND_REGEX = process.env.FRONTEND_REGEX ? new RegExp(process.env.FRONTEND_REGEX) : null;
const corsOriginFn = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  if (FRONTEND_REGEX && FRONTEND_REGEX.test(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`), false);
};
app.use(cors({ origin: corsOriginFn, credentials: true }));

// HTTP server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// (socket handlers)
let onlineAdmins = new Set();
io.on("connection", (socket) => {
  socket.on("registerRole", (role) => {
    if (role === "admin" || role === "employee") onlineAdmins.add(socket.id);
  });
  socket.on("disconnect", () => onlineAdmins.delete(socket.id));
});
app.set("io", io);

// (routes)
import UserRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
app.use("/api/v1", UserRoutes);
app.use("/api/v1", roomRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", invoiceRoutes);
app.use("/api/v1", customerRoutes);

app.get("/", (req, res) => res.send("HotelBooking API & Socket.IO dang hoat dong"));
app.get("/ping", (req, res) => res.send("pong"));

async function bootstrap() {
  await conndb();
  try {
    await Promise.all([User.syncIndexes?.(), VerifyCode.syncIndexes?.()]);
    console.log("Indexes synced");
  } catch (err) {
    console.warn("syncIndexes warn:", err?.message || err);
  }

  const PORT = process.env.PORT || 10000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server & Socket.IO listening on ${PORT}`);
    console.log("CORS allowed origins:", ALLOWED_ORIGINS);
    if (FRONTEND_REGEX) console.log("CORS regex:", FRONTEND_REGEX);
  });
}
bootstrap().catch((e) => {
  console.error("Bootstrap failed:", e);
  process.exit(1);
});

