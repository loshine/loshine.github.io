---
title: 开始使用 Flutter
date: 2018-07-03 15:50:00
category: [技术]
tags: [Flutter]
toc: true
description: Flutter 是 Google 出品的一项基于 Dart 的跨平台应用开发工具，理论上支持还在孵化中的 Fuchsia 和目前占据移动端大头的 Android, iOS 系统。它拥有相较于 React Native 更好的性能，Dart 的语法也很容易学习，是一门十分值得掌握的技术。
---

Flutter 是 Google 出品的一项基于 Dart 的跨平台应用开发工具，理论上支持还在孵化中的 Fuchsia 和目前占据移动端大头的 Android, iOS 系统。它拥有相较于 React Native 更好的性能，Dart 的语法也很容易学习，是一门十分值得掌握的技术。

# Get started

以下假设读者使用 Mac，并已经安装并配置好了 Android sdk, Android Studio 等工具。

## 安装前的准备

由于众所周知的原因，Google 的大部分网站和资源都在墙外，所以我们需要改一些环境变量来让 flutter 从一些值得信任的镜像下载工具。

在`.bashrc`或`.zshrc`中添加如下内容：

```bash
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

## 安装 SDK

### 1. clone sdk

把 sdk 克隆到指定目录下

```bash
git clone -b master https://github.com/flutter/flutter.git
```

### 2. 添加环境变量

在`.bashrc`或`.zshrc`中添加如下内容：

```bash
export PATH=[PATH_TO_FLUTTER_GIT_DIRECTORY]/flutter/bin:$PATH # 将 flutter 加入环境变量
```

### 3. Run flutter doctor

检查工具

```bash
flutter doctor
```

根据输出内容安装缺失的工具即可。

## 安装插件

### Android Studio

安装 dart 和 flutter 插件。

### VS Code

安装 dart 和 flutter 插件。

## 创建工程

直接使用 IDE 就可以创建工程然后运行了。

# 总结

多的不说了，学起来吧。