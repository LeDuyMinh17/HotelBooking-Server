import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (BASE_URL ? new URL(BASE_URL).origin : "");

let socket = null;

export function getSocket() {
  if (!SOCKET_URL) {
    console.warn("[Socket] SOCKET_URL missing");
    return null;
  }

  if (
    typeof window !== "undefined" &&
    window.location?.protocol === "https:" &&
    SOCKET_URL.startsWith("http://")
  ) {
    console.warn("[Socket] Mixed content: FE https but SOCKET_URL is http");
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  return socket;
}

