---
title: Scala 并发编程
date: 2018-06-24 12:00:00
category: [技术]
tags: [Scala]
toc: true
---

并发编程是开发中及其重要的部分，本文用于说明 scala 中的并发编程。

# Future

所谓 Future，是一种用于指代某个尚未就绪的值的对象。

Future 有两个状态：

1. **待就位**：等待结果
2. **已就位**：已经结束，可能接收到值或者发生异常

其中**已就位**也有两种情况：成功就位或发生异常。

Future 的一个重要属性在于它*只能被赋值一次*。一旦给定了某个值或某个异常，Future 对象就变成了不可变对象——无法再被改写。

## 创建 Future

最简单的创建 Future 的方法就是直接使用`Future.apply()`方法。

假设我们使用某些流行的社交网络的假定 API 获取某个用户的朋友列表，我们将打开一个新对话(session)，然后发送一个请求来获取某个特定用户的好友列表。

```scala
import scala.concurrent._
import ExecutionContext.Implicits.global // 必须导入，否则会报错

val session = socialNetwork.createSessionFor("user", credentials)
val f: Future[List[Friend]] = Future {
  session.getFriends()
}
```

## 监听结果

注册监听`onComplete`方法可以在 Future 接收到结果的时候对其进行处理。

onComplete 会传递一个`Try[T]`类型的值，它有2个子类：`Success`或`Failure`，成功时会回传`Success`，失败时就是`Failure`。

我们可以通过模式匹配来处理：

```scala
f onComplete {
  case Success(list) => for (v <- list) println(v)
  case Failure(e) => println("An error has occured: " + e.getMessage)
}
```

## 函数组合

集合可用的`map`,`flatMap`等函数组合也可以使用在 Future 上。

这些组合操作方法可以帮助我们方便的转换 Future

```scala
val f = Future { 1 }.map(v => s"$v").flatMap(v => Future { s"value = $v" })
```

## for 解构

`for`关键词也可以用于解构 Future，并且方便的转换其值。

```scala
val future = for {
  v1 <- Future{ 1 }
  v2 <- Future{ 2 }
  if v1 < v2
} yield "v1 < v2"

future.onComplete {
  case Success(value) => println(value)
  case Failure(exception) => println(exception.getMessage)
}
```

## recover

`recover`通常和其它函数组合操作符一起使用，以避免发生异常之后直接结束。

```scala
val purchase: Future[Int] = rateQuote map {
  quote => connection.buy(amount, quote)
} recover {
  case QuoteChangedException() => 0
}
```

此时如果`map`的内容发生异常，会直接走到`recover`里检查异常并返回值。

# Promise

Promise 允许你在 Future 里放入一个值，不过只能做一次，Future 一旦完成，就不能更改了。

可以使用`success`方法传入成功的值，或者`failure`方法传入错误。

也可以使用`complete`方法传入`Try[T]`的子类，也就是`Success[T]`或`Failure`

```scala
val promise = Promise[String]()

//  promise.success("sucess")
promise.failure(new Exception("haha"))

try {
  val result = Await.result(promise.future, 3 second)
  println(result)
} catch {
  case e: Exception => println(s"Exception($e) happened.")
}
```

# 异步转同步

## Await

Future 的`onComplete`方法监听是异步的，我们也可以使用 Await 来阻塞当前线程获取 Future 的值

> Await 会阻塞当前线程直到获取到值或者超时。

```scala
def a = Future { Thread.sleep(2000); 100 }
def b = Future { Thread.sleep(2000); throw new NullPointerException }

Await.ready(a, Duration.Inf) // Success(100)
Await.ready(b, Duration.Inf) // Failure(java.lang.NullPointerException)

Await.result(a, Duration.Inf) // 100
Await.result(b, Duration.Inf) // crash with java.lang.NullPointerException
```

## async/await

[scala-async](https://github.com/scala/scala-async)提供了类似 ES7 中提供的`async/await`，使用它我们可以用同步非阻塞的方式写出异步代码

我们只需要用`async`代替`Future.apply`，然后用`await`获取结果即可。

```scala
val future = async {                                     
  val f1 = async { true }                                 
  val x = 1                                               
  def inc(t: Int) = t + x                                 
  val t = 0                                               
  val f2 = async { 42 }                                   
  if (await(f1)) await(f2) else { val z = 1; inc(t + z) }
}
```

# 总结

Scala 中将异步操作抽象成 Future，通过其回调可以进行异步操作。使用[scala-async](https://github.com/scala/scala-async)可以将异步转成类似同步的写法，更易于阅读。