---
title: Jetpack Lifecycle 原理
date: 2020-06-16 20:02:00
category: [技术]
tags: [Android, Jetpack]
toc: true
thumbnail: https://i.loli.net/2020/06/16/bPhvswoEiQpZKxW.png
---

Lifecycle 是 Architecture Components 官方架构组件之一。

它可以让我们在另外的组件中感知到 Activity 或 Fragment 的生命周期状态的变化，有助于我们写出更有条理、更精简、易于维护的代码。

<!-- more -->

## 引入依赖

以下是一份完整的可选依赖方式。

```groovy
dependencies {
    def lifecycle_version = "2.2.0"
    def arch_version = "2.1.0"

    // ViewModel
    implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:$lifecycle_version"
    // LiveData
    implementation "androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version"
    // Lifecycles only (without ViewModel or LiveData)
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version"

    // Saved state module for ViewModel
    implementation "androidx.lifecycle:lifecycle-viewmodel-savedstate:$lifecycle_version"

    // Annotation processor
    kapt "androidx.lifecycle:lifecycle-compiler:$lifecycle_version"
    // alternately - if using Java8, use the following instead of lifecycle-compiler
    implementation "androidx.lifecycle:lifecycle-common-java8:$lifecycle_version"

    // optional - helpers for implementing LifecycleOwner in a Service
    implementation "androidx.lifecycle:lifecycle-service:$lifecycle_version"

    // optional - ProcessLifecycleOwner provides a lifecycle for the whole application process
    implementation "androidx.lifecycle:lifecycle-process:$lifecycle_version"

    // optional - ReactiveStreams support for LiveData
    implementation "androidx.lifecycle:lifecycle-reactivestreams-ktx:$lifecycle_version"

    // optional - Test helpers for LiveData
    testImplementation "androidx.arch.core:core-testing:$arch_version"
}
```

我们也可以只使用 AppCompat，它已经默认内置了 lifecycle-common

```groovy
implementation 'androidx.appcompat:appcompat:1.1.0'
```

### 基础使用

Java7 中的用法

```java
public interface LifecycleObserverIml extends LifecycleObserver {

    @OnLifecycleEvent(Lifecycle.Event.On_CREATE)
    void onCreate();

    @OnLifecycleEvent(Lifecycle.Event.ON_START)
    void onStart();

    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
    void onResume();

    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    void onPause();

    @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
    void onStop();

    @OnLifecycleEvent(Lifecycle.Event.ON_DESTROY)
    void onDestroy();
}
```

Java8 中的用法

```java
public interface LifecycleObserverIml8 extends DefaultLifecycleObserver {

    @Override
    default void onCreate(@NonNull LifecycleOwner owner) {
    }

    @Override
    default void onStart(@NonNull LifecycleOwner owner) {
    }

    @Override
    default void onResume(@NonNull LifecycleOwner owner) {
    }

    @Override
    default void onPause(@NonNull LifecycleOwner owner) {
    }

    @Override
    default void onStop(@NonNull LifecycleOwner owner) {
    }

    @Override
    default void onDestroy(@NonNull LifecycleOwner owner) {
    }
}
```

在 Activity/Fragment 中使用

```java
getLifecycle().addObserver(lifecycleObserver);
```

### Event & State

![image.png](https://i.loli.net/2020/06/16/bPhvswoEiQpZKxW.png)

## 源码解析

### 绑定观察者

```java
public class ComponentActivity extends androidx.core.app.ComponentActivity implements
        LifecycleOwner,
        ViewModelStoreOwner,
        SavedStateRegistryOwner,
        OnBackPressedDispatcherOwner {

    static final class NonConfigurationInstances {
        Object custom;
        ViewModelStore viewModelStore;
    }

    private final LifecycleRegistry mLifecycleRegistry = new LifecycleRegistry(this);

    @NonNull
    @Override
    public Lifecycle getLifecycle() {
        return mLifecycleRegistry;
    }
}
```

调用 `getLifecycle()` 实际上获取的是 LifecycleRegistry 实例。

LifecycleRegistry 实现了 Lifecycle 接口, 提供了增加/删除观察者的接口

```java
public abstract class Lifecycle {

    @RestrictTo(RestrictTo.Scope.LIBRARY_GROUP)
    @NonNull
    AtomicReference<Object> mInternalScopeRef = new AtomicReference<>();

    @MainThread
    public abstract void addObserver(@NonNull LifecycleObserver observer);

    @MainThread
    public abstract void removeObserver(@NonNull LifecycleObserver observer);

    @MainThread
    @NonNull
    public abstract State getCurrentState();
}
```

### 通知观察者

```java
public class LifecycleRegistry extends Lifecycle {
//省略相关代码.....

 public void handleLifecycleEvent(@NonNull Lifecycle.Event event) {
        State next = getStateAfter(event);
        moveToState(next);
    }

    private void moveToState(State next) {
        if (mState == next) {
            return;
        }
        mState = next;
        if (mHandlingEvent || mAddingObserverCounter != 0) {
            mNewEventOccurred = true;
            // we will figure out what to do on upper level.
            return;
        }
        mHandlingEvent = true;
        sync();
        mHandlingEvent = false;
    }
     // happens only on the top of stack (never in reentrance),
    // so it doesn't have to take in account parents
    private void sync() {
        LifecycleOwner lifecycleOwner = mLifecycleOwner.get();
        if (lifecycleOwner == null) {
            throw new IllegalStateException("LifecycleOwner of this LifecycleRegistry is already"
                    + "garbage collected. It is too late to change lifecycle state.");
        }
        while (!isSynced()) {
            mNewEventOccurred = false;
            // no need to check eldest for nullability, because isSynced does it for us.
            if (mState.compareTo(mObserverMap.eldest().getValue().mState) < 0) {
                backwardPass(lifecycleOwner);
            }
            Entry<LifecycleObserver, ObserverWithState> newest = mObserverMap.newest();
            if (!mNewEventOccurred && newest != null
                    && mState.compareTo(newest.getValue().mState) > 0) {
                forwardPass(lifecycleOwner);
            }
        }
        mNewEventOccurred = false;
    }
    //省略相关代码.....
}
```

所有的观察者所接受的事件都是由 `handleLifecycleEvent()` 函数来驱动, 最后分发到 `forwardPass` 和 `backwardPass` 这两个函数来进行分发和同步的操作。

`forwardPass` 遍历观察者集合，当观察者生命周期状态小于当前生命周期状态时分发事件

```java
private void forwardPass(LifecycleOwner lifecycleOwner) {

    Iterator<Entry<LifecycleObserver, ObserverWithState>> ascendingIterator =
            mObserverMap.iteratorWithAdditions();
    while (ascendingIterator.hasNext() && !mNewEventOccurred) {
        Entry<LifecycleObserver, ObserverWithState> entry = ascendingIterator.next();
        ObserverWithState observer = entry.getValue();
        while ((observer.mState.compareTo(mState) < 0 && !mNewEventOccurred
                && mObserverMap.contains(entry.getKey()))) {
            pushParentState(observer.mState);
            observer.dispatchEvent(lifecycleOwner, upEvent(observer.mState));
            popParentState();
        }
    }
}
```

`backwardPass` 遍历观察者集合，当观察者生命周期状态大于当前生命周期状态时分发事件

```java
private void backwardPass(LifecycleOwner lifecycleOwner) {
    Iterator<Entry<LifecycleObserver, ObserverWithState>> descendingIterator =
            mObserverMap.descendingIterator();
    while (descendingIterator.hasNext() && !mNewEventOccurred) {
        Entry<LifecycleObserver, ObserverWithState> entry = descendingIterator.next();
        ObserverWithState observer = entry.getValue();
        while ((observer.mState.compareTo(mState) > 0 && !mNewEventOccurred
                && mObserverMap.contains(entry.getKey()))) {
            Event event = downEvent(observer.mState);
            pushParentState(getStateAfter(event));
            observer.dispatchEvent(lifecycleOwner, event);
            popParentState();
        }
    }
}
```

### 感知与分发生命周期

Fragment 的生命周期与添加到的 Parent 是同步的，Lifecycle 组件使用了一个 ReportFragment 来感知 Parent 的生命周期，并分发下去：

```java
public class ComponentActivity extends Activity implements
        LifecycleOwner,
        KeyEventDispatcher.Component {

    @SuppressLint("RestrictedApi")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ReportFragment.injectIfNeededIn(this);
    }
}
```

ReportFragment 的源码非常清晰，直接看就 Vans 了

```java
public class ReportFragment extends Fragment {
    private static final String REPORT_FRAGMENT_TAG = "androidx.lifecycle"
            + ".LifecycleDispatcher.report_fragment_tag";

    public static void injectIfNeededIn(Activity activity) {
        if (Build.VERSION.SDK_INT >= 29) {
            // On API 29+, we can register for the correct Lifecycle callbacks directly
            activity.registerActivityLifecycleCallbacks(
                    new LifecycleCallbacks());
        }
        // Prior to API 29 and to maintain compatibility with older versions of
        // ProcessLifecycleOwner (which may not be updated when lifecycle-runtime is updated and
        // need to support activities that don't extend from FragmentActivity from support lib),
        // use a framework fragment to get the correct timing of Lifecycle events
        android.app.FragmentManager manager = activity.getFragmentManager();
        if (manager.findFragmentByTag(REPORT_FRAGMENT_TAG) == null) {
            manager.beginTransaction().add(new ReportFragment(), REPORT_FRAGMENT_TAG).commit();
            // Hopefully, we are the first to make a transaction.
            manager.executePendingTransactions();
        }
    }

    @SuppressWarnings("deprecation")
    static void dispatch(@NonNull Activity activity, @NonNull Lifecycle.Event event) {
        if (activity instanceof LifecycleRegistryOwner) {
            ((LifecycleRegistryOwner) activity).getLifecycle().handleLifecycleEvent(event);
            return;
        }

        if (activity instanceof LifecycleOwner) {
            Lifecycle lifecycle = ((LifecycleOwner) activity).getLifecycle();
            if (lifecycle instanceof LifecycleRegistry) {
                ((LifecycleRegistry) lifecycle).handleLifecycleEvent(event);
            }
        }
    }

    static ReportFragment get(Activity activity) {
        return (ReportFragment) activity.getFragmentManager().findFragmentByTag(
                REPORT_FRAGMENT_TAG);
    }

    private ActivityInitializationListener mProcessListener;

    private void dispatchCreate(ActivityInitializationListener listener) {
        if (listener != null) {
            listener.onCreate();
        }
    }

    private void dispatchStart(ActivityInitializationListener listener) {
        if (listener != null) {
            listener.onStart();
        }
    }

    private void dispatchResume(ActivityInitializationListener listener) {
        if (listener != null) {
            listener.onResume();
        }
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        dispatchCreate(mProcessListener);
        dispatch(Lifecycle.Event.ON_CREATE);
    }

    @Override
    public void onStart() {
        super.onStart();
        dispatchStart(mProcessListener);
        dispatch(Lifecycle.Event.ON_START);
    }

    @Override
    public void onResume() {
        super.onResume();
        dispatchResume(mProcessListener);
        dispatch(Lifecycle.Event.ON_RESUME);
    }

    @Override
    public void onPause() {
        super.onPause();
        dispatch(Lifecycle.Event.ON_PAUSE);
    }

    @Override
    public void onStop() {
        super.onStop();
        dispatch(Lifecycle.Event.ON_STOP);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        dispatch(Lifecycle.Event.ON_DESTROY);
        // just want to be sure that we won't leak reference to an activity
        mProcessListener = null;
    }

    private void dispatch(@NonNull Lifecycle.Event event) {
        if (Build.VERSION.SDK_INT < 29) {
            // Only dispatch events from ReportFragment on API levels prior
            // to API 29. On API 29+, this is handled by the ActivityLifecycleCallbacks
            // added in ReportFragment.injectIfNeededIn
            dispatch(getActivity(), event);
        }
    }
}
```

如果 SDK < 29 时通过 ReportFragment 进行分发，如果 SDK >= 29 就通过在 Activity 中注册 ReportFragment.LifecycleCallbacks 来分发事件。

```java
public void registerActivityLifecycleCallbacks(
        @NonNull Application.ActivityLifecycleCallbacks callback) {
    synchronized (mActivityLifecycleCallbacks) {
        mActivityLifecycleCallbacks.add(callback);
    }
}
```
