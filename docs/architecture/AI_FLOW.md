# AI 流程

当前 AI 流程只有一条已实现的公开路径：

1. `POST /api/ai/analyze`
2. 请求体会先经过 `parseAnalyzeEntryInput` 校验
3. `analyzeEntry` 创建 AI 生产器
4. 使用 `analyzeEntrySchema` 请求结构化响应

相关代码：
- `src/app/api/ai/analyze/route.ts`
- `src/server/aiAnalyze.ts`
- `src/lib/aiProducer.ts`
- `src/lib/aiSchemas.ts`

AI 层的设计目标是结构化抽取，而不只是自由文本输出。schema 已经预留了这些内容：
- 总结
- 情绪标签和分数
- 标签
- 任务
- 时间线事件
- 工作事项
- 人物
- 原始输出保留

分析输入约定：
- `text` 是必填项，且不能为空
- `source` 是可选项
- `metadata` 是可选项，但如果传入必须是对象

路由行为：
- 非法 JSON 返回 HTTP 400
- 非法参数形状返回 HTTP 400，并带校验错误信息
- 成功分析返回 `{ ok: true, result }`

当前限制：
- 聊天接口仍然是占位
- 多模态流水线还没有实现
- `docs/prompts/` 下的提示词文件只是文档说明
- 记忆和检索已经有方向，但还没有完全接通
