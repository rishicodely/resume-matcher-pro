import { io } from "socket.io-client";

const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export const socket = io(baseApiUrl, {
  autoConnect: true,
});
