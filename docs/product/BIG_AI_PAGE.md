# 大模型页

大模型页是聊天式 AI 的入口。

代码位置：
- `src/app/chat/page.tsx`
- `src/app/api/chat/route.ts`

当前状态：
- UI 只是一个简单的壳
- 聊天 API 目前返回 `501 Not Implemented`
- 这个页面被放在对话式 AI 的入口位置

UI 结构：
- 一个大的输入框
- 快速建议按钮
- 几段说明 AI 能力的文字

数据模型方向：
- `ChatSession`
- `ChatMessage`
- 后续的记忆和检索支持

这个页面刻意和日记条目分析路由分开。一个偏对话式 AI，另一个偏结构化分析。

设计目标：
- 允许围绕日记内容进行 AI 交互
- 支持更长的会话
- 以后连接到聊天记忆和检索
