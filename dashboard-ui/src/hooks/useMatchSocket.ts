import { useEffect } from "react";
import { socket } from "../socket/socket";
import type { MatchResult } from "../types/match";

export const useMatchSocket = (
  jobId: string | null,
  onComplete: (data: MatchResult) => void,
) => {
  useEffect(() => {
    const handler = (data: MatchResult) => {
      if (data.jobId === jobId) {
        onComplete(data);
      }
    };

    socket.on("matchCompleted", handler);

    return () => {
      socket.off("matchCompleted", handler);
    };
  }, [jobId, onComplete]);
};
