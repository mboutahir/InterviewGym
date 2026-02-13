// frontend/src/lib/api.ts
import axios from "axios";

const api = axios.create({
  // Use the env variable from Vercel/Local
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: {
    "ngrok-skip-browser-warning": "69420", // The magic bypass header
  },
});

export default api;