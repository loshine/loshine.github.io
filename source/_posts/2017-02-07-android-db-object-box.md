---
title: 新兴效率数据库——ObjectBox
date: 2017-02-07 17:02:11
category: [技术]
tags: [Android]
toc: true
description: 今天看新闻，发现 GreenDao 的东家 greenrobot 出了一个新的 NoSQL 数据库，greenrobot 称它是目前性能最好且易用的 NoSQL 数据库，且优于其它数据库 5~15 倍的性能。
---

今天看新闻，发现 GreenDao 的东家 greenrobot 出了一个新的 NoSQL 数据库，greenrobot 称它是目前性能最好且易用的 NoSQL 数据库，且优于其它数据库 5~15 倍的性能。

<!-- more -->

# 特性

首先为什么我们需要这个数据库，**greenrobot** 介绍了它的5个特性：

* **快** : 比测试过的其它数据库快 5~15 倍
* **面向对象的 API** : 没有 rows、columns 和 SQL，完全面向对象的 API
* **即时的单元测试** : 因为它是跨平台的，所以可以在桌面运行单元测试
* **简单的线程** : 它返回的对象可以在任何线程运转
* **不需要手动迁移** : 升级是完全自动的，不需要关心属性的变化以及命名的变化

# 使用

## 安装

首先要如下修改 gradle 来添加依赖：

```gradle
buildscript {
    repositories {
        jcenter()
        mavenCentral()
        maven {
            url "http://objectbox.net/beta-repo/"
        }
    }
    dependencies {
        classpath 'io.objectbox:objectbox-gradle-plugin:0.9.6'
    }
}
 
apply plugin: 'com.android.application'
apply plugin: 'io.objectbox'
 
repositories {
    jcenter()
    mavenCentral()
    maven {
        url "http://objectbox.net/beta-repo/"
    }
}
 
dependencies {
    compile 'io.objectbox:objectbox-android:0.9.6'
}
```

## 初始化

在 Application 中初始化：

```java
// 在 Application 中初始化
boxStore = MyObjectBox.builder().androidContext(App.this).build();
```

## Entity

Entity 是需要被持久化保存的类。我们需要用`@Entity`注解来标注它，属性通常 **private** 修饰，然后会自动生成 **getter**、**setter**。

### ID

在 ObjectBox 中，每一个 Entity 都需要有`long`类型的 ID 属性，我们需要使用`@Id`来标注它。

```java
@Entity
public class User {

    @Id
    private long id;

    ...
}
```

ID 有以下需要注意的点：

* 0 代表对象还没被持久化，一个新的需要被持久化的对象的 Id 应为 0
* 如果需要使用服务器端已经存在的 Id，需要这样标记`@Id(assignable = true)`，这样就不会检查插入对象时对象的 Id

### 属性

通常我们不需要在属性上使用注解，除非：

* 需要指定特殊的存储在数据库中时的名称，使用`@Property`注解
* 不需要持久化该属性，使用`@Transient`注解

```java
@Entity
public class User {

    @Property(nameInDb = "USERNAME")
    private String name;

    @Transient
    private int tempUsageCount;

    ...
}
```

### 索引

使用`@Index`注解可以生成索引，加快查询速度。

```java
@Entity
public class User {

    @Id
    private Long id;

    @Index
    private String name;
}
```

### 关联

使用`@Relation`注解可以标注关联关系。

#### 一对一

customId 属性会自动生成。

```java
@Entity
public class Order {
    @Id long id;

    long customerId;

    @Relation
    Customer customer;
}

@Entity
public class Customer {
    @Id long id;
}
```

#### 一对多

一对多的时候，只能修饰 List。

```java
@Entity
public class Customer {
    @Id long id;

    // References the ID property in the *Order* entity
    @Relation(idProperty = "customerId")
    List<Order> orders;
}

@Entity
public class Order {
    @Id long id;

    long customerId;

    @Relation Customer customer;
}
```

## Query

首先要获取 Box 对象，然后通过 QueryBuilder 查询，以下是一个找出 firstName 是 **Joe** 的例子：

```java
Box<User> userBox = boxStore.boxFor(User.class);
List<User> joes = userBox.query().equal(User_.firstName, "Joe").build().find();
```

QueryBuilder 还提供了形如`greater`、`startsWith`等 API，使用非常方便。

### 分页

```java
Query<User> query = userBox.query().equal(UserProperties.FirstName, "Joe").build();
List<User> joes = query.find(10 /** offset by 10 */, 5 /** limit to 5 results */);
```

* `offset`: 查询的第一项的 offset
* `limit`: 查询多少项

查询的结果可以直接修改和删除，会同步数据库更改结果。

## Insert

Box 对象的`put`方法可以插入对象，通常主键的值是 0，如果服务器已经确定主键了需要添加注解标注。

# 性能对比

笔者简单测试了一下和 **Realm** 对比的性能差距，以 2000 个简单对象为例：

# Insert

生成 2000 个对象一次性插入数据库

* objectbox：39ms
* realm：127ms

# Query

查询所有 2000 条数据

* objectbox：22ms
* realm：40ms

# Delete

删除所有 2000 条数据

* objectbox：20ms
* realm：47ms

可以看出 ObjectBox 性能确实比 Realm 优秀。

更复杂的性能对比后期再测试。

# 总结

虽然现在还未到 1.0 正式版，但 ObjectBox 确实是值得期待的优秀数据库。有高性能要求的 APP 建议使用。