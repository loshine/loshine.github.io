---
title: Jetpack LiveData 原理
date: 2020-06-21 18:08:00
category: [技术]
tags: [Android, Jetpack]
toc: true
thumbnail: https://i.loli.net/2020/06/21/u15J7lLm6XpZgti.png
---

根据官方文档的描述，LiveData 是一种可观察的数据存储器类。它具有生命周期感知能力，会遵循 LifeCycleOwner 的生命周期，只有观察者的生命周期处于 STARTED 或 RESUMED 状态的时候才会通知观察者更新。

根据 LiveData 的这一系列特性，将它和 ViewModel 一起使用是在 Android 平台上实现 MVVM 模式的绝佳途径。

<!-- more -->

## 使用 LiveData

### 添加依赖

```groovy
// LiveData
implementation "androidx.lifecycle:lifecycle-livedata:$lifecycle_version"
// LiveData-ktx
implementation "androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version"
```

### 创建 LiveData

```kotlin
class NameViewModel : ViewModel() {

    // Create a LiveData with a String
    val currentName: MutableLiveData<String> by lazy {
        MutableLiveData<String>()
    }

    // Rest of the ViewModel...
}
```

> 避免在 Activity 或 Fragment 中创建 LiveData，正确的做法是使用 ViewModel 管理它。这样会使得代码职责区分更合理，并使得 LiveData 对象在配置更改后依然存在。

### 观察 LiveData

在 Activity 的 `onCreate()` 或 Fragment 的 `onViewCreated()` , `onActivityCreated()` 方法中开始观察其数据变更：

```kotlin
class NameActivity : AppCompatActivity() {

    private val model: NameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Other code to setup the activity...

        // Create the observer which updates the UI.
        val nameObserver = Observer<String> { newName ->
            // Update the UI, in this case, a TextView.
            nameTextView.text = newName
        }

        // Observe the LiveData, passing in this activity as the LifecycleOwner and the observer.
        model.currentName.observe(this, nameObserver)
    }
}
```

### 更新 LiveData

LiveData 不提供更新自身的方法，如果需要更新 LiveData 则应该使用 MutableLiveData 代替。

MutableLiveData 提供了 `setValue(T)` 和 `postValue(T)` 来更新 LiveData。

```kotlin
button.setOnClickListener {
    val anotherName = "John Doe"
    model.currentName.setValue(anotherName)
}
```

> 主线程更新 LiveData 使用 `setValue(T)` 方法；Worker 线程更新 LiveData 使用 `postValue(T)` 方法。

### 其它 LiveData 用法

#### 扩展 LiveData

如果观察者的生命周期处于 STARTED 或 RESUMED 状态，则 LiveData 会认为该观察者处于活跃状态。LiveData 类提供了 `onActive()` 和 `onInactive()` 方法来通知子类当前是否有活跃的观察者。

```kotlin
class StockLiveData(symbol: String) : LiveData<BigDecimal>() {
    private val stockManager = StockManager(symbol)

    private val listener = { price: BigDecimal ->
        value = price
    }

    override fun onActive() {
        stockManager.requestPriceUpdates(listener)
    }

    override fun onInactive() {
        stockManager.removeUpdates(listener)
    }
}
```

我们也可以通过使用一个单例的 LiveData 在不同组件间共享数据：

```kotlin
class StockLiveData(symbol: String) : LiveData<BigDecimal>() {
    private val stockManager: StockManager = StockManager(symbol)

    private val listener = { price: BigDecimal ->
        value = price
    }

    override fun onActive() {
        stockManager.requestPriceUpdates(listener)
    }

    override fun onInactive() {
        stockManager.removeUpdates(listener)
    }

    companion object {
        private lateinit var sInstance: StockLiveData

        @MainThread
        fun get(symbol: String): StockLiveData {
            sInstance = if (::sInstance.isInitialized) sInstance else StockLiveData(symbol)
            return sInstance
        }
    }
}
```

#### 转换 LiveData

Transformations 类提供了一些方法来转换 LiveData 的值，类似于 RxJava 的各个操作符。

如果需要自定义转换，需要使用  MediatorLiveData，它可以监听其它 LiveData 对象并处理它们的数据。

#### 合并 LiveData

MediatorLiveData 也可以用于合并多个 LiveData，当任意一个 LiveData 数据源变化的时候，MediatorLiveData 都会收到更新。

```kotlin
val liveData1: LiveData<Int> = ...
val liveData2: LiveData<Int> = ...

val result = MediatorLiveData<Int>()

result.addSource(liveData1) { value ->
    result.setValue(value)
}
result.addSource(liveData2) { value ->
    result.setValue(value)
}
```

## 源码分析

 我们知道 LiveData 是可以感知生命周期的可被观察的数据存储器类，那么它是如何实现这些特性的呢？我们通过源码来分析一下。

LiveData 库主要由以下三个类构成：

* LiveData：最核心的类
* MutableLiveData：暴露 LiveData 的 `setValue` 和 `postValue` 方法
* Observer：观察者，提供 `onChanged()` 方法监听数据变更

### LiveData

LiveData 就是我们可以在给定生命周期内观察到的数据存储类。通常我们会同时传入 LifecyclerOwner 和 Observer 来完成数据监听，只有在 LifecycleOwner 处于活动状态的时候，才会通知 Observer 数据变更。

我们看看它的 `observe` 方法：

```java
@MainThread
public void observe(@NonNull LifecycleOwner owner, @NonNull Observer<? super T> observer) {
    assertMainThread("observe");
    if (owner.getLifecycle().getCurrentState() == DESTROYED) {
        // ignore
        return;
    }
    LifecycleBoundObserver wrapper = new LifecycleBoundObserver(owner, observer);
    ObserverWrapper existing = mObservers.putIfAbsent(observer, wrapper);
    if (existing != null && !existing.isAttachedTo(owner)) {
        throw new IllegalArgumentException("Cannot add the same observer"
                + " with different lifecycles");
    }
    if (existing != null) {
        return;
    }
    owner.getLifecycle().addObserver(wrapper);
}

class LifecycleBoundObserver extends ObserverWrapper implements LifecycleEventObserver {
    @NonNull
    final LifecycleOwner mOwner;

    LifecycleBoundObserver(@NonNull LifecycleOwner owner, Observer<? super T> observer) {
        super(observer);
        mOwner = owner;
    }

    // ...
}
```

当调用 `observe` 方法时，内部是使用 **LifecycleBoundObserver** 实例来对 LifecycleOwner 的生命周期进行监听，因此当生命周期变化时会调用 LifecycleBoundObserver 的 `onStateChanged` 方法：

```java
@Override
public void onStateChanged(@NonNull LifecycleOwner source,
        @NonNull Lifecycle.Event event) {
    if (mOwner.getLifecycle().getCurrentState() == DESTROYED) {
        removeObserver(mObserver);
        return;
    }
    activeStateChanged(shouldBeActive());
}
```

当 LifecycleOwner 的生命周期处于 **DESTROYED** 时，会调用 removeObserver 解除监听。

```java
@Override
boolean shouldBeActive() {
    return mOwner.getLifecycle().getCurrentState().isAtLeast(STARTED);
}

void activeStateChanged(boolean newActive) {
    if (newActive == mActive) {
        return;
    }
    // immediately set active state, so we'd never dispatch anything to inactive
    // owner
    mActive = newActive;
    boolean wasInactive = LiveData.this.mActiveCount == 0;
    LiveData.this.mActiveCount += mActive ? 1 : -1;
    if (wasInactive && mActive) {
        onActive();
    }
    if (LiveData.this.mActiveCount == 0 && !mActive) {
        onInactive();
    }
    if (mActive) {
        dispatchingValue(this);
    }
}
```

此处首先根据生命周期的变化判断目前是活动状态还是非活动状态，并调用对应的 `onActive()` 或 `onInactive()` 方法通知子类。最后如果处于活动状态，调用 LiveData 的 `dispatchingValue` 方法：

```java
void dispatchingValue(@Nullable ObserverWrapper initiator) {
    if (mDispatchingValue) {
        mDispatchInvalidated = true;
        return;
    }
    mDispatchingValue = true;
    do {
        mDispatchInvalidated = false;
        if (initiator != null) {
            considerNotify(initiator);
            initiator = null;
        } else {
            for (Iterator<Map.Entry<Observer<? super T>, ObserverWrapper>> iterator =
                    mObservers.iteratorWithAdditions(); iterator.hasNext(); ) {
                considerNotify(iterator.next().getValue());
                if (mDispatchInvalidated) {
                    break;
                }
            }
        }
    } while (mDispatchInvalidated);
    mDispatchingValue = false;
}
```

此处显然是进入了 `initiator != null` 情况的判断分支，然后调用了 `considerNotify(initator)` 方法：

```java
private void considerNotify(ObserverWrapper observer) {
    if (!observer.mActive) {
        return;
    }
    if (!observer.shouldBeActive()) {
        observer.activeStateChanged(false);
        return;
    }
    if (observer.mLastVersion >= mVersion) {
        return;
    }
    observer.mLastVersion = mVersion;
    observer.mObserver.onChanged((T) mData);
}
```

该方法内部判断了 observer 的状态以及版本号，来决定是否将数据变更通知给 mObserver。

当我们调用 `setValue(T)` 方法时：

```java
@MainThread
protected void setValue(T value) {
    assertMainThread("setValue");
    mVersion++;
    mData = value;
    dispatchingValue(null);
}
```

mVersion 会自增，然后 value 赋值给 mData，最后调用 `dispatchingValue` 方法。此处传入的 initiator 为 null，因此走了 else 分支：

```java
for (Iterator<Map.Entry<Observer<? super T>, ObserverWrapper>> iterator =
        mObservers.iteratorWithAdditions(); iterator.hasNext(); ) {
    considerNotify(iterator.next().getValue());
    if (mDispatchInvalidated) {
        break;
    }
}
```

此处会遍历所有添加的 Observer，并挨个调用 considerNotify 方法，之后再在 considerNotify 中调用 `onChanged` 进行通知。

## 总结

LiveData 提供了一种非常方便的观测数据变化更新 UI 的模式。使用它的时候我们不需要关心生命周期的变化导致的各种异常，它会自行感知生命周期通知观察者更新数据。其内部依赖于 LifeCycle 来实现，结合 ViewModel 使用时，我们可以非常轻松的写出健壮且低耦合，易维护的代码。
