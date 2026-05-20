# my_diary

## 本地预览速查

- 预览地址: `http://127.0.0.1:3000`
- 稳定预览: 双击 `scripts\preview.cmd`
- 开发启动: 双击 `scripts\start-dev.cmd`
- 清缓存重启: 双击 `scripts\restart-dev.cmd`

## 刷新方式

- 改代码后先保存文件
- 开发模式通常会自动热更新
- 没变化就手动刷新浏览器
- 如果用的是 `preview.cmd`，改完代码需要重新运行一次

## 热更新失效

1. 关闭当前命令窗口
2. 重新运行 `scripts\restart-dev.cmd`
3. 再打开 `http://127.0.0.1:3000`

## 网页打不开

1. 确认命令行没有报错
2. 确认 3000 端口未被别的程序占用
3. 优先运行 `scripts\preview.cmd`
4. 如果还是不行，运行 `scripts\restart-dev.cmd`
5. 检查 `.env.local` 是否存在

## 本地环境

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/my_diary?schema=public"
AI_PROVIDER="mock"
DEMO_USER_ID="demo-user"
PUBLIC_APP_URL="http://127.0.0.1:3000"
```
