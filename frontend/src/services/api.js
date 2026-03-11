import axios from "axios";

const SESSION_KEY = "ucu-innovators-session";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const UPLOADS_URL = API_BASE_URL.replace(/\/api$/, "");

const API = axios.create({
  baseURL: API_BASE_URL
});

export const getSession = () => {
  const rawSession = localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const getCurrentUser = () => getSession()?.user || null;

export const setSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

API.interceptors.request.use((config) => {
  const session = getSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

export default API;