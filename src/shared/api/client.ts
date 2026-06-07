import axios from "axios";

const isMockEnabled = import.meta.env.VITE_ENABLE_MSW !== "false";
const resolvedBaseURL = isMockEnabled
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8767");

export const apiClient = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10_000,
});
