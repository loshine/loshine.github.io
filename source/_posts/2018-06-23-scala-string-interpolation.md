---
title: Scala 字符串插值器
date: 2018-06-23 10:51:00
category: [技术]
tags: [Scala]
toc: true
description: Scala 提供了三种创新的字符串插值方法：`s`,`f`和`raw`，使用他们我们可以方便快捷的组合字符串。
---

Scala 提供了三种创新的字符串插值方法：`s`,`f`和`raw`，使用他们我们可以方便快捷的组合字符串。

<!-- more -->

# 用法

## s 字符串插值器

在任何字符串前加上`s`，就可以直接在串中使用变量了，在生成字符串的时候会隐式调用其`toString`方法。

```scala
class Complex(val real: Double, val imaginary: Double) {

  override def toString: String = {
    s"Complex(real=$real, imaginary=$imaginary)"
  }
}

val complex = new Complex(23, -1.3)

println(s"$complex")
```

字符串插值器也可以处理任意的表达式:

```scala
println(s"1+1=${1 + 1}")
```

## f 插值器

在任何字符串字面前加上`f`，就可以生成简单的格式化串，功能相似于其他语言中的`printf`函数。

> 类似于 Java 中的`String.format`

```scala
val height = 1.9d
val name = "James"
println(f"$name%s is $height%.2f meters tall") //James is 1.90 meters tall
```

## raw 插值器

`raw`插值器可以保证其内的字符不被编码，如`\n`不会被处理为回车

```scala
println(s"a\nb")  // a回车b
println(raw"a\nb")  // a\nb
```

# 高级用法

在 worksheet 中输入如下代码运行

```scala
id"string content"
```

发现编译器提示：`Error:(1, 68) value id is not a member of StringContext`

即：该格式会隐式调用 StringContext 的与前缀插值器同名的方法

所以我们自定义插值器只需要这样就可以了：

```scala
implicit class JsonHelper(val sc: StringContext) extends AnyVal {
  def json(args: Any*): String = {
    val strings = sc.parts.iterator
    val expressions = args.iterator
    var buf = new StringBuffer(strings.next)
    while (strings.hasNext) {
      buf append expressions.next
      buf append strings.next
    }
    parseJson(buf)
  }
}
```

# 结语

字符串插值器可以帮助我们快速格式化字符串，`s`会隐式调用其`toString`方法，`f`需要格式模板字符串，`raw`不会编码字符，我们只需要按需使用即可。