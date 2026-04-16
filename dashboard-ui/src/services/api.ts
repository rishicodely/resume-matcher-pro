import axios from "axios";
const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export const createMatchJob = async (payload: {
  resumeUrl: string;
  jd: string;
  userId: string;
}) => {
  const res = await axios.post(`${baseApiUrl}/match`, payload);
  return res.data;
};

export const getHistory = async (userId: string) => {
  // Clean the URL to ensure no trailing slash

  // Use it without a leading slash in the path
  const res = await fetch(`${baseApiUrl}/match/history/${userId}`);
  return res.json();
};
