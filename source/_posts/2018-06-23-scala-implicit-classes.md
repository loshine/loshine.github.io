---
title: Scala 隐式类
date: 2018-06-23 15:39:00
category: [技术]
tags: [Scala]
toc: true
description: Scala 2.10 引入了一种叫做隐式类的新特性。隐式类指的是用`implicit`关键字修饰的类。在对应的作用域内，带有这个关键字的类的主构造函数可用于隐式转换。
---

Scala 2.10 引入了一种叫做隐式类的新特性。隐式类指的是用`implicit`关键字修饰的类。在对应的作用域内，带有这个关键字的类的主构造函数可用于隐式转换。

<!-- more -->

# 用法

## 创建隐式类

创建隐式类时，只需要在对应的类前加上`implicit`关键字:

```scala
object Helpers {

  implicit class IntWithTimes(x: Int) {
    def times[A](f: => A): Unit = {
      def loop(current: Int): Unit =
        if (current > 0) {
          f
          loop(current - 1)
        }

      loop(x)
    }
  }

}
```

## 使用隐式类

使用隐式类时，类名必须在当前作用域内可见且无歧义，这一要求与隐式值等其他隐式类型转换方式类似。

要使用上述创建好的隐式类，只需将其导入作用域内并调用`times`方法。

```scala
import Helpers._

5 times println("hello")
```

## 限制条件

### 1. 只能在别的 trait/类/对象内部定义

```scala
object Helpers {

  implicit class RichInt(x: Int) // 正确！
}

implicit class RichDouble(x: Double) // 错误！
```

### 2. 构造函数只能携带一个非隐式参数

```scala
implicit class RichDate(date: java.util.Date) // 正确！
implicit class Indexer[T](collecton: Seq[T], index: Int) // 错误！
implicit class Indexer[T](collecton: Seq[T])(implicit index: Index) // 正确！
```

> 虽然我们可以创建带有多个非隐式参数的隐式类，但这些类无法用于隐式转换。

### 3. 在同一作用域内，不能有任何方法、成员或对象与隐式类同名

```scala
object Bar
implicit class Bar(x: Int) // 错误！

val x = 5
implicit class x(y: Int) // 错误！

implicit case class Baz(x: Int) // 错误！
```

# 总结

隐式类可以用于隐式转换，创建隐式类应当注意必须在 trait/类/对象的内部定义，并且参数只能有一个。