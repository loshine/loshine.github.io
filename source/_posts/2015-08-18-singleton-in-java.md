---
title: Java中的单例设计模式
date: 2015-08-18 11:19:30
category: [技术]
tags: [设计模式, Java]
toc: true
description: 单例模式确保某个类只有一个实例，而且自行实例化并向整个系统提供这个实例。
---
> 单例模式确保某个类只有一个实例，而且自行实例化并向整个系统提供这个实例。

# 特点

单例模式有以下特点：

1. 单例类只能有一个实例
2. 单例类必须自己创建自己的唯一实例
3. 单例类必须给所有其他对象提供这一实例

# 实现

## 饿汉式

饿汉式在类创建的同时就已经创建好一个静态的对象供系统使用，以后不再改变，所以天生是线程安全的。

```java
public class Singleton {

    // 饿汉式，开始就建立一个对象
    private static final Singleton single = new Singleton();
    
    // 将构造函数私有，禁止在其它类中创建对象
    private Singleton() {}
    
    public static Singleton getInstance() {
        return single;
    }
}
```

## 懒汉式

懒汉式则是在调用获取实例对象的方法时检查，若没有对象则创建对象，如果单例对象已经存在则不创建对象直接返回已存在的对象。

```java
public class Singleton {
    // 懒汉式，刚开始不创建对象
    private static Singleton single=null;

    // 将构造函数私有，禁止在其它类中创建对象
    private Singleton() {}
    
    // 静态工厂方法
    public static Singleton getInstance() {
         if (single == null) {
             single = new Singleton();
         }
        return single;  
    }
}
```

这种懒汉式实现是**非线程安全**的，并发环境下很可能出现多个Singleton实例。若要保证线程安全，我们可以使用如下几种方式

* 同步`getInstance()`方法

```java
public static synchronized Singleton getInstance() {
    if (single == null) {
        single = new Singleton();
    }    
    return single;
}
```

* 代码块加锁和双重检查

```java
public static Singleton getInstance() {
    if (singleton == null) {
        synchronized (Singleton.class) {
            if (singleton == null) {
            singleton = new Singleton();
            }
        }
    }
    return singleton;
}
```

* 静态内部类

```java
public class Singleton {
    
    // 用于封装单例实例的内部类
    private static class LazyHolder {
        private static final Singleton INSTANCE = new Singleton();
    }
    
    // 私有构造
    private Singleton() {}
    
    // 获取单例实例的方法
    public static final Singleton getInstance() {
        return LazyHolder.INSTANCE;
    }    
}
```

其中第三种实现方式最好，避免了加锁的效率问题。但实际开发中饿汉式使用较多。
