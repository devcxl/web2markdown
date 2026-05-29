# Web2Markdown

抽取网页正文并转换为带 YAML frontmatter 的 Markdown 格式。一键复制，适合知识管理、笔记归档。

## 安装

### Chrome / Chromium 系

1. 下载 [最新 Release](https://github.com/devcxl/web2markdown/releases) 中的 `web2markdown-chrome.zip`
2. 解压到本地目录
3. 打开 `chrome://extensions/`，启用「开发者模式」，点击「加载已解压的扩展程序」
4. 选择解压后的目录

### Firefox

1. 下载 [最新 Release](https://github.com/devcxl/web2markdown/releases) 中的 `web2markdown-firefox.zip`
2. 打开 `about:addons`，点击齿轮 → 「从文件安装附加组件」
3. 选择 zip 文件

## 使用

1. 打开任意网页（文章、博客、文档等）
2. 点击工具栏上的 Web2Markdown 图标
3. 弹窗自动提取正文并转换为 Markdown
4. 点击 **Copy Markdown** 按钮复制到剪贴板

输出格式示例：

```markdown
---
title: "文章标题"
url: "https://example.com/article"
clipped: "2026-05-30"
tags: ["web_clip"]
source_type: web_clip
images: 3
---

# 文章标题

正文内容……

## 小节标题

段落文字……
```

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 开始开发

```bash
# 安装依赖
npm install

# 启动开发服务器（Chrome，热更新）
npm run dev

# Firefox 开发模式
npm run dev:firefox
```

开发模式下，在 `chrome://extensions/` 或 `about:debugging` 中加载 `.output/chrome-mv3-dev` 目录即可。

### 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | Chrome 开发模式 |
| `npm run dev:firefox` | Firefox 开发模式 |
| `npm run build` | 生产构建 |
| `npm run build:firefox` | Firefox 生产构建 |
| `npm run zip` | 打包 Chrome zip |
| `npm run zip:firefox` | 打包 Firefox zip |
| `npm test` | 运行测试 |
| `npm run typecheck` | TypeScript 类型检查 |

## 架构

```
用户点击扩展图标
      │
      ▼
popup/  ─── 按需注入 content script ──→ 发送消息
                                            │
                                            ▼
                                    content.ts
                                    └── convertPageToMarkdown()
                                         ├── Readability 提取正文
                                         ├── URL 绝对化 & 安全过滤
                                         ├── Turndown HTML→Markdown
                                         │    └── 标题自动降级 (h1→##)
                                         │    └── GFM 表格支持
                                         └── 拼接 YAML frontmatter
                                            │
                                            ▼
                                    popup/ ← 接收结果
                                     └── 展示 + 一键复制
```

### 技术栈

- [WXT](https://wxt.dev) — 浏览器扩展框架
- [@mozilla/readability](https://github.com/mozilla/readability) — 网页正文提取
- [turndown](https://github.com/mixmark-io/turndown) + [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) — HTML → Markdown 转换
- [Vitest](https://vitest.dev) + [jsdom](https://github.com/jsdom/jsdom) — 单元测试

### 项目结构

```
├── entrypoints/
│   ├── background.ts          # Service Worker
│   ├── content.ts             # Content Script（按需注入）
│   └── popup/                 # 弹窗 UI
│       ├── index.html
│       ├── main.ts
│       └── style.css
├── src/
│   ├── markdown/
│   │   ├── convertPageToMarkdown.ts   # 核心转换编排
│   │   ├── extractArticle.ts          # 正文提取
│   │   └── htmlToMarkdown.ts          # HTML→Markdown
│   └── shared/
│       ├── messages.ts        # 消息类型定义
│       └── types.ts           # 公共类型
└── tests/
    └── convertPageToMarkdown.test.ts  # 核心逻辑测试
```

## 许可

[MIT](LICENSE)
