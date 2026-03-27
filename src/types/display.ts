// Display analyzer types — migrated from DisplayScoreCard.tsx

export interface DisplayResult {
  overallScore: number;
  scores: {
    hierarchy: number;
    ctaVisibility: number;
    brandClarity: number;
    messageClarity: number;
    visualContrast: number;
  };
  textToImageRatio: string;
  textRatioFlag: boolean;
  improvements: { fix: string; category: string; severity: string }[];
  formatNotes: string;
  verdict: string;
  placementRisk: "low" | "medium" | "high";
  placementRiskNote: string;
}
