---
title: Scala Value Class
date: 2018-06-23 16:41:00
category: [技术]
tags: [Scala]
toc: true
description: 值类型(Value class)是一种通过继承 AnyVal 类来避免运行时对象分配的新机制。
---

值类型(Value class)是一种通过继承 AnyVal 类来避免运行时对象分配的新机制。

# 值类型

## 创建

以下是一个最简单的值类型

```scala
class Wrapper(val underlying: Int) extends AnyVal
```

它仅有一个被用作运行时底层表示的公有`val`参数。在编译期，其类型为 Wrapper，但在运行时，它被表示为一个 Int。

值类型可以带有`def`定义，但不能再定义额外的`val`、`var`，以及内嵌的`trait`、`class`或`object`

## 继承

值类型只能继承普通 trait，但其自身不能再被继承。

> 普通 trait就是继承自 Any 的、只有`def`成员，且不作任何初始化工作的 trait

继承自某个普通 trait 的值类型同时继承了该 trait 的方法，但是（调用这些方法）会带来一定的对象分配开销。

```scala
trait Printable extends Any {
  def print(): Unit = println(this)
}

class Wrapper(val underlying: Int) extends AnyVal with Printable

val w = new Wrapper(3)
w.print() // 这里实际上会生成一个Wrapper类的实例
```

# 用例

## 扩展方法

值类型可以和隐式类配合用来为类添加扩展方法，并且避免额外的内存开销。

```scala
implicit class RichInt(val self: Int) extends AnyVal {
  def toHexString: String = java.lang.Integer.toHexString(self)
}
```

在运行时，表达式`3.toHexString`被优化并等价于静态对象的方法调用`RichInt$.MODULE$.extension$toHexString(3)`，而不是创建一个新实例对象，再调用其方法。

## 确保类型安全

可以额外定义一个值类型用来保证类型安全。

```scala
class Meter(val value: Double) extends AnyVal {
  def +(m: Meter): Meter = new Meter(value + m.value)
}

val x = new Meter(3.4)
val y = new Meter(4.3)
val z = x + y
```

> 实际上不会分配任何 Meter 实例，而是在运行时仅使用原始双精浮点数(double) 。

# 总结

值类型用于减少内存分配消耗，我们在编程中可以灵活使用提高程序性能。