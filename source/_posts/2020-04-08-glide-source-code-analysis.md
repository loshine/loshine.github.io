---
title: Glide 源码解析
date: 2020-04-08 17:00:00
category: [技术]
tags: [Android]
toc: true
thumbnail: https://i.loli.net/2020/06/03/7dbpGo1hWJcTXtF.png
---

Glide 是一个非常优秀的图片加载框架，为我们处理了图片加载中的各种痛点，如：多种尺寸格式的缓存、生命周期感知、高效处理 Bitmap 等，本文解析其源码分析它是如何做到这些的。

<!-- more -->

## 使用方法

以官网文档为例，一个最简单的使用方法：

```java
Glide.with(fragment)
    .load(url)
    .into(imageView);
```

大多数情况我们直接如上调用即可。该使用方式可以简单分为三步：

1. with(context)
2. load(url)
3. into(target)

以上的 with 也可以传入 Activity 或 Fragment，load 也可以传入图片 drawableId 等。

## 分析

### with 系列方法

Glide 的 with 方法共有五个常用的重载方法：

```java
  @NonNull
  public static RequestManager with(@NonNull Context context) {
    return getRetriever(context).get(context);
  }

  @NonNull
  public static RequestManager with(@NonNull Activity activity) {
    return getRetriever(activity).get(activity);
  }

  @NonNull
  public static RequestManager with(@NonNull FragmentActivity activity) {
    return getRetriever(activity).get(activity);
  }

  @NonNull
  public static RequestManager with(@NonNull Fragment fragment) {
    return getRetriever(fragment.getContext()).get(fragment);
  }

  @NonNull
  public static RequestManager with(@NonNull View view) {
    return getRetriever(view.getContext()).get(view);
  }
```

以上五个方法都调用了 getRetriver 方法，传入了 context：

```java
  @NonNull
  private static RequestManagerRetriever getRetriever(@Nullable Context context) {
    // Context could be null for other reasons (ie the user passes in null), but in practice it will
    // only occur due to errors with the Fragment lifecycle.
    Preconditions.checkNotNull(
        context,
        "You cannot start a load on a not yet attached View or a Fragment where getActivity() "
            + "returns null (which usually occurs when getActivity() is called before the Fragment "
            + "is attached or after the Fragment is destroyed).");
    return Glide.get(context).getRequestManagerRetriever();
  }
```

该方法返回了一个 RequestManagerRetriever 对象，`Glide.get(context).getRequestManagerRetriever();`的具体实现：

```java
  private static volatile Glide glide;

  /**
   * Get the singleton.
   *
   * @return the singleton
   */
  @NonNull
  public static Glide get(@NonNull Context context) {
    if (glide == null) {
      GeneratedAppGlideModule annotationGeneratedModule =
          getAnnotationGeneratedGlideModules(context.getApplicationContext());
      synchronized (Glide.class) {
        if (glide == null) {
          checkAndInitializeGlide(context, annotationGeneratedModule);
        }
      }
    }

    return glide;
  }
```

`Glide.get()`是一个懒汉式初始化 Glide 单例的方法，`checkAndInitializeGlide`这个方法就不进去具体分析了，里面主要是进行了一些组件如 Log 和 GlideModule 的初始化。

`getRequestManagerRetriever`方法实际上获取了一个 new 出来的 RequestManagerRetriever，我们直接看看 RequestManagerRetriever.get(context) 的源码：

```java
  @NonNull
  public RequestManager get(@NonNull Context context) {
    if (context == null) {
      throw new IllegalArgumentException("You cannot start a load on a null Context");
    } else if (Util.isOnMainThread() && !(context instanceof Application)) {
      if (context instanceof FragmentActivity) {
        return get((FragmentActivity) context);
      } else if (context instanceof Activity) {
        return get((Activity) context);
      } else if (context instanceof ContextWrapper
          && ((ContextWrapper) context).getBaseContext().getApplicationContext() != null) {
        return get(((ContextWrapper) context).getBaseContext());
      }
    }

    return getApplicationManager(context);
  }
```

以上方法根据传入的 context 的类型不同采取不同操作，以`getApplicationManager(context)`分析：

```java
@NonNull
  private RequestManager getApplicationManager(@NonNull Context context) {
    if (applicationManager == null) {
      synchronized (this) {
        if (applicationManager == null) {
          Glide glide = Glide.get(context.getApplicationContext());
          applicationManager =
              factory.build(
                  glide,
                  new ApplicationLifecycle(),
                  new EmptyRequestManagerTreeNode(),
                  context.getApplicationContext());
        }
      }
    }

    return applicationManager;
  }
```

此处显然是一个懒汉式创建 applicationManager 单例的方法，若传入的是 FragmentActivity：

```java
  @NonNull
  public RequestManager get(@NonNull FragmentActivity activity) {
    if (Util.isOnBackgroundThread()) {
      return get(activity.getApplicationContext());
    } else {
      assertNotDestroyed(activity);
      FragmentManager fm = activity.getSupportFragmentManager();
      return supportFragmentGet(activity, fm, null, isActivityVisible(activity));
    }
  }

  @NonNull
  private RequestManager supportFragmentGet(
      @NonNull Context context,
      @NonNull FragmentManager fm,
      @Nullable Fragment parentHint,
      boolean isParentVisible) {
    SupportRequestManagerFragment current =
        getSupportRequestManagerFragment(fm, parentHint, isParentVisible);
    RequestManager requestManager = current.getRequestManager();
    if (requestManager == null) {
      Glide glide = Glide.get(context);
      requestManager =
          factory.build(
              glide, current.getGlideLifecycle(), current.getRequestManagerTreeNode(), context);
      current.setRequestManager(requestManager);
    }
    return requestManager;
  }

  @NonNull
  private SupportRequestManagerFragment getSupportRequestManagerFragment(
      @NonNull final FragmentManager fm, @Nullable Fragment parentHint, boolean isParentVisible) {
    SupportRequestManagerFragment current =
        (SupportRequestManagerFragment) fm.findFragmentByTag(FRAGMENT_TAG);
    if (current == null) {
      current = pendingSupportRequestManagerFragments.get(fm);
      if (current == null) {
        current = new SupportRequestManagerFragment();
        current.setParentFragmentHint(parentHint);
        if (isParentVisible) {
          current.getGlideLifecycle().onStart();
        }
        pendingSupportRequestManagerFragments.put(fm, current);
        fm.beginTransaction().add(current, FRAGMENT_TAG).commitAllowingStateLoss();
        handler.obtainMessage(ID_REMOVE_SUPPORT_FRAGMENT_MANAGER, fm).sendToTarget();
      }
    }
    return current;
  }
```

如果不在主线程则调用`get`方法传入 applicationContext，最终会走到`getApplicationManager`。否则生成一个没有界面的 fragment 并 add 到 FragmentActivity 中，然后返回已存在的或新构造的 RequestManager。

fragment 对应的也类似，就不再分析了。

### load 系列方法

通过 with 系列方法我们拿到了一个 RequestManager，然后我们会调用 RequestManager 的 load 系列方法，RequestManager 中有多个重载方法，我们以`load(String)`为例分析：

```java
  @NonNull
  @CheckResult
  @Override
  public RequestBuilder<Drawable> load(@Nullable String string) {
    return asDrawable().load(string);
  }
```

首先看看`asDrawable()`方法：

```java
  @NonNull
  @CheckResult
  public RequestBuilder<Drawable> asDrawable() {
    return as(Drawable.class);
  }

  @NonNull
  @CheckResult
  public <ResourceType> RequestBuilder<ResourceType> as(
      @NonNull Class<ResourceType> resourceClass) {
    return new RequestBuilder<>(glide, this, resourceClass, context);
  }
```

本质上是构造了一个加载 Drawable 的 RequestBuilder。然后看看`RequestBuilder.load(string)`方法：

```java
  @NonNull
  @Override
  @CheckResult
  public RequestBuilder<TranscodeType> load(@Nullable String string) {
    return loadGeneric(string);
  }

  @NonNull
  private RequestBuilder<TranscodeType> loadGeneric(@Nullable Object model) {
    this.model = model;
    isModelSet = true;
    return this;
  }
```

非常简单，就是设置了 `model` 和 `isModelSet` 两个变量。

### into 方法

into 方法设置 ImageView

```java
  @NonNull
  public ViewTarget<ImageView, TranscodeType> into(@NonNull ImageView view) {
    Util.assertMainThread();
    Preconditions.checkNotNull(view);

    BaseRequestOptions<?> requestOptions = this;
    if (!requestOptions.isTransformationSet()
        && requestOptions.isTransformationAllowed()
        && view.getScaleType() != null) {
      switch (view.getScaleType()) {
        case CENTER_CROP:
          requestOptions = requestOptions.clone().optionalCenterCrop();
          break;
        case CENTER_INSIDE:
          requestOptions = requestOptions.clone().optionalCenterInside();
          break;
        case FIT_CENTER:
        case FIT_START:
        case FIT_END:
          requestOptions = requestOptions.clone().optionalFitCenter();
          break;
        case FIT_XY:
          requestOptions = requestOptions.clone().optionalCenterInside();
          break;
        case CENTER:
        case MATRIX:
        default:
          // Do nothing.
      }
    }

    return into(
        glideContext.buildImageViewTarget(view, transcodeClass),
        null,
        requestOptions,
        Executors.mainThreadExecutor());
  }
```

该方法检查了是否是在主线程进行调用，以及传入的 view 是否为 null，之后获取 ImageView 的 ScaleType 设置到 requestOptions 中，然后把 ImageView 传入`glideContext.buildImageViewTarget(view, transcodeClass)`中包装成一个 Target 对象，再调用重载的 into 方法：

```java
  @NonNull
  @Synthetic
  <Y extends Target<TranscodeType>> Y into(
      @NonNull Y target,
      @Nullable RequestListener<TranscodeType> targetListener,
      Executor callbackExecutor) {
    return into(target, targetListener, this, callbackExecutor);
  }

  private <Y extends Target<TranscodeType>> Y into(
      @NonNull Y target,
      @Nullable RequestListener<TranscodeType> targetListener,
      BaseRequestOptions<?> options,
      Executor callbackExecutor) {
    Preconditions.checkNotNull(target);
    if (!isModelSet) {
      throw new IllegalArgumentException("You must call #load() before calling #into()");
    }

    Request request = buildRequest(target, targetListener, options, callbackExecutor);

    Request previous = target.getRequest();
    if (request.isEquivalentTo(previous)
        && !isSkipMemoryCacheWithCompletePreviousRequest(options, previous)) {
      if (!Preconditions.checkNotNull(previous).isRunning()) {
        previous.begin();
      }
      return target;
    }

    requestManager.clear(target);
    target.setRequest(request);
    requestManager.track(target, request);

    return target;
  }
```

`buildRequest(target, targetListener, options, callbackExecutor);`根据传入的数据构造了一个 Request 对象，如果有正在进行中的请求且和新的相同，则开始之前的；否则清除 target 的请求再设置新的 request。

`target.getRequest()`和`target.setRequest()`在 ViewTarget 中的实现如下：

```java
  @Override
  @Nullable
  public Request getRequest() {
    Object tag = getTag();
    Request request = null;
    if (tag != null) {
      if (tag instanceof Request) {
        request = (Request) tag;
      } else {
        throw new IllegalArgumentException(
            "You must not call setTag() on a view Glide is targeting");
      }
    }
    return request;
  }

  @Nullable
  private Object getTag() {
    return view.getTag(tagId);
  }

  @Override
  public void setRequest(@Nullable Request request) {
    setTag(request);
  }

  private void setTag(@Nullable Object tag) {
    isTagUsedAtLeastOnce = true;
    view.setTag(tagId, tag);
  }
```

可以看到实际上是把 Request 作为 View 的 tag，然后重点观察以下这几句代码：

```java
		Request previous = target.getRequest();
    if (request.isEquivalentTo(previous)
        && !isSkipMemoryCacheWithCompletePreviousRequest(options, previous)) {
      if (!Preconditions.checkNotNull(previous).isRunning()) {
        previous.begin();
      }
      return target;
    }

    requestManager.clear(target);
    target.setRequest(request);
    requestManager.track(target, request);
```

以上的执行逻辑如下：

1. 获取 target 之前的 request
2. 如果新的 request 和之前的 request 逻辑相等，且非（跳过内存缓存且前一个请求已结束），且前一个请求未在运行，就重新开始前一个请求；
3. 否则清除 target 的 request，并重新设置 request，再调用`requestManager.track(target, request);`开始请求。

从上述逻辑可以看出这样的方式可以解决 ListView 和 RecyclerView 中加载图片错位的问题。

`requestManager.track(target, request)`源码如下：

```java
  synchronized void track(@NonNull Target<?> target, @NonNull Request request) {
    targetTracker.track(target);
    requestTracker.runRequest(request);
  }
```

这是一个同步方法，保证了同一时间只有一个线程调用到这里，`targetTracker.track(target)`是一个观察者模式的实现，TargetTracker 实现了 LifecycleListener 且注册了 target，然后会根据生命周期调用其方法，这也是 Glide 可以感知生命周期结束加载图片的原理。

`requestTracker.runRequest(request)`实现如下：

```java
  public void runRequest(@NonNull Request request) {
    requests.add(request);
    if (!isPaused) {
      request.begin();
    } else {
      request.clear();
      if (Log.isLoggable(TAG, Log.VERBOSE)) {
        Log.v(TAG, "Paused, delaying request");
      }
      pendingRequests.add(request);
    }
  }
```

调用了`request.begin()`，这里通常都是 SingleRequest，我们看一下  SingleRequest 的 begin 方法的实现：

```java
  @Override
  public void begin() {
    synchronized (requestLock) {
			// ...省略部分代码
      if (model == null) {
				// ...省略部分代码
        int logLevel = getFallbackDrawable() == null ? Log.WARN : Log.DEBUG;
        onLoadFailed(new GlideException("Received null model"), logLevel);
        return;
      }

      if (status == Status.RUNNING) {
        throw new IllegalArgumentException("Cannot restart a running request");
      }

      if (status == Status.COMPLETE) {
        onResourceReady(resource, DataSource.MEMORY_CACHE);
        return;
      }

      status = Status.WAITING_FOR_SIZE;
      if (Util.isValidDimensions(overrideWidth, overrideHeight)) {
        onSizeReady(overrideWidth, overrideHeight);
      } else {
        target.getSize(this);
      }

      if ((status == Status.RUNNING || status == Status.WAITING_FOR_SIZE)
          && canNotifyStatusChanged()) {
        target.onLoadStarted(getPlaceholderDrawable());
      }

      // ...
    }
  }
```

这里会走到`status = Status.WAITING_FOR_SIZE;如果有设置合法的 overrideWidth 和 overrideHeight，就调用`onSizeReady(overrideWidth, overrideHeight)` 否则调用 `target.getSize(this)` 获取尺寸，然后回调 onSizeReady。

onSizeReady 中会调用 engine.load 方法，这是 Glide 加载图片的核心方法，在该方法中加载完毕之后会回调 SingleRequest 的 onResourceReady 方法，再对资源进行一些加载完毕的回调。

### Engine 的 load 方法

```java
  public <R> LoadStatus load(...) {
    // .. 省略部分代码
		synchronized (this) {
      // 从内存缓存中读取
      memoryResource = loadFromMemory(key, isMemoryCacheable, startTime);
      
      if (memoryResource == null) {
        return waitForExistingOrStartNewJob(...);
      }
    // 这里会回调 onResourceReady
    cb.onResourceReady(memoryResource, DataSource.MEMORY_CACHE);
    return null;
  }
  
  private <R> LoadStatus waitForExistingOrStartNewJob(...) {
    EngineJob<?> current = jobs.get(key, onlyRetrieveFromCache);
    if (current != null) {
      current.addCallback(cb, callbackExecutor);
      if (VERBOSE_IS_LOGGABLE) {
        logWithTimeAndKey("Added to existing load", startTime, key);
      }
      return new LoadStatus(cb, current);
    }

    // 省略部分参数
    EngineJob<R> engineJob = engineJobFactory.build(...);
    DecodeJob<R> decodeJob = decodeJobFactory.build(...);

    jobs.put(key, engineJob);

    engineJob.addCallback(cb, callbackExecutor);
    engineJob.start(decodeJob);

    if (VERBOSE_IS_LOGGABLE) {
      logWithTimeAndKey("Started new load", startTime, key);
    }
    return new LoadStatus(cb, engineJob);
  }  
```

最终通过`engineJob.start(devodeJob)`方法执行：

```java
  public synchronized void start(DecodeJob<R> decodeJob) {
    this.decodeJob = decodeJob;
    GlideExecutor executor =
        decodeJob.willDecodeFromCache() ? diskCacheExecutor : getActiveSourceExecutor();
    executor.execute(decodeJob);
  }
```

在图片加载完毕之后会调用回调 onResourceReady，我们再回归 SingleRequest 的 onResourceReady 方法：

```java
  @Override
  public void onResourceReady(Resource<?> resource, DataSource dataSource) {
    stateVerifier.throwIfRecycled();
    Resource<?> toRelease = null;
    try {
      synchronized (requestLock) {
				// 省略部分代码
        onResourceReady((Resource<R>) resource, (R) received, dataSource);
      }
    } finally {
      if (toRelease != null) {
        engine.release(toRelease);
      }
    }
  }

  @GuardedBy("requestLock")
  private void onResourceReady(Resource<R> resource, R result, DataSource dataSource) {
    // We must call isFirstReadyResource before setting status.
    boolean isFirstResource = isFirstReadyResource();
    status = Status.COMPLETE;
    this.resource = resource;

    isCallingCallbacks = true;
    try {
      // 省略部分代码
      anyListenerHandledUpdatingTarget |=
          targetListener != null
              && targetListener.onResourceReady(result, model, target, dataSource, isFirstResource);

      if (!anyListenerHandledUpdatingTarget) {
        Transition<? super R> animation = animationFactory.build(dataSource, isFirstResource);
        target.onResourceReady(result, animation);
      }
    } finally {
      isCallingCallbacks = false;
    }

    notifyLoadSuccess();
  }
```

可以看出最终是走到了`target.onResourceReady(result, animation)`，看看在 ImageViewTarget 中的实现：

```java
  @Override
  public void onResourceReady(@NonNull Z resource, @Nullable Transition<? super Z> transition) {
    if (transition == null || !transition.transition(resource, this)) {
      setResourceInternal(resource);
    } else {
      maybeUpdateAnimatable(resource);
    }
  }

  private void setResourceInternal(@Nullable Z resource) {
    setResource(resource);
    maybeUpdateAnimatable(resource);
  }

	protected abstract void setResource(@Nullable Z resource);
```

最终会调用`setResource`方法，而这个方法是一个抽象方法，是由子类实现的，而 ImageViewTarget 有三个子类，最常见的是 DrawableImageViewTarget，它的实现如下：

```java
  @Override
  protected void setResource(@Nullable Drawable resource) {
    view.setImageDrawable(resource);
  }
```

非常简单就是直接调用了 ImageView 的 `setImageDrawable` 方法，至此一次完整的图片加载结束。