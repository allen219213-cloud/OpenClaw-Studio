# 基础配置指南（guide-basic）

面向对象：**新手开发者 / 普通用户**。  
目标：从 0 到 1 跑通项目。

---

## 第一步：环境检查

请先确认以下环境：

- [ ] Git >= 2.30
- [ ] Node.js >= 18
- [ ] Python >= 3.11
- [ ] Docker（可选）

```bash
git --version
node -v
python --version
docker --version
```

截图占位符：`[截图：环境检查命令输出]`

---

## 第二步：配置文件说明

### 1) 后端配置

文件：`backend/.env`（如无可新建）

关键参数：

- `APP_NAME`：服务名称
- `DEBUG`：是否开启调试模式（开发环境可设 `true`）
- `DATABASE_URL`：数据库连接地址

示例：

```env
APP_NAME=OpenClaw-Studio
DEBUG=true
DATABASE_URL=sqlite:///./runtime/openclaw.db
```

截图占位符：`[截图：.env 示例配置]`

### 2) 前端配置

文件：`frontend/.env.local`

关键参数：

- `VITE_API_BASE_URL`：后端接口地址
- `VITE_WS_URL`：WebSocket 地址

示例：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/status
```

截图占位符：`[截图：前端环境变量配置]`

---

## 第三步：启动项目

### 方式 A：Docker（推荐）

```bash
docker compose up --build
```

### 方式 B：手动启动

```bash
# 后端
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端（新终端）
cd frontend
npm install
npm run dev
```

截图占位符：`[截图：启动成功终端输出]`

---

## 第四步：验证是否运行成功

- 前端页面：`http://localhost:5173`
- 健康检查：`http://localhost:8000/api/v1/health`

截图占位符：`[截图：健康检查返回值]`

---

## 常见问题排查

### Q1：后端启动失败

现象：`ModuleNotFoundError` 或依赖缺失。  
处理：

```bash
pip install -r backend/requirements.txt
```

### Q2：端口被占用

现象：`Address already in use`。  
处理：修改端口，例如 `--port 8010`，并同步修改前端 `VITE_API_BASE_URL`。

### Q3：前端请求失败（CORS）

检查后端 `CORS` 配置，确保前端域名在允许列表中。

### Q4：页面白屏

建议先执行：

```bash
cd frontend
npm run lint
npm run build
```

如果报错，优先修复 TypeScript 类型问题。

---

你现在已经完成基础配置。下一步建议阅读：[`guide-advanced.md`](./guide-advanced.md)
