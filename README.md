# 饭窝

Loshine 的个人博客。Astro 静态生成，Markdown 内容集合，Shiki 代码高亮，Pagefind 中文全文搜索，giscus 评论（GitHub Discussions）。

## 主题

基于 [Astro Cactus](https://github.com/chrismwilliams/astro-cactus) 8.3.0（`728f1f4`）的布局、仙人掌标识与配色做中文适配：窄栏、日期文章列表、明暗切换，正文使用中文系统字体。沿用当前 Astro 内容层和原生 CSS，不引入示例文章、Notes、Tailwind 或主题的其他可选服务。主题 MIT 许可保存在 `public/astro-cactus-LICENSE.txt`，随静态站点发布。

主题默认跟随系统，手动切换后在本地浏览器保存选择；禁用本地存储时仍可切换当前页面。

## 本地预览

需要 Node.js 22.23.4+（建议 Node.js 24 LTS）和 pnpm 10.15.0。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test
pnpm preview --host 127.0.0.1
```

打开终端输出的本地地址。`pnpm build` 会生成搜索索引，预览包含完整搜索功能。修改后重新构建并刷新预览页面。

开发页面可用 `pnpm dev` 热更新；Pagefind 只在构建后生成，因此搜索验收请使用 `pnpm preview`。

## 内容与路由

- 文章继续保存在 `source/_posts/*.md`，图片放在 `public/assets/`，关于页面位于 `source/about/index.md`。
- 文章 URL 使用 front matter 的 `date` 和文件名去掉日期前缀后的部分：`/年/月/日/标题/`。日期按 UTC 日历值读取，避免构建机器时区改变地址。
- 保留 Hexo 的 `category` / `categories`、`tags`、`toc`、`comments` 字段以及大小写敏感的标签地址和标题锚点。
- giscus 使用 `loshine/loshine.github.io` 的 Announcements 分类。按完整文章路径（含开头和结尾 `/`）严格匹配讨论，不受标题或预览域名变化影响；讨论反向链接固定为正式站点地址。点击加载后才访问 giscus，评论主题跟随博客明暗切换。
- 启用前需安装 giscus GitHub App，安装范围仅选择博客仓库，并保持 Discussions 开启。仓库 ID 与分类 ID 配置在 `src/components/Comments.astro`；重新创建分类后需更新 ID。
- 本次只更换评论组件，旧 Disqus 数据未删除，也不会自动出现在 giscus 中。
- 旧图床 URL 保留，迁移没有下载或重新托管外部图片。

新文章示例：

```yaml
---
title: 我的技术笔记
date: 2026-10-28 12:00:00
category: [技术]
tags: [Kotlin]
description: 这篇文章的简要介绍。
toc: true
---
```

## 分支与发布

`source` 保存源码，`main` 保存已发布的静态网站。本地构建和预览不会自动发布；确认效果后再推送静态产物。不要将源码直接合并到 `main`。

确认预览后，发布对象是 `pnpm build` 生成的 `dist/` 内容；需使用独立的 `main` checkout 同步产物并提交发布，保留其 Git 历史。GitHub Pages 若仍使用分支发布，来源应为 `main` 的根目录。`public/.nojekyll` 会随产物发布，避免 Jekyll 忽略 `_astro` 资源。

## 兼容性检查

`tests/fixtures/legacy-site.json` 从迁移前 `main` 提交 `2854fcd14028a29b8808a973e425bd6c16114701` 的已发布 HTML 提取，记录 129 个页面地址、52 篇文章的标题锚点及评论标识。`pnpm test` 在构建后检查这些地址、锚点、giscus 文章路径映射、站内导航和搜索资源。原 Disqus 标识保留在历史基线中，方便未来迁移旧评论。

移除了 Hexo / Icarus 的配置、兼容补丁与依赖；正文只修复了 RIME 文章残留的模板代码围栏，关于页面补齐标准 front matter 并移除图标字体依赖。
