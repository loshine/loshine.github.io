---
title: Android开发最佳实践——3.项目架构篇
date: 2016-11-17 22:01:25
category: [技术]
tags: [Android]
toc: true
---

项目的架构是一个项目的基础，其决定了我们项目后期的可扩展性，开发过程中的便捷性等。一个好的项目架构应该是结构清晰，可维护性好且可扩展性强的。这次我们就来探讨一下如何架构一个项目。

<!-- more -->

# 架构选择

目前 Android 主流的项目架构的选择其实并不少，我们可以选择看一下 [android-architecture](https://github.com/googlesamples/android-architecture) 这个项目，这是 Google 提供的架构例子，里面包括了目前 Android 项目的主流架构：

* [todo-mvp/](https://github.com/googlesamples/android-architecture/tree/todo-mvp/) - 基本的 MVP 架构
* [todo-mvp-loaders/](https://github.com/googlesamples/android-architecture/tree/todo-mvp-loaders/) - 基于 todo-mvp, 使用 Loaders 获取数据.
* [todo-databinding/](https://github.com/googlesamples/android-architecture/tree/todo-databinding/) - 基于 todo-mvp, 使用 Data Binding 库.
* [todo-mvp-clean/](https://github.com/googlesamples/android-architecture/tree/todo-mvp-clean/) - 基于 todo-mvp, 使用了 Clean 架构.
* [todo-mvp-dagger/](https://github.com/googlesamples/android-architecture/tree/todo-mvp-dagger/) - 基于 todo-mvp, 使用 Dagger2 依赖注入 
* [todo-mvp-contentproviders/](https://github.com/googlesamples/android-architecture/tree/todo-mvp-contentproviders/) - 基于 todo-mvp-loaders, 使用 Loaders 和 Content Providers 获取数据
* [todo-mvp-rxjava/](https://github.com/googlesamples/android-architecture/tree/todo-mvp-rxjava/) - 基于 todo-mvp, 使用 RxJava 处理并发并抽象数据层.
* ……

另外除了 Google 列出的架构，还有 Facebook 推出的 [Flux](http://androidflux.github.io/) 架构也值得考虑。

以上的架构实际上并不是互斥的，在项目中是可以同时用到的。

## Clean or Flux

首先我们对比一下 Clean 和 Flux 架构的区别：

### Clean 架构

Clean 架构把项目按功能分为四层，对应到 Android 项目中从底到上分别是：

* Repository 层(对应图中 Entities，也是 MVVM 中的 Model)
* Domain 层(对应图中 Use Cases，如果没有复杂逻辑是可以省略的)
* Presenter 层(其对应的是 MVVM 中的 ViewModel)
* UI 层（即 MVVM 中的 View）

其依赖一层一层向上，底部(内部)不会对外部产生依赖。

如果使用 Clean 架构，我还会选择以下部分实现其它功能：

1. Databinding 实现 MVVM(Model-View-ViewModel)
2. RxJava 处理并发并抽象数据层
3. 使用 Dagger2 处理依赖注入

![clean_arch](https://imgur.com/Qv97dN2.png)

### Flux 架构

在 Flux 架构中，数据永远是单向流动的(不包括 Web API 以及 Rest Helper)。当我们操作界面(View)触发一个动作时，ActionCreator 会创建一个对应的 Action，并通过 Dispatcher 发送给所有订阅了这个 Action 的 Store。在 Store 处理完这个 Action 之后就会把相对应的 UI 改变的事件发送给 View 并显示出来。

下面详细讲一下 Flux 架构中对应的重要成员：

**ActionCreator** 是一个根据语义化的 API 来创建对应的 Action 的类，当 View 触发一个行为的时候就会调用 ActionCreator 对应的方法。

**Action** 是简单的 POJO 类型，它只包含类型和数据，不可被更改，一旦 Action 被创建就会发送到 Dispatcher。

**Dispatcher** 一个 Android 应用只要一个 Dispatcher，它是一个发布-订阅(又称为观察者模式)的实现，它会把 Action 分发到所有注册过的 Store 中，所有注册过的 Store 再根据需要处理 Action 即可。

**Store** Store 有点类似于 MVP 模式中的 Presenter，但它只负责更新 UI 不负责响应 UI 事件。

![flux-arch](https://imgur.com/5PuwqAq.png)

如果使用 Flux 架构，我还会选择以下部分实现其它功能：

1. RxJava 处理并发并抽象数据层
2. 使用 Dagger2 处理依赖注入

之后我会再写一篇博文介绍 Flux 架构的详细实现，到时候再详细探讨 Flux 架构。

## MVP or MVVM

为什么不用 MVC？它过时了，可以退役了。

### MVP

MVP 相比于 MVC，它从 Controller 层中抽出了一层 Presenter，来负责连接 View 和 Model，这样 View 一旦触发了一个操作，调用 Presenter 的方法去找 Model 获取数据，Presenter 获取到数据处理完毕之后通知 View 更新界面。

在这个过程中 View 和 Model 不直接发生联系，所有通信通过 Presenter 传递，这样 View 中只处理界面相关的东西，逻辑相关的则交由 Presenter 处理，便于后期维护。

![mvp](https://imgur.com/SQLsBt2.png)

### MVVM

MVVM 其实是对 MVP 的改进，它使用了双向绑定(data-binding)，View 的变化会直接更新到 ViewModel 中，ViewModel 的变化也会直接反应在 View 上，其它和 MVP 没有区别。

在 Google 推出了 Databinding 库之后使用 MVVM 可以大幅减少代码量，非常方便。

![mvvm](https://imgur.com/tuBsQXU.png)

# 总结

Clean 或 Flux 架构都是不错的架构模式，Clean 更为常见一些。而 MVP 和 MVVM 模式也是目前主流的选择，当前新开启一个项目的话可以考虑使用它们构建项目架构。

# 参考

* 文中部分图片和概念出自[《MVC，MVP 和 MVVM 的图示——阮一峰》](http://www.ruanyifeng.com/blog/2015/02/mvcmvp_mvvm.html)
* Flux 部分参考自[AndroidFlux](http://androidflux.github.io/)