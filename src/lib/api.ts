import "client-only";
import axios, { AxiosError } from "axios";

const api = axios.create({
   baseURL: "/api/proxy",
   headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
   (r) => r,
   (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
         window.location.href = "/login";
      }
      return Promise.reject(error);
   }
);

export default api;
