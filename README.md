# J-Sir

一个基于 **Spring Boot + Spring AI** 的 Java 学习助手，支持前端流式聊天、Markdown 渲染、代码块复制、深浅色模式切换，以及本地对话记忆。

## 功能特性

- 流式 AI 对话：前端通过 `POST /ai/chat` 获取流式回复
- 对话记忆：服务端将历史记录写入本地 `chat-history.json`
- 记忆裁剪：仅保留最近 **20 轮**（40 条消息）
- Markdown 渲染：支持代码块、表格、列表、引用等
- 前端体验：动态背景、空状态、发送状态（加载/成功/失败）、代码块复制按钮（hover 显示）
- 主题切换：支持深色/浅色模式

## 技术栈

- Java 21
- Spring Boot 4.0.5
- Spring AI 2.0.0-M4
- Maven Wrapper (`mvnw`, `mvnw.cmd`)
- 前端：原生 HTML/CSS/JavaScript + `marked` + `DOMPurify`

## 项目结构

```text
J-Sir/
├─ config.json                       # AI 配置（根目录，运行时读取）
├─ chat-history.json                 # 本地对话历史
├─ pom.xml
├─ src/main/java/com/Muimi/JSir/
│  ├─ DemoApplication.java           # 启动入口（启动前应用 AI 配置）
│  ├─ controller/
│  │  ├─ AIChatController.java       # /ai/chat
│  │  └─ PageController.java         # /page
│  ├─ dto/
│  │  └─ ChatRequest.java            # 请求体：{ "msg": "..." }
│  ├─ service/
│  │  └─ AIService.java              # 流式对话 + 记忆拼接
│  └─ utils/
│     ├─ ConfigUtil.java             # 读取并应用 config.json
│     └─ HistoryUtil.java            # 读写 chat-history.json
└─ src/main/resources/
   ├─ application.properties         # 默认端口 10101
   └─ static/
      ├─ index.html
      ├─ css/index.css
      └─ js/index.js
```

## 快速开始

### 1) 准备配置

编辑根目录 `config.json`，配置一个可用模型：

```json
{
  "ai": {
    "zhipuai": {
      "apiKey": "YOUR_API_KEY",
      "model": "YOUR_MODEL"
    }
  }
}
```

也支持 OpenAI :
```json
{
  "ai": {
    "openai": {
      "apiKey": "YOUR_API_KEY",
      "baseUrl": "YOUR URL",
      "model": "YOUR_MODEL"
    }
  }
}
```

### 2) 启动应用（Windows PowerShell）

```powershell
.\mvnw.cmd spring-boot:run
```

默认端口来自 `src/main/resources/application.properties`：`10101`。

应用启动后会尝试自动打开浏览器：`http://localhost:10101/ `。

## 接口说明

### `POST /ai/chat`

- Content-Type: `application/json`
- 请求体：

```json
{
  "msg": "请解释一下 Java Stream 的 map 和 flatMap 区别"
}
```

- 返回：`Flux<String>`（流式文本）

> 前端已按流式响应处理，并将结果按 Markdown 渲染。

## 对话记忆机制

- 文件：`chat-history.json`
- 写入时机：每轮回复完成后自动写入
- 数据结构：按 `role + content` 存储（`user` / `assistant`）
- 裁剪策略：超过 20 轮时，仅保留最近 20 轮

## 前端说明

- 页面：`/`（静态资源）或 `/page`
- 发送方式：统一使用 `POST`
- 支持中断生成（`stop` 按钮）
- 每次打开页面会清空浏览器 `localStorage` 里的历史缓存（服务端文件历史仍保留）

## 常见问题

- 启动时报 `Missing config file`：请确认根目录存在 `config.json`
- 返回 404 或静态资源路径异常：确认请求路径是 `POST /ai/chat`，页面入口使用 `/` 或 `/page`
- 无回复或报鉴权错误：检查 `config.json` 的 `apiKey` 与 `model`

## License

本项目采用 MIT License，详见 [LICENSE](LICENSE)。

