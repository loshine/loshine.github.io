---
title: Android开发最佳实践——2.使用Kotlin开发Android
date: 2016-09-06 00:30:21
category: [技术]
tags: [Android]
toc: true
---

# 引

Android 的官方开发语言是 Java，那为什么我们不继续使用 Java 开发 Android 呢？可能有人会说出很多理由，如：

* 没有函数式的支持
* Android 上只能用到 Java 6
* 令人烦躁的 NullPointException
* ……

但实际上我觉得让我们选择 Kotlin 而不是 Java 的原因只有一个：*Kotlin 拥有更高的生产力*。

下面我就介绍一下 Kotlin 这个语言和它的好处，以及如何使用它编写 Android 程序。

# What

[Kotlin](https://kotlinlang.org/) 是公司 [JetBrains](https://www.jetbrains.com/) 研发的语言（他们家代表产品有 IntellJ Idea、Android Studio 等）。他们的网站上，他们是这样描述 Kotlin 的：

> 为 JVM、Android 和浏览器而生的静态编程语言。

相比起其它 JVM 上的语言，它拥有无数的优点：

* 为 Java 作扩展而不是重写 Java，所以它的方法数相比 Groovy 和 Scala 少了很多
* 和 Java 可以无缝调用，完美利用 JVM 生态
* 面向对象和函数式的结合，支持多种范式
* 现代化的语法，解决了 Java 无数痛点（如 NullPointException）
* ……

