---
title: 你好，React Native
date: 2018-03-09 16:05:00
category: [技术]
tags: [react native]
toc: true
description: React Native 现在依然是最成熟且最🔥的跨平台应用解决方案，那么我先来个 Hello world 吧。
---

React Native 现在依然是最成熟且最🔥的跨平台应用解决方案，那么我先来个 Hello world 吧。

<!-- more -->

> 以下所有教程都是基于 macOS，其它系统环境请参考[官方文档](https://facebook.github.io/react-native/docs/getting-started.html)。

# 安装

## 安装 🍺 Homebrew

Homebrew 是一个 Mac 下的二进制软件包管理工具，安装参考[官网](https://brew.sh/)即可。

## 安装 nvm

nvm 是一个 node.js 的版本管理工具，我们可以参考[文档](https://github.com/creationix/nvm)安装。

## 安装 node.js

安装完毕 nvm 之后，就可以输入命令

```bash
nvm ls-remote
```

检查所有 node.js 的版本了，然后在里面选择一个版本号安装即可

```bash
nvm install version_code
```

## 安装 IDE

如果想开发 iOS 应用则安装 Xcode，Android 则安装 Android Studio。

## 开发工具推荐

建议使用 [Visual Studio Code](https://code.visualstudio.com/)，安装 React Native Tools 插件。

# Hello World

打开终端依次运行下列命令。

```bash
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

在应用运行之后，也可以修改`App.js`中的代码，然后摇晃手机选择 Reload JS 就可以看到代码改动了。