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
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/match/history/${userId}`,
  );
  return res.json();
};
