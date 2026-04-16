import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { createMatchJob } from "../services/api";
import { useMatchSocket } from "../hooks/useMatchSocket";
import { getHistory } from "../services/api";

type MatchResult = {
  jobId: string;
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
};

type HistoryItem = {
  job_id: string;
  score: number;
  created_at: string;
  feedback: MatchResult["feedback"];
};

export const FileMatcher = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<
    "IDLE" | "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED"
  >("IDLE");
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  useMatchSocket(jobId, (data) => {
    setResult(data);
    setStatus("COMPLETED");
    getHistory("user123").then(setHistory);
  });

  const uploadToS3 = async (file: File) => {
    const filename = `${Date.now()}-${file.name}`;

    const res = await fetch(`${baseApiUrl}/match/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        type: file.type,
      }),
    });

    const { url, fileUrl } = await res.json();

    if (!url) {
      console.error("Failed to generate S3 Presigned URL");
      throw new Error("Presigned URL generation failed");
    }

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

  const renderFeedback = (data: MatchResult["feedback"]) => {
    if (!data) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
        {data.strengths?.length > 0 && (
          <div>
            <p className="text-emerald-400 text-[10px] font-bold uppercase mb-2">
              strengths.exe
            </p>
            <ul>
              {data.strengths.map((s, i) => (
                <li key={i}>▹ {s}</li>
              ))}
            </ul>
          </div>
        )}

        {data.weaknesses?.length > 0 && (
          <div>
            <p className="text-rose-400 text-[10px] font-bold uppercase mb-2">
              weaknesses.log
            </p>
            <ul>
              {data.weaknesses.map((w, i) => (
                <li key={i}>▹ {w}</li>
              ))}
            </ul>
          </div>
        )}

        {data.recommendations?.length > 0 && (
          <div>
            <p className="text-indigo-300 text-[10px] font-bold uppercase mb-2">
              recommendations.md
            </p>
            <ul>
              {data.recommendations.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-start justify-center gap-8 bg-[#050508] text-slate-200 p-8 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* History Sidebar */}
      <aside className="w-72 hidden xl:block sticky top-8">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-md h-[calc(100vh-64px)] overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Match History
            </h3>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => {
                  setResult({
                    jobId: h.job_id,
                    score: h.score,
                    feedback: h.feedback,
                  });
                  setStatus("COMPLETED");
                }}
                className="p-3 rounded-xl cursor-pointer hover:border-purple-500/40 transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-purple-400 font-mono font-bold">
                    {Math.round(h.score)}%
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase font-medium">
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/50"
                    style={{ width: `${h.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-2xl p-8 backdrop-blur-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <header className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Resume <span className="text-purple-500 italic">Intelligence</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Align your expertise with the modern job market.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Job Description */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 ml-1">
              Job Description
            </label>
            <textarea
              className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none text-sm text-slate-300 placeholder:text-slate-700 transition-all resize-none"
              rows={6}
              placeholder="Paste the target job description here..."
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 ml-1">
              Resume Document
            </label>
            <div className="relative group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files![0])}
              />
              <div className="w-full p-4 bg-black/20 border-2 border-dashed border-white/10 rounded-xl text-center group-hover:border-purple-500/50 transition-all flex items-center justify-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-purple-500/10 transition-colors">
                  <FileTextIcon className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-200 truncate max-w-[250px]">
                  {file ? file.name : "Select your PDF or Word file"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={
            status === "UPLOADING" || status === "PROCESSING" || !file || !jd
          }
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_-10px_rgba(147,51,234,0.5)] active:scale-[0.98]"
        >
          {status === "PROCESSING" || status === "UPLOADING" ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="uppercase tracking-widest text-xs">
                Processing Neural Match...
              </span>
            </>
          ) : (
            <>
              <span className="uppercase tracking-widest text-xs">
                Analyze Compatibility
              </span>
            </>
          )}
        </button>

        {/* Status & Results */}
        <div className="pt-4 border-t border-white/5">
          {status === "COMPLETED" && result && (
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                  <span className="text-5xl font-black text-white relative">
                    {Math.round(result.score)}
                    <span className="text-purple-500 text-2xl">%</span>
                  </span>
                </div>

                <div className="w-full max-w-sm bg-white/5 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-emerald-400 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-4 font-bold">
                  Matching Index
                </p>
              </div>

              {result.feedback && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 ring-1 ring-white/10">
                  {renderFeedback(result.feedback)}
                </div>
              )}
            </div>
          )}

          {status === "FAILED" && (
            <div className="flex items-center justify-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 animate-bounce">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Analysis failed. Please check your inputs.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Icon for the upload state
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
