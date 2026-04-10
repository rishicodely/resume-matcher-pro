import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const createMatchJob = async (file: File, jd: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jd", jd);
  formData.append("userId", "user_123");

  const res = await axios.post(`${API_URL}/match`, {
    resumeUrl: `/uploads/${file.name}`,
    jd,
    userId: "user_123",
  });

  return res.data;
};
