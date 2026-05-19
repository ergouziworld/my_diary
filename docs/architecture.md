# 项目架构与模块设计

## 1. 系统目标

这是一个以“快速记录 + AI 自动整理 + AI 全局问答”为核心的个人生活系统。

用户输入多模态内容后，系统完成：

- 内容入库
- 多模态附件管理
- AI 结构化分析
- 标签、任务、情绪、时间线、人物关系沉淀
- 面向长期记忆的语义检索和问答

核心原则：

- 低成本输入
- 高可维护性
- AI 可替换
- 功能模块清晰分层
- 为移动端和多端复用留接口

---

## 2. 完整项目架构

### 2.1 文字架构图

```text
Web / Mobile App
  ├─ 首页输入页
  ├─ 时间线
  ├─ 情绪分析
  ├─ 工作 / 学习
  ├─ 任务中心
  └─ 大 AI 问答
        ↓
前端 UI 层
  ├─ 页面层 pages
  ├─ 组件层 components
  ├─ 状态层 stores
  ├─ 请求层 services / api
  └─ 类型层 types
        ↓
后端 API 层
  ├─ entries
  ├─ ai/analyze
  ├─ ai/chat
  ├─ timeline
  ├─ moods
  ├─ tasks
  ├─ work
  └─ uploads
        ↓
领域服务层
  ├─ entry service
  ├─ ai orchestration service
  ├─ retrieval service
  ├─ timeline service
  ├─ task extraction service
  ├─ mood analytics service
  └─ summary service
        ↓
基础设施层
  ├─ Prisma / DB
  ├─ Object Storage
  ├─ Vector Store
  ├─ OpenAI-compatible AI provider
  └─ Cache / queue later
```

### 2.2 前端架构

建议使用 `Vue3 + TypeScript + Vite`，若后续要移动端优先，页面和组件逻辑可迁移到 `uni-app`。

前端分层：

- `pages`：路由页面，只负责布局和数据编排
- `components`：通用 UI 和业务组件
- `stores`：全局状态，负责当前用户、草稿、筛选条件、会话状态
- `services`：调用后端 API
- `api`：请求封装和接口定义
- `types`：领域类型和 API 类型
- `utils`：纯工具函数

页面职责：

- 首页：超低成本输入和即时 AI 轻助手
- 时间线：全量记录浏览和筛选
- 情绪页：趋势、频率、触发点和人物关系
- 工作/学习页：项目、学习、灵感、阶段总结
- 任务页：提取、排序、自动规划
- 大 AI 页：长期记忆检索和深度问答

### 2.3 后端架构

建议 `Node.js + Express`，按“路由层 -> 服务层 -> 仓储层”分离。

后端模块：

- `routes`：HTTP 路由
- `controllers`：请求参数校验与响应整理
- `services`：业务编排
- `repositories`：数据库访问
- `jobs`：异步 AI 分析、总结、回填
- `middlewares`：认证、错误处理、限流、日志
- `providers`：AI、存储、向量检索适配器

### 2.4 AI 模块架构

AI 不直接写在页面里，也不直接散落在 controller 中，统一通过 AI 编排层管理。

AI 分层：

- `prompt registry`：统一存放 prompt
- `schema registry`：统一存放结构化输出 schema
- `provider adapter`：OpenAI / 兼容模型 / 本地模型可替换
- `orchestrator`：决定调用哪个 prompt、是否检索、是否写回数据库
- `retriever`：语义检索和上下文拼装
- `post-processor`：把模型输出转成标准领域对象

### 2.5 数据流设计

#### 记录流

```text
用户输入
  → 创建 entry
  → 上传附件
  → 触发 AI 分析
  → 写入 analysis / mood / tasks / timeline / work 等派生数据
  → 更新首页、时间线、任务和情绪视图
```

#### 大 AI 问答流

```text
用户提问
  → 语义解析
  → 检索相关 entry / analysis / task / mood / timeline
  → 拼装上下文
  → 调用可替换 AI provider
  → 返回答案 + 引用来源
```

#### 今日总结流

```text
当天记录聚合
  → 生成摘要
  → 聚合任务和情绪变化
  → 输出今日总结
```

---

## 3. 完整目录结构

下面是建议的长期目录，不要求一次性全部实现，但边界要先定好。

```text
src/
  app/
    page.tsx
    timeline/page.tsx
    mood/page.tsx
    work/page.tsx
    tasks/page.tsx
    chat/page.tsx
    api/
      entries/route.ts
      ai/analyze/route.ts
      ai/chat/route.ts
  components/
    layout/
    entry/
    timeline/
    mood/
    tasks/
    chat/
    charts/
    common/
  pages/                # 若未来切换到 pages router，可作为兼容层
  services/
    entry.service.ts
    ai.service.ts
    timeline.service.ts
    mood.service.ts
    task.service.ts
    work.service.ts
    retriever.service.ts
  api/
    client.ts
    entries.ts
    ai.ts
    timeline.ts
    moods.ts
    tasks.ts
    work.ts
  stores/
    auth.store.ts
    entry.store.ts
    timeline.store.ts
    task.store.ts
    chat.store.ts
  prompts/
    analyze-entry.prompt.ts
    summarize-day.prompt.ts
    answer-question.prompt.ts
    extract-tasks.prompt.ts
    extract-mood.prompt.ts
  schemas/
    analyze-entry.schema.ts
    summarize-day.schema.ts
    answer-question.schema.ts
  db/
    prisma.ts
    migrations/
    seed.ts
  repositories/
    entry.repo.ts
    analysis.repo.ts
    task.repo.ts
    mood.repo.ts
    timeline.repo.ts
    work.repo.ts
    file.repo.ts
    chat.repo.ts
  server/
    ai/
    storage/
    retrieval/
    analytics/
    timeline/
    tasks/
    mood/
    work/
  types/
    entry.ts
    analysis.ts
    task.ts
    mood.ts
    timeline.ts
    chat.ts
    common.ts
  utils/
    date.ts
    text.ts
    ids.ts
    logger.ts
    validation.ts
  config/
    env.ts
    ai-providers.ts
    feature-flags.ts
docs/
  architecture.md
  roadmap.md
  engineering.md
prisma/
  schema.prisma
```

### 目录职责说明

- `app`：路由页面和 API 路由
- `components`：可复用组件
- `services`：业务编排，处理写入、聚合和查询
- `api`：前端请求封装
- `stores`：UI 状态与缓存状态
- `prompts`：AI prompt，统一管理
- `schemas`：AI 输出 schema 和输入校验 schema
- `db`：数据库初始化、迁移、种子数据
- `repositories`：数据库访问层
- `server`：后端领域实现
- `types`：统一 TS 类型
- `utils`：纯工具函数
- `config`：环境和 provider 配置
- `docs`：架构、路线图和协作规范

---

## 4. 数据库设计

建议数据库使用 PostgreSQL，保留向量扩展能力。

### 4.1 核心实体关系

```text
User
  ├─ Entry
  ├─ Attachment
  ├─ AiAnalysis
  ├─ Task
  ├─ MoodRecord
  ├─ TimelineEvent
  ├─ WorkItem
  ├─ ChatSession
  └─ Tag / EntryTag

Entry
  ├─ Attachment
  ├─ AiAnalysis
  ├─ Task
  ├─ MoodRecord
  ├─ TimelineEvent
  └─ WorkItem

ChatSession
  └─ ChatMessage
```

### 4.2 核心数据表

#### `users`

- `id`
- `name`
- `email`
- `avatarUrl`
- `timezone`
- `createdAt`
- `updatedAt`

#### `entries`

用户原始记录，所有输入都先落这里。

- `id`
- `userId`
- `contentText`
- `inputType`：text / image / audio / video / link / mixed
- `sourceUrl`
- `rawMetadata`
- `createdAt`
- `updatedAt`

#### `attachments`

存储所有附件信息。

- `id`
- `entryId`
- `userId`
- `fileUrl`
- `fileType`
- `mimeType`
- `size`
- `duration`
- `width`
- `height`
- `createdAt`

#### `ai_analyses`

保存每次 AI 分析结果，便于复盘和重跑。

- `id`
- `entryId`
- `userId`
- `provider`
- `model`
- `summary`
- `moodLabel`
- `moodScore`
- `tags`
- `extractedTasks`
- `extractedTimelineEvents`
- `extractedWorkItems`
- `extractedPeople`
- `rawAiOutput`
- `promptVersion`
- `createdAt`

#### `moods`

情绪事实表，用于聚合趋势。

- `id`
- `userId`
- `entryId`
- `moodLabel`
- `moodScore`
- `reason`
- `createdAt`

#### `tasks`

任务事实表。

- `id`
- `userId`
- `entryId`
- `title`
- `description`
- `status`
- `priority`
- `dueDate`
- `sourceType`
- `createdAt`
- `updatedAt`

#### `task_links`

任务与来源、标签、人物的关联，避免任务表无限膨胀。

- `id`
- `taskId`
- `sourceEntryId`
- `relatedEntityType`
- `relatedEntityId`

#### `tags`

- `id`
- `userId`
- `name`
- `type`
- `createdAt`

#### `entry_tags`

- `id`
- `entryId`
- `tagId`
- `confidence`

#### `timeline_events`

用于时间线和事件整理。

- `id`
- `userId`
- `entryId`
- `title`
- `description`
- `eventTime`
- `eventType`
- `createdAt`

#### `people`

人物实体。

- `id`
- `userId`
- `name`
- `alias`
- `notes`
- `createdAt`

#### `entry_people`

- `id`
- `entryId`
- `personId`
- `relationType`
- `confidence`

#### `work_items`

工作、学习、项目、比赛、课程等统一沉淀。

- `id`
- `userId`
- `entryId`
- `category`
- `projectName`
- `title`
- `description`
- `status`
- `createdAt`
- `updatedAt`

#### `chat_sessions`

大 AI 对话会话。

- `id`
- `userId`
- `title`
- `mode`：instant / long_memory
- `createdAt`
- `updatedAt`

#### `chat_messages`

- `id`
- `sessionId`
- `role`
- `content`
- `citations`
- `createdAt`

#### `vector_documents`

用于后续语义检索，早期可以先不真正接外部向量库，保持表结构。

- `id`
- `userId`
- `sourceType`
- `sourceId`
- `content`
- `embeddingRef`
- `metadata`
- `createdAt`

#### `daily_summaries`

- `id`
- `userId`
- `date`
- `summary`
- `highlights`
- `createdAt`

### 4.3 表关系建议

- `users 1:n entries`
- `entries 1:n attachments`
- `entries 1:n ai_analyses`
- `entries 1:n tasks`
- `entries 1:n moods`
- `entries 1:n timeline_events`
- `entries 1:n work_items`
- `users 1:n tags`
- `entries n:m tags` via `entry_tags`
- `users 1:n people`
- `entries n:m people` via `entry_people`
- `chat_sessions 1:n chat_messages`

---

## 5. 模块拆分建议

### 5.1 应独立模块

- 输入与附件上传
- AI 分析编排
- 时间线聚合
- 情绪统计
- 任务抽取与规划
- 大 AI 长期问答
- 语义检索
- 文件存储

### 5.2 耦合风险高的模块

- `entry` 和 `ai analysis`
- `task extraction` 和 `timeline`
- `people relation` 和 `long memory chat`
- `mood` 和 `daily summary`
- `work` 和 `tags`

这些模块应该通过派生数据和服务层通信，不要互相直接写业务细节。

### 5.3 最容易失控的模块

- 大 AI 问答：容易把所有逻辑塞进一个 prompt
- 任务规划：容易把抽取、去重、排序、状态流转混在一起
- 情绪分析：容易和主观解释耦合太深
- 向量检索：容易和数据库查询混用

控制策略：

- prompt 分层
- schema 固化
- provider 抽象
- 服务拆成读写两侧
- 结果先落分析层，再映射到事实表

---

## 6. Git 工程建议

### 6.1 分支结构

- `main`：稳定发布
- `dev`：集成分支
- `feature/*`：功能开发
- `fix/*`：缺陷修复
- `chore/*`：工程和脚手架调整

### 6.2 Codex 协同开发规范

- 一个任务只改一个清晰责任域
- UI、服务、数据库迁移尽量分开提交
- AI prompt、schema、service 不要混在同一个大文件
- 新功能先补类型和接口，再补实现
- 变更前先查重，避免重复造轮子
- 数据模型改动必须同步更新文档

### 6.3 Commit 规范

建议使用 Conventional Commits：

- `feat: add timeline filters`
- `fix: handle empty ai response`
- `refactor: split ai orchestrator`
- `docs: update architecture`
- `chore: add database migration`

### 6.4 Changelog 规范

每个版本固定三段：

- Added
- Changed
- Fixed

对 AI 类改动额外记录：

- prompt version
- schema version
- provider change

---

## 7. 结论

这个项目最关键的不是“做一个能聊天的日记”，而是把“记录 -> 结构化 -> 检索 -> 复盘 -> 生成洞察”做成稳定链路。

因此，第一阶段最重要的是：

- 统一数据入口
- 统一 AI 编排
- 统一 schema
- 统一派生数据模型
- 统一存储和检索边界

