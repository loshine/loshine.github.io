---
title: Java 引用类型
date: 2018-03-09 16:05:00
category: [技术]
tags: [Java]
toc: true
---

Java中提供了4个级别的引用：强引用、软引用、弱引用和虚引用。这次就来探讨一下它们到底都有什么作用。

<!-- more -->

Java 中对于引用的类都在`java.lang.ref`包下

![package](https://ws1.sinaimg.cn/large/006tKfTcgy1fsarhq380hj306e0473yn.jpg)

# 引用类型

## 强引用(Final Reference)

强引用就是最常见的`Object obj = new Object()`这种方式创建出来的对象引用。

只要强引用还存在，垃圾收集器永远不会回收掉被引用的对象。 

其类定义如下：

```java
class FinalReference<T> extends Reference<T> {

    public FinalReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }
}
```

## 软引用(Soft Reference)

软引用是用来引用一些有用但非必须存在的对象的引用类型，通常是为了提高性能的缓存，在内存不足时可以被垃圾回收器回收。

对于软引用关联着的对象，如果内存充足，则垃圾回收器不会回收该对象；如果内存不够了，就会回收这些对象的内存。

## 弱引用(Weak Reference)

用来描述非必须的对象。

被弱引用关联的对象只能生存到下一次垃圾收集发送之前。当垃圾收集器工作时，无论当前内存是否足够，都会回收掉只被弱引用关联的对象。

## 虚引用(Phantom Reference)

虚引用随时会被回收，它只被用来追踪垃圾回收过程。

## 四种类型的分析

1. 强引用除非手动删除引用，否则不会被 GC 回收。
2. 软引用只在可能 OOM 时会被 GC 回收
3. 弱引用一旦触发 GC 就会被回收
4. 虚引用总是被回收
4. 所有引用如果被删除了引用，将会进入引用队列，待 GC 回收