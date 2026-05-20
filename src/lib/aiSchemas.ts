export const analyzeEntrySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    moodLabel: { type: "string" },
    moodScore: { type: "number" },
    tags: { type: "array", items: { type: "string" } },
    extractedTasks: { type: "array", items: { type: "object", additionalProperties: true } },
    extractedFinance: { type: "array", items: { type: "object", additionalProperties: true } },
    extractedTimelineEvents: { type: "array", items: { type: "object", additionalProperties: true } },
    extractedAlbumItems: { type: "array", items: { type: "object", additionalProperties: true } },
    extractedWorkItems: { type: "array", items: { type: "object", additionalProperties: true } }
  },
  required: ["summary", "moodLabel", "moodScore", "tags", "extractedTasks", "extractedFinance", "extractedTimelineEvents", "extractedAlbumItems", "extractedWorkItems"]
} as const;

export type AnalyzeEntryOutput = {
  summary: string;
  moodLabel: string;
  moodScore: number;
  tags: string[];
  extractedTasks: unknown[];
  extractedFinance: unknown[];
  extractedTimelineEvents: unknown[];
  extractedAlbumItems: unknown[];
  extractedWorkItems: unknown[];
};

export const summarizeDaySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    highlights: { type: "array", items: { type: "string" } }
  },
  required: ["summary", "highlights"]
} as const;

export const answerChatSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" }
  },
  required: ["answer"]
} as const;

export type SummarizeDayOutput = {
  summary: string;
  highlights: string[];
};

export type AnswerChatOutput = {
  answer: string;
};
