---
title: Android开发最佳实践——2.使用Kotlin开发Android
date: 2016-09-06 00:30:21
category: [技术]
tags: [Android]
toc: true
description: Android 的官方开发语言是 Java，但 Java 缺少了很多现代编程语言的特性，本文介绍了 Kotlin 的一些基本用法。
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

# Kotlin 习语

下面简单介绍一些 Kotlin 的习语，看看 Kotlin 是如何简化我们的编码的。

## 数据类

Kotlin 中创建数据类非常简单，我们只需要如下编写代码即可：

```kotlin
data class Customer(val name: String, val email: String)
```

使用了`data class`关键词之后，Kotlin 会自动帮我们生成`getter`(如果属性是使用`var`声明的则还会生成`setter`)、`equals()`、`hashCode()`、`toString()`、`copy()`等常用方法。

而在 Java 中写一个 JavaBean，我们需要一个个声明属性并写出它们对应的`getter`、`setter`以及其它代码，相比之下 Kotlin 的代码量小了一大半。

## Lambda

因为历史原因我们还在使用 Java6 编写 Android 代码，无法使用到 Java8 的新特性之 Lambda 表达式。而使用 Kotlin 的话是天生支持 Lambda 的，可以大大减少代码量。

Java ver:

```java
    mTextView.setOnClickListener(new View.OnClickListener(){
        @Override
        public void onClick(View view) {
            // todo ...
        }
    });
```

Kotlin ver:

```kotlin
    mTextView.setOnClickListener { v -> // todo...}
```

## 默认非空

Kotlin 里声明的类型都是默认非空的，可空的类型必须要在声明类型的时候在类型后面加一个`?`，而 Kotlin 也提供了语法糖来搞定`null`判断

```
Student aStudent

println(aStudent.name)
```

该`aStudent`永远不会为空

而如果是一个可空的 Student

```
Student? bStudent

println(bStudent?.name)
```

因为声明类型的时候添加了一个`?`表示可空，所以`bStudent`是可能为`null`的。但 Kotlin 提供的语法糖在使用的时候`bStudent?.name`不会产生 **NullPointException**。

## 字符串插值

Java 中格式化字符串是这样的:

```java
String.format(Locale.getDefault(), "Name: %s", student.getName());
```

Kotlin 中我们可以这样:

```kotlin
"Name: ${student.name}"
```

## when 表达式

Kotlin 里的 when 表达式非常强大，可以替换掉`if-elseif-else`

```kotlin
when (x) {
    is Foo -> ...
    is Bar -> ...
    else   -> ...
}
```

# 总结

上面讲了一些常用的 Kotlin 特性，还有更多没有写出的如：`不可变集合`,`扩展函数`,`参数默认值`等。

我个人的体验是使用 Kotlin 可以大大减少模版代码，让 Coding 更加愉悦。推荐在没有历史包袱的项目中使用。

但如果是有历史包袱的项目或者项目组成员不愿意去另外学习一门语言的话，那可能就无法享受到 Kotlin 的好处了，大家酌情选择即可。