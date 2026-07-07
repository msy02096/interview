# Interview Tracker

个人面试复盘与知识库。内容使用 Markdown 维护，Astro 在构建时解析为静态网页，适合推送到 GitHub 后由 Hermes 自动部署。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:4321` 查看页面。

## 常用命令

```bash
npm test
npm run build
npm run preview
```

`npm run build` 会先执行 `astro check`，再生成静态站点到 `dist/`。

## 内容目录

```text
src/content/interviews/   面试复盘
src/content/companies/    公司记录
src/content/questions/    面试问题
src/content/knowledge/    扩展知识库
```

每篇内容使用 Markdown frontmatter 描述标题、摘要、标签、日期、状态和是否可分享。页面会在构建时自动读取这些字段并生成列表页、详情页和搜索数据。

## 公司关联

公司详情页会自动聚合关联内容：

- 面试复盘：通过 `company: 公司名` 关联。
- 问题库：通过 `companies: [公司名]` 关联。
- 知识库：通过 `companies: [公司名]` 关联。

示例：

```md
---
title: 有没有 Agent 和大模型使用经验？
category: AI
source: 晓数绿景初面
companies: [晓数绿景]
---
```

## 推荐工作流

1. 面试结束后，把原始面试记录发给 Codex。
2. Codex 拆解为面试复盘、公司记录、问题库和知识点。
3. 内容以 Markdown 文件提交到 GitHub。
4. Hermes 监听 GitHub 更新并自动部署。
5. 手机和电脑访问同一个静态网站查看复盘与知识库。


## 网页录入分析后台

隐藏入口：`/interview/admin/ingest/`。这个页面只负责录入、预览和编辑草稿；真正的模型调用和 GitHub 提交由独立后端完成，避免把 API key 或 GitHub token 放到浏览器里。

后端启动命令：

```bash
npm run ingest:server
```

必需环境变量：

```text
ADMIN_TOKEN=后台管理口令
OPENAI_API_KEY=模型服务 API Key
AI_MODEL=模型名称
GITHUB_TOKEN=有 repo/workflow 权限的 GitHub Token
GITHUB_REPOSITORY=msy02096/interview
GITHUB_BRANCH=main
```

可选环境变量：

```text
PORT=8787
OPENAI_BASE_URL=https://api.openai.com/v1
CORS_ORIGIN=https://msy02096.github.io
PUBLIC_INGEST_API_BASE=https://你的后端域名
```

录入流程：

1. 打开隐藏入口，填写 API 地址和管理口令。
2. 粘贴转写文本或上传 `.txt` / `.md` / `.docx` 文档。
3. 填写公司、岗位、轮次、日期、发言人映射等基础信息。
4. 点击“分析”，得到结构化草稿 JSON。
5. 编辑确认后点击“确认入库”，后端会生成 Markdown 并提交到 GitHub `main`。
6. GitHub Pages workflow 自动部署。
## Hermes 部署建议

1. GitHub 仓库设为 private。
2. Hermes 使用 GitHub webhook 触发部署。
3. Hermes 拉取代码后执行：

```bash
npm ci
npm run build
```

4. 将 `dist/` 发布到 Web 服务目录。

后续可以增加访问密码、Pagefind 静态搜索、公开分享页和 Supabase 数据同步。