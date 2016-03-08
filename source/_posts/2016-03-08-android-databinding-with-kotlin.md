---
title: Kotlin与DataBinding协作
date: 2016-03-08 21:23:10
category: [技术]
tags: [Kotlin,Android]
toc: true
description: DataBinding 是 Google 爹地为我们这群苦逼的 Android 开发者推出的 MVVM 框架。本文解决 Kotlin 和 DataBindin 共用时报错的问题。
---
DataBinding 是 Google 爹地为我们这群苦逼的 Android 开发者推出的 MVVM 框架。本文解决 Kotlin 和 DataBindin 共用时报错的问题。

# 如下修改即可

app 的 build.gradle 中添加如下部分

```groovy
dependencies {
	// ...
	kapt 'com.android.databinding:compiler:1.0-rc5'//改为对应版本
}
kapt {
	generateStubs = true
}
```