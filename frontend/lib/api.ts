import axios from "axios";
import { supabase } from "./supabase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${session.access_token}`);
        } else if (config.headers) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve Supabase session in API interceptor:", e);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;