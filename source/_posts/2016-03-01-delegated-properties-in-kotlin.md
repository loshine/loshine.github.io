---
title: Kotlin中的委托属性
date: 2016-03-01 09:29:34
category: [技术]
tags: [Kotlin,Android]
toc: true
description: Kotlin 是 Jetbrain 推出的一门运行在 JVM 上的语言，它结合了面向对象以及函数式语言的特性，超甜的语法糖以及来自知名 IDE 大厂 Jetbrain 的出身让它初一面世就广受瞩目，特别是在 Android 开发社区中。它相比起 Java 拥有了许许多多的优秀特性，并且几乎每一个新特性都对应解决了 Java 开发时的痛苦之处，本篇文章主要讲解 Kotlin 中的委托属性这一特性。
---
> Kotlin 是 Jetbrain 推出的一门运行在 JVM 上的语言，它结合了面向对象以及函数式语言的特性，超甜的语法糖以及来自知名 IDE 大厂 Jetbrain 的出身让它初一面世就广受瞩目，特别是在 Android 开发社区中。它相比起 Java 拥有了许许多多的优秀特性，并且几乎每一个新特性都对应解决了 Java 开发时的痛苦之处，本篇文章主要讲解 Kotlin 中的**委托属性**这一特性。

# 委托属性(Delegated Properties)

我们先看看官网的定义：

> 有一些种类的属性，虽然我们可以在每次需要的时候手动实现它们，但是如果能够把他们之实现一次 并放入一个库同时又能够一直使用它们那会更好。例如：
>
> - 延迟属性（lazy properties）: 数值只在第一次被访问的时候计算。
> - 可控性（observable properties）: 监听器得到关于这个特性变化的通知，
> - 把所有特性储存在一个映射结构中，而不是分开每一条。
>
> 为了支持这些(或者其他)例子，Kotlin 采用 委托属性。

简言之就是*简化手动实现的属性，将其抽象出一个库*。

# 如何使用

## 定义一个委托

Kotlin 中有两种属性：用`var`修饰的可变属性和由`val`修饰的只读属性。由`val`修饰的只读属性使用的委托需要实现`ReadOnlyProperty`，而`var`修饰的可变属性则需要实现`ReadWriteProperty`

在调用被委托的属性的`getter`和`setter`时，对应操作会被委托给`getValue()`以及`setValue()`。

如实现一个最简单的委托`Delegate`：

```kotlin
class Delegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return "$thisRef, thank you for delegating '${property.name}' to me!"
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        println("$value has been assigned to '${property.name} in $thisRef.'")
    }
}
```

## 使用定义好的委托属性

语法为`val/var <property name>: <Type> by <expression>`

```kotlin
class Example {
    var p: String by Delegate()
}
```

`by`后面的是委托表达式，我们调用这个对象并使用属性：

```kotlin
val e = Example()
println(e.p)

e.p = "NEW"
```

打印结果为：

```bash
Example@33a17727, thank you for delegating 'p' to me!
NEW has been assigned to 'p' in Example@33a17727.
```

如上可知，`thisRef`对应的是拥有该被委托属性的对象实例，`property`则是属性，`value`是调用`setter`时的传入值。

# 实例讲解

## lazy 懒加载

Kotlin 标准库自带的**懒加载委托**，在属性第一次被使用时才进行初始化。

函数`lazy()`接受一个 lambda 然后返回一个可以作为委托`Lazy<T>` 实例来实现延迟属性: 第一个调用`getter`执行变量传递到`lazy()`并记录结果, 后来的`getter`调用只会返回记录的结果。

```kotlin
val lazyValue: String by lazy {
    println("computed!")
    "Hello"
}

fun main(args: Array<String>) {
    println(lazyValue)
    println(lazyValue)
}
```

其打印结果：

```bash
computed!   # 第一次使用时先初始化
Hello       # getter
Hello       # 后续都只会调用 getter
```

**懒加载委托**在实际编码中应用十分广泛，比如 Android 中我们可以把很多在`OnCreate`中需要进行的初始化操作使用**懒加载委托**来实现。

## 使用委托操作 SharedPreferences

本例出自《Kotlin for Android Developer》，使用了`when`表达式和委托属性巧妙地使得`SharedPrefences`的读写变得十分简便

```kotlin
class Preference<T>(val context: Context, val name: String, val default: T) : ReadWriteProperty<Any?, T> {

    val prefs by lazy { context.getSharedPreferences("default", Context.MODE_PRIVATE) }

    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return findPreference(name, default)
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        putPreference(name, value)
    }

    private fun <U> findPreference(name: String, default: U): U = with(prefs) {
        val res: Any = when (default) {
            is Long -> getLong(name, default)
            is String -> getString(name, default)
            is Int -> getInt(name, default)
            is Boolean -> getBoolean(name, default)
            is Float -> getFloat(name, default)
            else -> throw IllegalArgumentException("This type can be saved into Preferences")
        }

        res as U
    }

    private fun <U> putPreference(name: String, value: U) = with(prefs.edit()) {
        when (value) {
            is Long -> putLong(name, value)
            is String -> putString(name, value)
            is Int -> putInt(name, value)
            is Boolean -> putBoolean(name, value)
            is Float -> putFloat(name, value)
            else -> throw IllegalArgumentException("This type can be saved into Preferences")
        }.apply()
    }
}
```

在代码中我们可以如下使用

```kotlin
class WhateverActivity : Activity() {
    var aInt: Int by Preference(this, "aInt", 0)

    fun whatever() {
        println(aInt) // 会从 SharedPreference 取这个数据
        aInt = 9 // 会将这个数据写入 SharedPreference
    }
}
```

从此操作`SharedPreferences`变得如此简单 ~

## 简单实现一个 KotterKnife

KotterKnife 是一个 Android 控件依赖注入框架，使用它可以很方便地初始化 Activity、Fragment、View 等的控件。

KotterKnife 的实现原理就是使用了委托属性，下面我就使用委托属性简单实现一个 View 注入功能

### 实现

我们平时是这样初始化 View 的

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val textView = findViewById(R.id.text_view) as TextView
}
```

考虑到通常我们在`onCreate`方法中将其初始化，我们可以用 lazy 委托，在第一次使用该控件的时候才将其初始化，这样可以减少不必要的内存消耗。

```kotlin
val mTextView by lazy {
    findViewById(R.id.text_view) as TextView
}
```

对其抽取简化

```kotlin
@Suppress("UNCHECKED_CAST")
fun <V : View> Activity.bindView(id: Int): Lazy<V> = lazy {
    viewFinder(id) as V
}

private val Activity.viewFinder: Activity.(Int) -> View?
    get() = { findViewById(it) }
```

之后我们就可以在 Activity 中这样注入 View 了

```kotlin
val mTextView by bindView<TextView>(R.id.text_view)
```

如上实现了类似 KotterKnife 的控件注入功能，当然 KotterKnife 中还有更加强大的可选绑定以及数组绑定，本文中我们就不细说了，有兴趣的读者可以阅读 [KotterKnife源码](https://github.com/JakeWharton/kotterknife/blob/master/src%2Fmain%2Fkotlin%2Fbutterknife%2FButterKnife.kt)。

# 小结

本文分析了 Kotlin 中的委托属性，并对其实际应用做了示例分析。委托属性是 Kotlin 语言的一个特性，灵活使用可以解决实际编码中的许多问题，减少大量重复代码，而由于其与属性的`getter`、`setter`直接绑定所以使用起来也十分灵活方便。

总而言之：**这真是极好的**。
