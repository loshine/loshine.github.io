---
title: Yarn 下一代 Node 包管理器
date: 2016-10-22 01:22:47
category: [技术]
tags: [Node]
toc: true
---

最近前端圈子里最热的话题应该就是 Facebook 新出的包管理器—— Yarn 了，它解决了前端工程师构建项目中许多痛点，类比到 Java 圈子大概就是从 Maven 切换到 Gradle 的爽快吧。

<!--more-->

截止到10月22日，Yarn 发布短短十多天就已经达到了让人惊叹的 star 数量

![](https://i.niupic.com/images/2016/12/13/XL88r8.jpg)

这成绩简直吓死人了，那么接下来就稍微介绍一下它为什么好，为什么这么多人想要用它替换掉 NPM，以及我们该如何使用它吧。

# 简介

简介还用怎么说呢，你只需要知道它是用来替换 NPM 的就可以了。

# 特性

## 本地缓存

类似 **Gradle**，**Yarn** 会把使用过的模块在本地缓存一份，如果下次还要用到相同版本的模块，那么将会直接使用本地的而不是访问网络重新获取一份。

这个特性碾压 **NPM** 了啊有木有！我之前使用 **NPM** 的时候一直想吐槽这个来着，如果全局安装项目就会依赖环境，如果不全局安装那么每个项目都要重新下载一次包，浪费时间和资源。

## 安全性

安装之前会验证文件完整性，所以不用担心安装到损坏的文件啦

## 可靠

**Facebook** 都把它用在生产环境中了，**Google** 也要参与维护了，**Github** 上那么多的 star，绝壁可靠了吧

## 更优雅的命令

命令相比起 **NPM** 更容易理解，默认的设置足够贴心，感觉要起飞了

# 使用

说了这么多也心动了，那么我们就开始安装 **Yarn** 吧。

## 安装

> 笔者使用的是 Mac，所以只会介绍 Mac 的安装方法，其它方式请参照 [Installation Guide](https://yarnpkg.com/en/docs/install)

Mac 上有三种安装方式，推荐使用 **Homebrew** 安装。

### Homebrew安装

输入以下命令即可

```bash
brew update
brew install yarn
```

如果使用 **NVM** 的话，可以删除依赖中的 node：

```bash
brew uninstall node
```

### 安装脚本

下载官网提供的安装脚本来安装

```bash
curl -o- -L https://yarnpkg.com/install.sh | bash
```

### npm 安装

这是最不推荐的一个方式

```bash
npm install --global yarn
```

### 验证安装成功

选择以上三个方法之中的任意一种安装成功之后，运行如下命令检测是否安装成功

```bash
yarn --version
```

如果提示没有命令，去修改`.zshrc`（或`.profile`, `.bashrc`）添加如下语句

```bash
export PATH="$PATH:$HOME/.yarn/bin"
```

## 常用命令

安装完毕了，那么就要使用它了，下面是一些常用命令和 **NPM** 对应命令的对照表

| 作用         | NPM 命令                    | Yarn 命令             |
| ---------- | ------------------------- | ------------------- |
| 安装         | npm install               | yarn                |
| 安装某个包      | npm install xxx —save     | yarn add xxx        |
| 删除某个包      | npm uninstall xxx —save   | yarn remove xxx     |
| 开发模式下安装某个包 | npm install xxx —save-dev | yarn add xxx —dev   |
| 更新         | npm update —save          | yarn upgrade        |
| 全局安装       | npm install xxx --global  | yarn global add xxx |

还有一些包发布者才会用到的命令就不作详细讲解了

# 总结

yarn 目前来说已经可以做到替换 npm 了，赶紧使用它换取更高的工作效率吧，Enjoy it~