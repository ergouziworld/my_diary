import type { FinanceType, InputType, MediaType, RecordStatus, TaskStatus } from "@prisma/client";

export type { FinanceType, InputType, MediaType, RecordStatus, TaskStatus };

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
