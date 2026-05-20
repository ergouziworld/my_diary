# Database

This project uses Prisma + PostgreSQL.

## Relevant Models

- `User`
- `Entry`
- `EntryAnalysis`
- `EntryEmotion`
- `Task`
- `Tag`
- `EntryTag`
- `MoodRecord`
- `TimelineEvent`
- `WorkItem`
- `ChatSession`
- `ChatMessage`

## Entry Processor v1 Storage

- `Entry`
  - stores original raw text in `rawContent`
  - keeps `contentText` for backward compatibility
  - uses `type` and `inputType`
- `EntryAnalysis`
  - stores the AI summary
  - stores `compressedMemory`
  - stores `timelineType`
  - stores `confidence`
  - stores the raw AI payload
- `EntryEmotion`
  - stores emotion name, intensity, and reason
- `Task`
  - stores extracted tasks with `deadlineText` and `sourceText`
- `Tag` + `EntryTag`
  - store extracted tags and entry linkage

## Existing Models Reused

- Existing `Task` is reused instead of creating a second task table.
- Existing `Tag` / `EntryTag` are reused instead of adding a separate tag table.
- Existing `Entry` is extended instead of replaced.

## v1 Constraint

- No vector database.
- No separate long-memory index.
- No audio/video processing tables.
- No complex image understanding tables.

