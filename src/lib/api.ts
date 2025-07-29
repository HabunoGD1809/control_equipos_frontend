import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { Token } from '@/types/api';

const api = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Interceptor de Petición: Añade el token de acceso a cada petición
api.interceptors.request.use(
   (config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
         config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Interceptor de Respuesta: Maneja la expiración del token
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
   failedQueue.forEach(prom => {
      if (error) {
         prom.reject(error);
      } else {
         prom.resolve(token);
      }
   });
   failedQueue = [];
};

api.interceptors.response.use(
   (response) => {
      return response;
   },
   async (error: AxiosError) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && originalRequest && !originalRequest.headers['_retry']) {
         if (isRefreshing) {
            return new Promise(function (resolve, reject) {
               failedQueue.push({ resolve, reject });
            }).then(token => {
               originalRequest.headers['Authorization'] = 'Bearer ' + token;
               return axios(originalRequest);
            });
         }

         originalRequest.headers['_retry'] = true;
         isRefreshing = true;

         const { refreshToken, logout, setTokens } = useAuthStore.getState();
         if (!refreshToken) {
            logout();
            return Promise.reject(error);
         }

         try {
            const { data } = await axios.post<Token>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`, {
               refresh_token: refreshToken,
            });

            setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token;
            originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;

            processQueue(null, data.access_token);
            return api(originalRequest);
         } catch (refreshError) {
            processQueue(refreshError as Error, null);
            logout();
            return Promise.reject(refreshError);
         } finally {
            isRefreshing = false;
         }
      }
      return Promise.reject(error);
   }
);

export default api;
