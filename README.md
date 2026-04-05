# OpenClaw-Studio

可视化多智能体工作流平台。用拖拽方式编排任务流、实时查看执行过程、统一管理模型与工具，支持本地部署和二次开发。

[![GitHub Stars](https://img.shields.io/github/stars/allen219213-cloud/OpenClaw-Studio?style=flat-square)](https://github.com/allen219213-cloud/OpenClaw-Studio/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/allen219213-cloud/OpenClaw-Studio?style=flat-square)](https://github.com/allen219213-cloud/OpenClaw-Studio/issues)
[![License](https://img.shields.io/github/license/allen219213-cloud/OpenClaw-Studio?style=flat-square)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/allen219213-cloud/OpenClaw-Studio?style=flat-square)](https://github.com/allen219213-cloud/OpenClaw-Studio/releases)

## 项目解决什么问题

OpenClaw-Studio 解决的是“多智能体应用很强，但搭建和运营门槛高”的问题：

- 不会写复杂配置的人，也能通过可视化界面编排任务。
- 需要追踪执行过程的人，可以看到实时日志和智能体对话。
- 需要团队协作的人，可以共享模板、共享任务、复用资产。

## 核心功能

1. 任务可视化编排器（React Flow）
- 拖拽编排节点：开始、结束、智能体、条件判断、循环、并行
- 节点属性面板：配置 label、agent_id、表达式等参数
- JSON/YAML 导入导出，兼容 OpenClaw 风格结构
- 内置 20+ 工作流模板

2. 任务执行中心
- 任务列表搜索与过滤
- 执行控制：启动、暂停、继续、停止、重试
- 实时日志流（WebSocket）
- 智能体思考过程与输出展示
- 结果导出：Markdown / HTML / PDF

3. API 配置中心
- 支持主流模型提供商：OpenAI、Anthropic、Gemini、DeepSeek、豆包、通义千问、文心一言
- API Key 管理、默认模型、代理配置
- 配额统计与连接测试

4. 智能体管理
- 智能体 CRUD、模板库、导入导出
- 创建向导、模型参数配置、工具配置、记忆配置
- Markdown 实时预览

5. 工具市场与协作分享
- 官方工具 + 第三方工具安装入口
- 工具评分与评论
- 多用户（管理员/普通用户）
- 公开/私有分享链接
- 社区模板上传、下载、评分

## 技术栈

- 后端：Python 3.11+, FastAPI, Pydantic, SQLAlchemy
- 前端：React 18, TypeScript, Vite, Tailwind CSS v3, React Flow v11, Zustand
- 部署：Docker Compose / 手动安装
- 通信：REST API + WebSocket

## 界面预览

### 1) 全景图
![main](./assets/screenshots/screenshot-1-main.png)

### 2) 任务编排特写
![composer](./assets/screenshots/screenshot-2-core.png)

### 3) 执行页效果
![execution](./assets/screenshots/compare-old-vs-new.png)

> 截图存储目录：`assets/screenshots/`

## 3 分钟快速启动

### 方式 A：Docker Compose（推荐）

```bash
git clone https://github.com/allen219213-cloud/OpenClaw-Studio.git
cd OpenClaw-Studio
docker compose up --build
```

启动后访问：
- 前端：http://localhost:5173
- 后端健康检查：http://localhost:8000/api/v1/health

### 方式 B：手动启动

```bash
# backend
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 文档与教程

- 基础配置：[`docs/guide-basic.md`](./docs/guide-basic.md)
- 进阶开发：[`docs/guide-advanced.md`](./docs/guide-advanced.md)
- 实战案例：[`docs/case-media.md`](./docs/case-media.md)
- 视觉素材制作规范：[`docs/visual-assets-guide.md`](./docs/visual-assets-guide.md)
- 快速入门视频脚本：[`docs/QUICKSTART_VIDEO_SCRIPT.md`](./docs/QUICKSTART_VIDEO_SCRIPT.md)
- 用户手册：[`docs/USER_MANUAL.md`](./docs/USER_MANUAL.md)
- 开发者文档：[`docs/DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md)

## 贡献

欢迎提交 Issue 和 PR：

- Bug 反馈：<https://github.com/allen219213-cloud/OpenClaw-Studio/issues>
- 功能建议：<https://github.com/allen219213-cloud/OpenClaw-Studio/discussions>

建议提交前先执行：

```bash
cd frontend && npm run lint && npm run build
cd ../backend && python -m compileall app
```

## License

MIT，详见 [LICENSE](./LICENSE)。
