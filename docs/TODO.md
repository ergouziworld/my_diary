# TODO

- 把 `src/server/*` 里的占位服务函数替换成真实持久化逻辑。
- 把首页看板指标接到 Prisma 的实时数据上。
- 实现 `Entry` 的列表和创建流程。
- 基于 `TimelineEvent` 实现时间线聚合和筛选。
- 实现 `Task` 的生成和状态更新。
- 实现 `MoodRecord` 的情绪趋势计算。
- 实现 `ChatSession` 和 `ChatMessage` 的会话存储与消息历史。
- 扩展当前 `analyze-entry` 之外的 AI 分析能力。
- 为 `Attachment` 和 `AlbumItem` 接入上传与存储。
- 为 API 路由和服务层工具增加测试。
- 如果继续扩展 AI 层，再补真实的提示词文件或提示词注册机制。
