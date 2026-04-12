import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { createMatchJob } from "../services/api";
import { useMatchSocket } from "../hooks/useMatchSocket";

type MatchResult = {
  jobId: string;
  score: number;
  feedback: string;
};

export const FileMatcher = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<
    "IDLE" | "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED"
  >("IDLE");
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  useMatchSocket(jobId, (data) => {
    setResult(data);
    setStatus("COMPLETED");
  });

  const uploadToS3 = async (file: File) => {
    const filename = `${Date.now()}-${file.name}`;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/match/upload-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          type: file.type,
        }),
      },
    );

    const { url, fileUrl } = await res.json();

    await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    return fileUrl;
  };

  const handleUpload = async () => {
    if (!file || !jd) return;

    setResult(null);
    setJobId(null);
    setStatus("UPLOADING");

    try {
      const fileUrl = await uploadToS3(file);

      const data = await createMatchJob({
        resumeUrl: fileUrl,
        jd,
        userId: "user123",
      });
      setJobId(data.jobId);
      setStatus("PROCESSING");
    } catch {
      setStatus("FAILED");
    }
  };

  const renderFeedback = (text: string) => {
    try {
      const data = JSON.parse(text);

      return (
        <div className="space-y-4">
          {data.strengths && (
            <div>
              <p className="text-green-400 text-xs uppercase tracking-wider mb-1">
                strengths.exe
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                {data.strengths.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.weaknesses && (
            <div>
              <p className="text-red-400 text-xs uppercase tracking-wider mb-1">
                weaknesses.log
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                {data.weaknesses.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {data.recommendations && (
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
              <p className="text-blue-400 text-xs uppercase tracking-wider mb-1">
                recommendations.md
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                {data.recommendations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } catch {
      return <p className="text-slate-400">{text}</p>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-6">
      {/* Glow background */}{" "}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-3xl rounded-full -z-10 top-20" />
      <div className="w-full max-w-xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6">
        <h2 className="text-2xl font-semibold text-center tracking-tight">
          AI Resume Matcher<span className="text-purple-400"></span>
        </h2>

        {/* Job Description */}
        <div>
          <label className="text-xs text-slate-400">Job Description</label>
          <textarea
            className="w-full mt-1 p-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-200"
            rows={5}
            placeholder="paste something interesting..."
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="text-xs text-slate-400">Resume</label>
          <input
            type="file"
            className="w-full mt-1 text-sm text-slate-400 file:bg-purple-500/20 file:text-purple-300 file:border-0 file:px-4 file:py-2 file:rounded-lg hover:file:bg-purple-500/30"
            onChange={(e) => setFile(e.target.files![0])}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={status === "UPLOADING" || status === "PROCESSING"}
          className="w-full bg-purple-600/80 hover:bg-purple-600 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
        >
          {status === "PROCESSING" ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              cooking...
            </>
          ) : (
            "run it"
          )}
        </button>

        {/* Status */}
        <div className="min-h-[50px] flex items-center justify-center">
          {status === "COMPLETED" && result && (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-lg font-bold">
                  {Math.round(result.score)}%
                </span>
              </div>

              <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-purple-500 h-full transition-all duration-1000"
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>
          )}

          {status === "FAILED" && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              something broke.
            </div>
          )}
        </div>

        {/* Feedback */}
        {result?.feedback && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm backdrop-blur-md">
            {renderFeedback(result.feedback)}
          </div>
        )}
      </div>
    </div>
  );
};
