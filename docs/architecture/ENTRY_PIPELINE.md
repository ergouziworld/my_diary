# Entry Pipeline

## Current Flow

1. The user enters a text entry on the homepage.
2. The client saves the raw text with `POST /api/entries`.
3. The same client payload is sent to `POST /api/ai/analyze`.
4. The analysis route validates the entry and runs the AI service.
5. The route persists the analysis result and derived records.

## Saved Data

- `Entry`
  - `rawContent`
  - `contentText`
  - `type`
  - `inputType`
- `EntryAnalysis`
  - `summary`
  - `compressedMemory`
  - `timelineType`
  - `confidence`
  - `rawAiResult`
- `EntryEmotion`
  - `name`
  - `intensity`
  - `reason`
- `Task`
  - `title`
  - `priority`
  - `deadlineText`
  - `sourceText`
  - `status`
- `EntryTag`
  - links entry to user tags

## Error Handling

- Empty `content` returns a clear `400`.
- Unknown entry IDs return `404`.
- AI failures do not block entry persistence.
- The service falls back to mock output when the provider call fails.

## Notes

- This stage only supports text entries.
- It does not handle audio, video, or complex image understanding.
- It does not implement long-memory search.

