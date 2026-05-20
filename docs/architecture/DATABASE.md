# 数据库

项目使用 Prisma + PostgreSQL。

核心模型分组：
- 身份：`User`
- 日记内容：`Entry`
- 媒体：`Attachment`、`AlbumItem`
- 分析：`AiAnalysis`
- 计划：`Task`、`TaskLink`
- 情绪：`MoodRecord`
- 时间线：`TimelineEvent`、`DailySummary`
- 知识：`Tag`、`Person`、`EntryTag`、`EntryPerson`
- 工作：`WorkItem`
- 对话：`ChatSession`、`ChatMessage`
- 检索：`VectorDocument`

重要枚举分组：
- 输入类型和媒体类型
- 任务状态和优先级
- 时间线事件类型
- 工作类别
- 对话模式和角色
- 分析提供方

值得注意的模型关系：
- `User` 拥有整个内容图谱
- `Entry` 是后续派生的中心源记录
- `Attachment` 可以挂在 `Entry` 上，也可以作为用户下的独立资源存在
- `AiAnalysis` 存储一条 `Entry` 的结构化分析结果
- `Task`、`MoodRecord`、`TimelineEvent` 和 `WorkItem` 都可能回指到 `Entry`
- `Tag` 和 `Person` 都是用户级唯一，条目关系通过中间表建立
- `ChatSession` 包含多条 `ChatMessage`
- `VectorDocument` 是当前检索层的抽象

索引和唯一性模式：
- 大多数内容表按 `userId` 和时间字段建索引
- 用户级标签名和人名有唯一约束
- 条目-标签和条目-人物组合唯一
- 每个用户每天只有一条 `DailySummary`

数据库访问目前已经在 schema 里定义好了，但很多服务函数仍然只是返回空数组或占位结果。
