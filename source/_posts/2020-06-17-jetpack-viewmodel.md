---
title: Jetpack ViewModel 原理
date: 2020-06-17 10:55:00
category: [技术]
tags: [Android, Jetpack]
toc: true
thumbnail: https://i.loli.net/2020/06/17/2narzCSBfAsJ7OY.png
---

ViewModel 是 Architecture Components 官方架构组件之一。

ViewModel 类旨在以注重生命周期的方式存储和管理界面相关的数据，它让数据可在发生屏幕旋转等配置更改后继续留存。

<!-- more -->

## 简单示例

实现 ViewModel

```kotlin
class MyViewModel : ViewModel() {
    private val users: MutableLiveData<List<User>> by lazy {
        MutableLiveData().also {
            loadUsers()
        }
    }

    fun getUsers(): LiveData<List<User>> {
        return users
    }

    private fun loadUsers() {
        // Do an asynchronous operation to fetch users.
    }
}
```

 在 Activity 或 Fragment 中使用 ViewModel

```kotlin
class MyActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Create a ViewModel the first time the system calls an activity's onCreate() method.
        // Re-created activities receive the same MyViewModel instance created by the first activity.

        // Use the 'by viewModels()' Kotlin property delegate
        // from the activity-ktx artifact
        val model: MyViewModel by viewModels()
        model.getUsers().observe(this, Observer<List<User>>{ users ->
                // update UI
        })
    }
}
```

如果重新创建了该 Activity，它接收的 MyViewModel 实例与第一个 Activity 创建的实例相同。当所有者 Activity 完成时，框架会调用  ViewModel 对象的 `onCleared()` 方法，以便它清理资源。

> ViewModel 绝不能引用视图、 Lifecycle 或可能存储对 Activity 上下文的引用的任何类。

### ViewModel 妙用

#### Fragment 与 Fragment 通信

Fragment 可以使用其 Activity 范围共享 ViewModel 来处理彼此间的通信。

```kotlin
class SharedViewModel : ViewModel() {
    val selected = MutableLiveData<Item>()

    fun select(item: Item) {
        selected.value = item
    }
}

class MasterFragment : Fragment() {

    private lateinit var itemSelector: Selector

    // Use the 'by activityViewModels()' Kotlin property delegate
    // from the fragment-ktx artifact
    private val model: SharedViewModel by activityViewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        itemSelector.setOnClickListener { item ->
            // Update the UI
        }
    }
}

class DetailFragment : Fragment() {

    // Use the 'by activityViewModels()' Kotlin property delegate
    // from the fragment-ktx artifact
    private val model: SharedViewModel by activityViewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        model.selected.observe(viewLifecycleOwner, Observer<Item> { item ->
                // Update the UI
        })
    }
}
```

#### Activity 与 Fragment 通信

与 Fragment 和 Fragment 通信同理。

## ViewModel 的生命周期

ViewModel 对象存在的时间范围是获取 ViewModel 时传递给 ViewModelProvider 的 Lifecycle。

对 Activity，是 Activity 完成时清除；对 Fragment，时 Fragment 分离时。

![生命周期](https://i.loli.net/2020/06/17/2narzCSBfAsJ7OY.png)

## ViewModel 原理

从获取 ViewModel 实例的方法开始：

```kotlin
val model: MyViewModel by viewModels()
```

或

```java
MyViewModel model = new ViewModelProvider(this).get(MyViewModel.class);
```

Kotlin 版只是对 Java 写法的一个 Lazy Delegate，所以我们从 ViewModelProvider 开始研究即可。

### 构造 ViewModelProvider

获取 ViewModel 的入口首先构造了一个 ViewModelProvider 的实例，然后调用了其 get 方法，我们先看 ViewModelProvider 的构造函数。

```java
public class ViewModelProvider {
    private final Factory mFactory;
    private final ViewModelStore mViewModelStore;

    public ViewModelProvider(@NonNull ViewModelStoreOwner owner) {
        this(owner.getViewModelStore(), owner instanceof HasDefaultViewModelProviderFactory
                ? ((HasDefaultViewModelProviderFactory) owner).getDefaultViewModelProviderFactory()
                : NewInstanceFactory.getInstance());
    }

    public ViewModelProvider(@NonNull ViewModelStoreOwner owner, @NonNull Factory factory) {
        this(owner.getViewModelStore(), factory);
    }

    public ViewModelProvider(@NonNull ViewModelStore store, @NonNull Factory factory) {
        mFactory = factory;
        mViewModelStore = store;
    }
}
```

其构造函数就是初始化了两个成员 `mFactory` 和 `mViewModelStore`，它们分别是 `ViewModelStoreOwner` 和 `ViewModelProvider.Factory` 的实例。

调用构造函数时，我们传入的 AppCompatActivity 或 Fragment 都实现了 `ViewModelStoreOwner` 和 `HasDefaultViewModelProviderFactory`。

```java
public class AppCompatActivity extends FragmentActivity implements ... {
}

public class FragmentActivity extends ComponentsActivity implements ... {
}

public class ComponentActivity extends androidx.core.app.ComponentActivity implements
        LifecycleOwner,
        ViewModelStoreOwner,
        HasDefaultViewModelProviderFactory,
        SavedStateRegistryOwner,
        OnBackPressedDispatcherOwner {
}

public class Fragment implements ComponentCallbacks, OnCreateContextMenuListener, LifecycleOwner,
        ViewModelStoreOwner, HasDefaultViewModelProviderFactory, SavedStateRegistryOwner {
}
```

之后再调用 ViewModelProvider 的 `get()` 方法获取 ViewModel 的实例：

```java
public <T extends ViewModel> T get(@NonNull Class<T> modelClass) {
    String canonicalName = modelClass.getCanonicalName();
    if (canonicalName == null) {
        throw new IllegalArgumentException("Local and anonymous classes can not be ViewModels");
    }
    return get(DEFAULT_KEY + ":" + canonicalName, modelClass);
}

public <T extends ViewModel> T get(@NonNull String key, @NonNull Class<T> modelClass) {
    ViewModel viewModel = mViewModelStore.get(key);

    if (modelClass.isInstance(viewModel)) {
        if (mFactory instanceof OnRequeryFactory) {
            ((OnRequeryFactory) mFactory).onRequery(viewModel);
        }
        return (T) viewModel;
    } else {
        //noinspection StatementWithEmptyBody
        if (viewModel != null) {
            // TODO: log a warning.
        }
    }
    if (mFactory instanceof KeyedFactory) {
        viewModel = ((KeyedFactory) (mFactory)).create(key, modelClass);
    } else {
        viewModel = (mFactory).create(modelClass);
    }
    mViewModelStore.put(key, viewModel);
    return (T) viewModel;
}
```

逻辑非常简单：

1. 从 mViewModelStore 根据 key 获取 ViewModel 缓存;
2. 如果 viewModel 是 modelClass 的实例，mFactory 是 OnRequeryFactory 的实例，就调用 mFactory.onRequery 重新获取 viewModel;
3. 如果 mFactory 是 KeyedFactory 的实例，调用其 create 方法用 key 和 class 构建 ViewModel
4. 否则直接调用 `create` 通过 class 构建 ViewModel
5. 把 viewModel 放进 mViewModelStore 缓存并返回 viewModel。

#### ViewModelStore 和 ViewModelProvider.Factory

ViewModelProvider 的三个构造函数最终都是初始化其 `mFactory` 和 `mViewModelStore`。

下面对这两个成员变量进行分析。

##### ViewModelStore

ViewModelStore 本身是一个非常简单的类，主要作用是缓存 ViewModel。

```java
public class ViewModelStore {

    private final HashMap<String, ViewModel> mMap = new HashMap<>();

    final void put(String key, ViewModel viewModel) {
        ViewModel oldViewModel = mMap.put(key, viewModel);
        if (oldViewModel != null) {
            oldViewModel.onCleared();
        }
    }

    final ViewModel get(String key) {
        return mMap.get(key);
    }

    Set<String> keys() {
        return new HashSet<>(mMap.keySet());
    }

    /**
     *  Clears internal storage and notifies ViewModels that they are no longer used.
     */
    public final void clear() {
        for (ViewModel vm : mMap.values()) {
            vm.clear();
        }
        mMap.clear();
    }
}
```

ComponentActivity 和 Fragment 都实现了 `ViewModelStoreOwner`，它是一个接口，实现它返回一个 `ViewModelStore`。

```java
public interface ViewModelStoreOwner {
    @NonNull
    ViewModelStore getViewModelStore();
}
```

FragmentActivity 覆盖了 ComponentActivity 中的实现：

```java
// FragmentActivity
public ViewModelStore getViewModelStore() {
    if (getApplication() == null) {
        throw new IllegalStateException("Your activity is not yet attached to the "
                + "Application instance. You can't request ViewModel before onCreate call.");
    }
    if (mViewModelStore == null) {
        NonConfigurationInstances nc =
                (NonConfigurationInstances) getLastNonConfigurationInstance();
        if (nc != null) {
            // Restore the ViewModelStore from NonConfigurationInstances
            mViewModelStore = nc.viewModelStore;
        }
        if (mViewModelStore == null) {
            mViewModelStore = new ViewModelStore();
        }
    }
    return mViewModelStore;
}

static final class NonConfigurationInstances {
    Object custom;
    ViewModelStore viewModelStore;
    FragmentManagerNonConfig fragments;
}

@Override
public final Object onRetainNonConfigurationInstance() {
    Object custom = onRetainCustomNonConfigurationInstance();

    FragmentManagerNonConfig fragments = mFragments.retainNestedNonConfig();

    if (fragments == null && mViewModelStore == null && custom == null) {
        return null;
    }

    NonConfigurationInstances nci = new NonConfigurationInstances();
    nci.custom = custom;
    nci.viewModelStore = mViewModelStore;
    nci.fragments = fragments;
    return nci;
}

@Override
protected void onCreate(@Nullable Bundle savedInstanceState) {
    // ...
    super.onCreate(savedInstanceState);

    NonConfigurationInstances nc =
            (NonConfigurationInstances) getLastNonConfigurationInstance();
    if (nc != null && nc.viewModelStore != null && mViewModelStore == null) {
        mViewModelStore = nc.viewModelStore;
    }
    // ...
}
```

根据 Activity 类中 `onRetainNonConfigurationInstance()` 的注释我们知道，该方法在配置改变时我们重建 Activity 中 destroy 原 Activity 的时候会被系统调用。而在 `onCreate` 方法中我们会通过 `getLastNonConfigurationInstance()` 获取到之前 `onRetainNonConfigurationInstance()` 保存的对象，由于 mViewModelStore 会被保存在 NonConfigurationInstances 中，所以旋转屏幕等配置改变的情况我们依然会获得相同的 ViewModelStore。

这个过程是由 ActivityThread 中的 `performDestroyActivity` 方法完成的，它会调用 Activity 的 `retainNonConfigurationInstances` 方法，而该方法会调用 Activity 子类的 `onRetainNonConfigurationInstance()` 方法作为自己的 `NonConfigurationInstances.activity` 保存下来。

```java
static final class NonConfigurationInstances {
    Object activity;
    HashMap<String, Object> children;
    FragmentManagerNonConfig fragments;
    ArrayMap<String, LoaderManager> loaders;
    VoiceInteractor voiceInteractor;
}

@Nullable
public Object getLastNonConfigurationInstance() {
    return mLastNonConfigurationInstances != null
            ? mLastNonConfigurationInstances.activity : null;
}

NonConfigurationInstances retainNonConfigurationInstances() {
    Object activity = onRetainNonConfigurationInstance();
    HashMap<String, Object> children = onRetainNonConfigurationChildInstances();
    FragmentManagerNonConfig fragments = mFragments.retainNestedNonConfig();

    // We're already stopped but we've been asked to retain.
    // Our fragments are taken care of but we need to mark the loaders for retention.
    // In order to do this correctly we need to restart the loaders first before
    // handing them off to the next activity.
    mFragments.doLoaderStart();
    mFragments.doLoaderStop(true);
    ArrayMap<String, LoaderManager> loaders = mFragments.retainLoaderNonConfig();

    if (activity == null && children == null && fragments == null && loaders == null
            && mVoiceInteractor == null) {
        return null;
    }

    NonConfigurationInstances nci = new NonConfigurationInstances();
    nci.activity = activity;
    nci.children = children;
    nci.fragments = fragments;
    nci.loaders = loaders;
    if (mVoiceInteractor != null) {
        mVoiceInteractor.retainInstance();
        nci.voiceInteractor = mVoiceInteractor;
    }
    return nci;
}
```

重建 Activity 的时候，ActivityThread 在 `performLaunchActivity` 中会调用 Activity 的 `attach()` 方法对 mLastNonConfigurationInstances 赋值。

```java
final void attach(Context context, ActivityThread aThread,
        Instrumentation instr, IBinder token, int ident,
        Application application, Intent intent, ActivityInfo info,
        CharSequence title, Activity parent, String id,
        NonConfigurationInstances lastNonConfigurationInstances,
        Configuration config, String referrer, IVoiceInteractor voiceInteractor,
        Window window, ActivityConfigCallback activityConfigCallback, IBinder assistToken) {
    // ...
    mLastNonConfigurationInstances = lastNonConfigurationInstances;
    // ...
}
```

##### ViewModelProvider.Factory

ViewModelProvider.Factory 是工厂模式的实现：

```java
public interface Factory {
    @NonNull
    <T extends ViewModel> T create(@NonNull Class<T> modelClass);
}
```

HasDefaultViewModelProviderFactory 是一个接口，它主要用于标记 ViewModelStoreOwner 有一个可以提供 ViewModelFactory 的方法：

```java
public interface HasDefaultViewModelProviderFactory {
    @NonNull
    ViewModelProvider.Factory getDefaultViewModelProviderFactory();
}
```

该方法在 ComponentActivity 中的实现如下，构造了一个 SavedStateViewModelFactory。

```java
@NonNull
@Override
public ViewModelProvider.Factory getDefaultViewModelProviderFactory() {
    if (getApplication() == null) {
        throw new IllegalStateException("Your activity is not yet attached to the "
                + "Application instance. You can't request ViewModel before onCreate call.");
    }
    if (mDefaultFactory == null) {
        mDefaultFactory = new SavedStateViewModelFactory(
                getApplication(),
                this,
                getIntent() != null ? getIntent().getExtras() : null);
    }
    return mDefaultFactory;
}
```

而 SavedStateViewModelFactory 继承自 ViewModelProvider.KeyedFactory

```java
public final class SavedStateViewModelFactory extends ViewModelProvider.KeyedFactory {

    private final Application mApplication;
    private final ViewModelProvider.AndroidViewModelFactory mFactory;
    private final Bundle mDefaultArgs;
    private final Lifecycle mLifecycle;
    private final SavedStateRegistry mSavedStateRegistry;

    public SavedStateViewModelFactory(@NonNull Application application,
            @NonNull SavedStateRegistryOwner owner,
            @Nullable Bundle defaultArgs) {
        mSavedStateRegistry = owner.getSavedStateRegistry();
        mLifecycle = owner.getLifecycle();
        mDefaultArgs = defaultArgs;
        mApplication = application;
        mFactory = ViewModelProvider.AndroidViewModelFactory.getInstance(application);
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull String key, @NonNull Class<T> modelClass) {
        boolean isAndroidViewModel = AndroidViewModel.class.isAssignableFrom(modelClass);
        Constructor<T> constructor;
        if (isAndroidViewModel) {
            constructor = findMatchingConstructor(modelClass, ANDROID_VIEWMODEL_SIGNATURE);
        } else {
            constructor = findMatchingConstructor(modelClass, VIEWMODEL_SIGNATURE);
        }
        // doesn't need SavedStateHandle
        if (constructor == null) {
            return mFactory.create(modelClass);
        }

        SavedStateHandleController controller = SavedStateHandleController.create(
                mSavedStateRegistry, mLifecycle, key, mDefaultArgs);
        try {
            T viewmodel;
            if (isAndroidViewModel) {
                viewmodel = constructor.newInstance(mApplication, controller.getHandle());
            } else {
                viewmodel = constructor.newInstance(controller.getHandle());
            }
            viewmodel.setTagIfAbsent(TAG_SAVED_STATE_HANDLE_CONTROLLER, controller);
            return viewmodel;
        } catch (IllegalAccessException e) {
            throw new RuntimeException("Failed to access " + modelClass, e);
        } catch (InstantiationException e) {
            throw new RuntimeException("A " + modelClass + " cannot be instantiated.", e);
        } catch (InvocationTargetException e) {
            throw new RuntimeException("An exception happened in constructor of "
                    + modelClass, e.getCause());
        }
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        String canonicalName = modelClass.getCanonicalName();
        if (canonicalName == null) {
            throw new IllegalArgumentException("Local and anonymous classes can not be ViewModels");
        }
        return create(canonicalName, modelClass);
    }
}
```

通过前面的分析我们知道 ViewModelProvider 的 mFactory 是 KeyedFactory 的实例时，会调用其两个参数的 `create()` 方法创建 ViewModel。该方法通过传入的 class 检查是 AndroidViewModel 还是普通 ViewModel 的实例，然后构造对应的实例。

SavedStateViewModelFactory 的作用主要是用于创建可以保存当前页面的数据的 ViewModel。也就是说当我们的页面数据还是保存在页面的时候，我们可以通过该默认工厂，把页面的数据存储到由 SavedStateViewModelFactory 所创建的 ViewModel 中进行保存。

前提是：需要我们的 ViewModel 的最终实现类的构造方法签名和下面的 `ANDROID_VIEWMODEL_SIGNATURE` 或 `VIEWMODEL_SIGNATURE` 一样才会起到上面说的效果：

```java
class SaveStateViewModel(val savedStateHandle: SavedStateHandle) : ViewModel() {

}

private static final Class<?>[] ANDROID_VIEWMODEL_SIGNATURE = new Class[]{Application.class,
            SavedStateHandle.class};
private static final Class<?>[] VIEWMODEL_SIGNATURE = new Class[]{SavedStateHandle.class};
```

否则，就会调用 ViewModelProvider.AndroidViewModelFactory 中的 `create()` 方法去创建 ViewModel 对象。

```java
public static class AndroidViewModelFactory extends ViewModelProvider.NewInstanceFactory {

    private static AndroidViewModelFactory sInstance;

    /**
     * Retrieve a singleton instance of AndroidViewModelFactory.
     *
     * @param application an application to pass in {@link AndroidViewModel}
     * @return A valid {@link AndroidViewModelFactory}
     */
    @NonNull
    public static AndroidViewModelFactory getInstance(@NonNull Application application) {
        if (sInstance == null) {
            sInstance = new AndroidViewModelFactory(application);
        }
        return sInstance;
    }

    private Application mApplication;

    /**
     * Creates a {@code AndroidViewModelFactory}
     *
     * @param application an application to pass in {@link AndroidViewModel}
     */
    public AndroidViewModelFactory(@NonNull Application application) {
        mApplication = application;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (AndroidViewModel.class.isAssignableFrom(modelClass)) {
            //noinspection TryWithIdenticalCatches
            try {
                return modelClass.getConstructor(Application.class).newInstance(mApplication);
            } catch (NoSuchMethodException e) {
                throw new RuntimeException("Cannot create an instance of " + modelClass, e);
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Cannot create an instance of " + modelClass, e);
            } catch (InstantiationException e) {
                throw new RuntimeException("Cannot create an instance of " + modelClass, e);
            } catch (InvocationTargetException e) {
                throw new RuntimeException("Cannot create an instance of " + modelClass, e);
            }
        }
        return super.create(modelClass);
    }
}
```

### ViewModel.onCleared()

ViewModel 同时提供了一个清理资源的方法 `onCleared()`，那么它是什么时候被调用的呢？

```java
public abstract class ViewModel {
    protected void onCleared() {
    }

    @MainThread
    final void clear() {
        mCleared = true;
        if (mBagOfTags != null) {
            synchronized (mBagOfTags) {
                for (Object value : mBagOfTags.values()) {
                    // see comment for the similar call in setTagIfAbsent
                    closeWithRuntimeException(value);
                }
            }
        }
        onCleared();
    }
}
```

很明显它在 `clear()` 方法中被调用。

而 ViewModel 的 `clear()` 则是被 ViewModelStore 的 `clear()` 调用：

```java
public class ViewModelStore {

    private final HashMap<String, ViewModel> mMap = new HashMap<>();

    public final void clear() {
        for (ViewModel vm : mMap.values()) {
            vm.clear();
        }
        mMap.clear();
    }
}
```

追踪该方法发现它在 ComponentActivity 的默认构造中被调用：

```java
public ComponentActivity() {
    Lifecycle lifecycle = getLifecycle();
    //noinspection ConstantConditions
    if (lifecycle == null) {
        throw new IllegalStateException("getLifecycle() returned null in ComponentActivity's "
                + "constructor. Please make sure you are lazily constructing your Lifecycle "
                + "in the first call to getLifecycle() rather than relying on field "
                + "initialization.");
    }
    // ...
    getLifecycle().addObserver(new LifecycleEventObserver() {
        @Override
        public void onStateChanged(@NonNull LifecycleOwner source,
                @NonNull Lifecycle.Event event) {
            if (event == Lifecycle.Event.ON_DESTROY) {
                if (!isChangingConfigurations()) {
                    getViewModelStore().clear();
                }
            }
        }
    });
    // ...
}
```

非常明显就是对生命周期进行了监听，在 `Lifecycle.Event.ON_DESTROY` 被触发的时候调用，清理资源。

## ViewModel 高级使用

### AndroidViewModel

AndroidViewModel 是 ViewModel 的一个子类，它可以在 ViewModel 中获取 Application。

```java
public class AndroidViewModel extends ViewModel {
    @SuppressLint("StaticFieldLeak")
    private Application mApplication;

    public AndroidViewModel(@NonNull Application application) {
        mApplication = application;
    }

    /**
     * Return the application.
     */
    @SuppressWarnings("TypeParameterUnusedInFormals")
    @NonNull
    public <T extends Application> T getApplication() {
        //noinspection unchecked
        return (T) mApplication;
    }
}
```

我们使用时只需要继承它然后实现对应的构造函数即可。

### 保存状态

我们分析源码时发现当 ViewModel 的构造函数满足如下两种情况时：

```java
private static final Class<?>[] ANDROID_VIEWMODEL_SIGNATURE = new Class[]{Application.class,
        SavedStateHandle.class};
private static final Class<?>[] VIEWMODEL_SIGNATURE = new Class[]{SavedStateHandle.class};
```

它会调用对应的构造方法来创建 ViewModel：

```java
SavedStateHandleController controller = SavedStateHandleController.create(
        mSavedStateRegistry, mLifecycle, key, mDefaultArgs);
try {
    T viewmodel;
    if (isAndroidViewModel) {
        viewmodel = constructor.newInstance(mApplication, controller.getHandle());
    } else {
        viewmodel = constructor.newInstance(controller.getHandle());
    }
    viewmodel.setTagIfAbsent(TAG_SAVED_STATE_HANDLE_CONTROLLER, controller);
    return viewmodel;
} catch (IllegalAccessException e) {
    throw new RuntimeException("Failed to access " + modelClass, e);
} catch (InstantiationException e) {
    throw new RuntimeException("A " + modelClass + " cannot be instantiated.", e);
} catch (InvocationTargetException e) {
    throw new RuntimeException("An exception happened in constructor of "
            + modelClass, e.getCause());
}
```

ViewModel 构造器加入 SavedStateHandle 参数，并将想要保存的数据使用该 handle 保存。

```java
class SaveStateViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    val liveDataText: LiveData<TestModel> = savedStateHandle.getLiveData(LIVE_DATE_KEY)
}
```

## 总结

ViewModel 是一个非常方便使用的 Jetpack 架构组件，但小小的一个类却包含了非常精细巧妙的设计，非常值得学习。
