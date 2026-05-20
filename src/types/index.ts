import type { InputType, MediaType, TaskStatus } from "@prisma/client";

export type { InputType, MediaType, TaskStatus };

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
