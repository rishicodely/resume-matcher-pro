export type MatchResult = {
  jobId: string;
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
};
