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

  const handleUpload = async () => {
    if (!file || !jd) return;

    setResult(null);
    setJobId(null);
    setStatus("UPLOADING");

    try {
      const data = await createMatchJob(file, jd);
      setJobId(data.jobId);
      setStatus("PROCESSING");
    } catch {
      setStatus("FAILED");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 space-y-5 border border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">
          AI Resume Matcher
        </h2>

        {/* Job Description */}
        <div>
          <label className="text-sm font-medium text-slate-600">
            Job Description
          </label>
          <textarea
            className="w-full mt-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            rows={5}
            placeholder="Paste job description here..."
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm font-medium text-slate-600">
            Upload Resume
          </label>
          <input
            type="file"
            className="w-full mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
            onChange={(e) => setFile(e.target.files![0])}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={status === "UPLOADING" || status === "PROCESSING"}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          {status === "PROCESSING" ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Processing...
            </>
          ) : (
            "Start Analysis"
          )}
        </button>

        {/* Status Section */}
        <div className="min-h-[40px] flex items-center justify-center">
          {status === "COMPLETED" && result && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              Score: <span className="font-bold">{result.score}%</span>
            </div>
          )}

          {status === "FAILED" && (
            <div className="flex items-center gap-2 text-red-500 font-medium">
              <AlertCircle className="w-5 h-5" />
              Failed. Try again.
            </div>
          )}
        </div>

        {/* Feedback */}
        {result?.feedback && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
            {result.feedback}
          </div>
        )}
      </div>
    </div>
  );
};
