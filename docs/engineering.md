# 工程与协作规范

## 1. 统一约定

- AI provider 必须可替换
- Prompt 必须单独文件管理
- Schema 必须版本化
- 页面只做展示和交互
- 服务层负责编排
- 仓储层负责数据库访问

## 2. 文件边界

- `prompts/` 只放 prompt
- `schemas/` 只放输出约束
- `services/` 只放业务编排
- `repositories/` 只放数据访问
- `components/` 只放 UI
- `types/` 只放领域类型

## 3. Code Review 关注点

- 新增字段是否破坏现有查询
- AI 输出是否可回填到数据库
- 是否引入跨层调用
- 是否把复杂逻辑写进页面
- 是否缺少幂等处理

