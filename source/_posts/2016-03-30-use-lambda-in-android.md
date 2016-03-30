---
title: 在Android开发中使用Lambda表达式
date: 2016-03-30 23:33:11
category: [技术]
tags: [Android,Java]
toc: true
description: 由于三体人对我们的科技封锁，我们无法在 Android 开发中启用 Java 1.8 的重要特性——Lambda 表达式。但现在我们可以通过一些工具启用它，然后使用 Lambda 表达式替换没有什么实际意义的单方法匿名内部类。
---

> 由于三体人对我们的科技封锁，我们无法在 Android 开发中启用 Java 1.8 的重要特性——Lambda 表达式。但现在我们可以通过一些工具启用它，然后使用 Lambda 表达式替换没有什么实际意义的单方法匿名内部类。

# Lambda表达式

可能有些人还不太清楚到底什么是 Lambda 表达式，这里先对 Lambda 表达式进行一个简单的介绍。

Lambda 表达式是**函数式编程语言**的特性，它简单的说就是一个**匿名函数**。

我们先看一个 Groovy 的例子：

```groovy
[1, 2, 3, 4, 5].asList().forEach { x -> println x }
```

在这个例子中，我们使用`foreach`来遍历一个`List`并打印每一个值。我们传入了一个 Lambda 表达式：`{ x -> println x }`，这个表达式就是我们对每一个值进行的操作，在本例中就是打印它们。

在这里 Lambda 表达式是一个映射函数，`foreach`接受了它作为参数，然后对`List`中的每一个值进行遍历。

在函数式编程语言中，函数是**一等公民**（first class）。它们也可以作为变量或者参数被传递而且它们也是一个类。

但在 Java 中函数并不是一等公民，如果我们需要传递一个方法，必须要有一个对象包含这个方法，然后把这个对象传递过去。

所以我们经常会见到类似这样的代码：

```java
textView.setOnClickListener(new View.OnClickListener() {
	@Override
	public void onClick(View view) {
		// do what you want...
	}
});
```

但是实际上，我们需要的只是`onClick`这个方法里面的内容，其它的部分（new OnClickListener）实在是没有什么实际的意义，只是一个必须的语法而已。

所以 Java 1.8 也引入了部分函数式编程的特性——Lambda 表达式。

如果使用 Lambda 表达式，上面那个例子可以被简化为这样

```java
textView.setOnClickListener(v -> {
	// do what you want...
});
```

如果只有一行代码我们还可以省略大括号

```java
textView.setOnClickListener(v -> doSomething());
```

当啷啷~ 是不是省略了很多代码，有没有很爽的感觉。

有了 Lambda 表达式，从此我们的代码可以清爽简洁，而且看起来也很好理解：箭头的左边是形参，右边是函数体，整个 Lambda 表达式就是一个函数（就是数学中的函数）。

更多 Lambda 表达式的信息可以查看[《Java 8新特性：lambda表达式》——廖雪峰](http://www.liaoxuefeng.com/article/001411306573093ce6ebcdd67624db98acedb2a905c8ea4000)。

# 如何使用

安利了这么多 Lambda 表达式的优点，但由于众所周知的某些原因，Android 中的 Java 版本被限定在了 1.6 以下，所以也就没办法使用那么好的 Lambda 表达式了。

但 Lambda 表达式这么好，你不让我用我就不用了么？我偏要用！

好的，有以下两种方式都可以为我们开启 Lambda 表达式，我们只需要任选其一就可以了。

## RetroLambda

RetroLambda 的 Gradle 插件让我们可以在 Android 中使用 Lambda 表达式，那么我们看看如何使用它吧。

### Project

我们需要在项目目录下的`build.gradle`中加入它的`classpath`

```gradle
buildscript {
    repositories {
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:2.1.0-alpha4'
     classpath 'me.tatarka:gradle-retrolambda:3.2.5'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}
```

在`dependencies`中加入`classpath 'me.tatarka:gradle-retrolambda:3.2.5'`

### app module

编辑`build.gradle`启用插件，并把 Java 语法调整到 1.8

1. 在顶部启用插件
```gradle
apply plugin: 'me.tatarka.retrolambda'
```
2. 在`android`中加入以下代码段启用 1.8 的语法
```gradle
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
```

Enjoy it !~

## jack

jack 是 Java Android Compile Kit 的缩写，它是 Google 为 Android 推出的一个**编译工具包**，它的原理在这里就不详述了。它有一个特点就是可以使用 Lambda 表达式，而且配置十分简单。

### 准备

使用 jack 我们必须要把`buildTools`升级到**24以上**，我已经升级到了`24 RC`。

### 使用

编辑 app 模块中的`build.gradle`，在`defaultConfig`中加一行`        useJack true`，然后在`android`中添加如下一段代码

```gradle
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
```

然后就好了，是不是非常简单呢~

# 总结

在 Java 1.8 中的 Lambda 表达式实际上只是一个语法糖，它可以帮助我们简化代码，并且表述地更佳清晰。但 Java 目前来说并不是一门有函数式特性的编程语言，而且短期内不会加入函数式特性。如果你想使用一门拥有函数式特性的语言来写 Android Application 的话，可以考虑一下 Kotlin。