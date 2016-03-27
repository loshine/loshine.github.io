---
title: 博客迁移到 Hexo
date: 2016-03-22 17:09:00
category: [技术]
tags: [Hexo,github,github-pages]
toc: true
description: Github Pages 服务的 Jekyll 升级了，干脆我就趁着这次机会把博客迁移到 Hexo 好了。
---
> Github Pages 服务的 Jekyll 升级了，干脆我就趁着这次机会把博客迁移到 Hexo 好了。
>
> Hexo 是 Node.js 的一个静态博客系统，相比起 Ruby 实现的 Jekyll，它生成的速度更快而且更加现代化。当然最重要的就是对前端工程师更友好啦，毕竟是用 javascript 写的嘛
> 
> 使用 Hexo 和 Jekyll 的不同点在于 Hexo 是生成静态文件后上传到 Github Pages 服务上，而 Jekyll 是上传源码然后在服务器上生成静态文件。


# 如何使用Hexo

## 安装Hexo

1. 安装 Node.js
2. 安装 Hexo
	```bash
	npm install hexo-cli -g
	```

## 生成静态博客项目

只需要输入以下命令就会生成一个静态博客项目

```bash
hexo init blog
cd blog
npm install
```

然后等待 npm 安装完成

## 运行博客

输入以下命令，然后就可以在浏览器地址栏中输入`http://localhost:4000/`打开博客

```bash
hexo server
```

## 编写文章

在`source/_posts`文件夹下放入对应格式的 markdown 文件，hexo 就会根据模板将其渲染为对应格式的 html 静态文件。

# 从Jekyll迁移

## 迁移文章

把`_posts`文件夹内的所有文件复制到`source/_posts`文件夹，并在`_config.yml`中修改`new_post_name`参数。

```yaml
new_post_name: :year-:month-:day-:title.md
```

## 文章格式修改

Jekyll 特定的`Front-matter`需要删掉并且替换为对应的 Hexo 的`Front-matter`，并且文章的 markdown 格式可能需要修改

# 部署到 Github Pages

和 Jekyll 类似，我们还是需要一个`username.github.io`的项目。但和 Jekyll 不同的是我们需要把生成的静态文件部署上去而不是将 markdown 文件部署上去。

在本地输入

```bash
hexo g
# 或者
hexo generate
```

即可在本地生成静态页面，然后打开`config.yml`，修改为自己的项目信息就可以了

```yaml
deploy:
  type: git
  repo: git@github.com:loshine/loshine.github.io.git
  branch: master
```

# 高级

## 设置

`config.yml`文件有许多的可配置选项，可以参照[这里](https://hexo.io/zh-cn/docs/configuration.html)设置

## 主题

默认情况下使用的是 landscape 主题，我们也可以在[这里](https://hexo.io/themes/)挑选主题

# 总结

其实博客迁移完毕已经挺久了，我终于在今天（2016-03-22）想起来把这个过程记录下来了，也可以给其他需要迁移的人一个参考吧。