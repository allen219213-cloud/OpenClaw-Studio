# 进阶开发教程（guide-advanced）

面向对象：**有开发经验的同学**。  
目标：支持插件扩展、自定义配置和二次部署。

---

## 1. 插件开发流程

### 1.1 约定插件结构

建议每个插件具备以下结构：

```text
plugins/
  my-plugin/
    manifest.json
    index.py
    README.md
```

### 1.2 插件清单示例

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "entry": "index.py",
  "description": "自定义数据处理插件"
}
```

### 1.3 插件入口示例（Python）

```python
# plugins/my-plugin/index.py
from typing import Dict, Any


def run(input_data: Dict[str, Any]) -> Dict[str, Any]:
    # 这里写你的业务逻辑
    output = {
        "success": True,
        "summary": f"processed: {input_data.get('text', '')}"
    }
    return output
```

---

## 2. 自定义配置项

### 2.1 后端新增配置字段

文件：`backend/app/core/config.py`

```python
class Settings(BaseSettings):
    # ...已有配置
    plugin_dir: str = "./plugins"
    max_concurrency: int = 4
```

### 2.2 前端新增配置入口

在“设置页面”增加对应表单项，并通过 `PUT /api/v1/settings` 保存。

---

## 3. 二次开发部署

### 3.1 本地开发构建

```bash
# 前端
cd frontend
npm run build

# 后端
cd backend
python -m compileall app
```

### 3.2 Docker 生产部署

```bash
docker compose -f docker-compose.yml up --build -d
```

### 3.3 反向代理（Nginx）示例

```nginx
server {
  listen 80;
  server_name [YOUR_DOMAIN];

  location /api/ {
    proxy_pass http://127.0.0.1:8000;
  }

  location / {
    proxy_pass http://127.0.0.1:5173;
  }
}
```

---

## 4. 性能优化建议

- 前端：对重页面使用 `React.lazy` 做按需加载。
- 后端：执行任务时启用队列和并发限制。
- 存储：将频繁读取的数据缓存到内存层。
- 监控：记录请求耗时和错误日志，定位瓶颈。

---

## 5. 调试技巧

- 查看后端日志：`runtime/app.log`
- 检查 WebSocket 推送链路：`/ws/status`、`/ws/workflows/{id}/logs`
- 出现奇怪行为时先跑：

```bash
npm run lint
npm run build
python -m compileall backend/app
```

---

下一步建议阅读实战案例：[`case-media.md`](./case-media.md)
