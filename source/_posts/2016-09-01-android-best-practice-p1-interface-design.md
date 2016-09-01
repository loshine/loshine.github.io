---
title: Android开发最佳实践——1.接口设计
date: 2016-09-01 09:51:21
category: [技术]
tags: [Android]
toc: true
description: Support Library 24.2.0 中添加了一个新的工具类，可以用来方便快捷的处理 RecyclerView.Adapter 的通知刷新。
---

一个项目刚开始的时候，最需要确认的就是接口设计了：数据如何传递，使用什么格式什么协议乃至如何保证安全性。如果一个项目的接口设计不合理——比如没有考虑到安全性，后期为了增加安全验证又要对部分 API 推倒重做，那么前端（泛指 Android、iOS 以及 Web）就必须对整个项目进行改动，甚至可能导致之前发布的版本无法使用的囧事。

那么本文就谈谈我认为的一个好的接口应该是如何设计的。

# 设计

使用 RESTful 风格的 API 设计。

# 协议

使用 HTTPS 协议，保证 HTTP 的方便的同时保证一定的安全性。

# 域名

尽量部署在专属域名下，如 github：

```
https://api.github.com/
```

# 版本

应该把版本号放到 URL 中，如 API 有改版的时候，应保证老版的 API 持续提供服务一段时间。

```
https://api.example.com/v1/
```

# 路径和资源

在 Restful 风格的 API 中，每个路径都代表着互联网中的一个资源。所以 URL 地址中应该使用名词，并且因为大多是资源集合，所以应该使用复数形式。如果是有从属关系的资源，应该服从从属关系，下面给出几个例子：`

* `https://api.example.com/v1/posts`
* `https://api.example.com/v1/posts/{postId}`
* `https://api.example.com/v1/posts/{postId}/comments`

# HTTP 动词

HTTP 动词可以完美对应数据库的增删查改操作，于是我们就把 HTTP 动词和我们的增删查改操作对应起来：

* GET：查询数据
* POST：增加数据
* PUT：更新数据(客户端提供改变后的完整资源)
* PATCH：更新数据(客户端更新某几条属性)
* DELETE：删除数据

## 示例

下面是结合 HTTP 动词和路径提供一些示例：

* GET `/posts` ：获取所有文章
* POST `/posts` ：创建一篇文章
* GET `/posts/{postId}` ：获取指定 Id 的文章信息
* PUT `/posts/{postId}` ：修改指定 Id 的文章信息(客户端需要提供全部属性)
* PATCH `/post/{postId}` ：修改指定 Id 的文章信息(客户端提供需要修改的部分属性)
* DELETE `/post/{postId}` ：删除指定 Id 的文章
* GET `/posts/{postId}/comments` ：获取指定 Id 文章的所有评论
* POST `/posts/{postId}/comments` ：在指定 Id 文章下创建一条评论

# Query 查询

在 GET 查询的时候我们不可能一次性获取所有资源，那么我们需要提供一些查询条件。

下面是一些常用的查询：

* `?index=2&size=20` ：第二页每页20条

* `?sortby=name&order=asc` ：按指定规则与顺序排序

  ……

# 全局信息

全局通用信息应该放在请求头里，避免使用 Query 拼接，如：

- APPID（Android/iOS/H5）
- APPVER（版本号）
- CHANNEL（渠道号）
- APP-BUILD-NUM（内部小版本号）
- TOKEN
- NETWORK（网络环境）
- LANGUAGE（语言）

等

# 传输数据

 ## Request

使用 json 格式传输数据，如果需要上传文件则使用表单的形式提交。

## Response

使用 json 格式传输数据，`Content-Type`一致设定为`application/json`。

响应格式应该统一，下面给出一个例子：

| 名字      | 类型             | 含义   |
| ------- | -------------- | ---- |
| code    | int            | 状态码  |
| message | String         | 状态信息 |
| data    | List or Object | 数据   |
| time    | long           | 时间戳  |

具体的响应如下：

```json
{
  'code': 0,
  'message': '获取成功',
  'data': [{}, {}, {}], // 返回一个集合
  'time': 1472435695000
}
```

或者返回某一个数据：

```json
{
  'code': 0,
  'message': '获取成功',
  'data': {}, // 返回一个对象
  'time': 1472435695000
}
```

# 安全

为了保证客户端与服务端通信的安全，我们使用 HTTPS 协议。

在身份认证上使用 Oauth 2.0 协议，用户登录之后在客户端保存一份 token，避免在客户端持久化存储用户名和密码。之后每次访问需要身份认证的 API 时，必须携带 token 访问。

# 避免空指针

API 设计的时候应该合理帮助前端避免空指针异常，在一些字段或者属性为空的时候应该返回默认值：如 String 返回`""`, int 返回`0`, Object 返回 `{}`, Array or List 返回 `[]`。

# 参考

* [从零开始的Android新项目9 - 前端用后台接口设计](http://blog.zhaiyifan.cn/2016/07/23/android-new-project-from-0-p9/)
* [RESTful API 设计指南](http://www.ruanyifeng.com/blog/2014/05/restful_api.html)