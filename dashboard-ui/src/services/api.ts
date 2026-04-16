import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const createMatchJob = async (payload: {
  resumeUrl: string;
  jd: string;
  userId: string;
}) => {
  const res = await axios.post(`${API_URL}/match`, payload);
  return res.data;
};

export const getHistory = async (userId: string) => {
  // Clean the URL to ensure no trailing slash
  const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  // Use it without a leading slash in the path
  const res = await fetch(`${baseApiUrl}/match/history/${userId}`);
  return res.json();
};
