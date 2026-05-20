# 条目流水线

条目流水线是整个应用的核心流程。

当前形态：
- 用户写入或导入内容
- 内容被表示为一个 `Entry`
- 条目可能包含 `contentText`、`inputType`、`sourceUrl` 和 `rawMetadata`
- 附件单独存储为 `Attachment`
- 可以通过 `POST /api/ai/analyze` 对条目发起 AI 分析
- 后续派生数据可以填充任务、情绪、时间线事件和工作事项

已实现的边界：
- `GET /api/entries` 目前返回 `{ ok: true, data: [] }`
- `POST /api/entries` 目前返回 `{ ok: true }`
- `POST /api/ai/analyze` 会校验请求 JSON，并进入结构化 AI 分析

相关代码：
- `src/app/api/entries/route.ts`
- `src/app/api/ai/analyze/route.ts`
- `src/server/aiAnalyze.ts`
- `prisma/schema.prisma`

这个流水线的设计目标是：让日记录入在 UI 层尽量简单，而分析和派生对象在服务层后置生成。
