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
