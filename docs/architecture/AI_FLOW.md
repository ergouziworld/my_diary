# AI Flow

## Stage 1: Entry Processor v1

This project currently uses one production AI flow:

1. The homepage saves a text entry through `POST /api/entries`.
2. The client then calls `POST /api/ai/analyze` with `entryId`, `content`, and `type`.
3. The AI service picks a provider from `AI_PROVIDER`.
4. The provider returns structured JSON.
5. The route persists:
   - `entry_analysis`
   - `entry_emotions`
   - `tasks`
   - `entry_tags`

## Provider Rules

- `mock` is the default fallback.
- `openai`, `qwen`, and `deepseek` use the same OpenAI-compatible backend shape.
- API keys are read only on the server.
- The frontend never calls the provider directly.

## Prompt Rules

- Prompts live in `src/server/ai/prompts/entryAnalyzePrompt.ts`.
- Page components must not contain prompt text.
- The prompt must avoid inventing facts not present in the entry text.

## Output Rules

The entry analysis output must include:

- `summary`
- `compressedMemory`
- `tags`
- `emotions`
- `tasks`
- `timelineType`
- `people`
- `projects`
- `confidence`

If the provider fails, the service falls back to `mock` output instead of crashing the entry pipeline.

## Small AI / Category AI / Big AI

### Small AI

- Only reads the current input box.
- Input length should stay within 100 Chinese characters when used in UI flows.
- Reply should stay within 100 Chinese characters.
- Default reply target is 10-30 Chinese characters.
- Does not read long-term memory.
- Does not write to long-term storage.

### Category AI

- Handles entry analysis.
- Produces structured JSON.
- Writes analysis, tags, emotions, and tasks.

### Big AI

- Not implemented in this stage.
- Later it will first use tags, `timelineType`, `people`, and `projects` for coarse retrieval.
- Then it can read `compressedMemory`.
- Only high-relevance entries may use `rawContent` or attachment descriptions for deeper analysis.

