---
title: Jetpack SavedState 原理
date: 2020-06-20 14:16:00
category: [技术]
tags: [Android, Jetpack]
toc: true
thumbnail: https://i.loli.net/2020/06/20/IWEt1LnhAvjQo9F.png
---

Android 的 Activity 有着一套 onSaveInstanceState - onRestoreInstanceState 状态保存机制，旨在「系统资源回收」或「配置发生变化」保存状态，为用户提供更好的体验。

在 androidx 下，提供了  SavedState 库帮助 Activity 和 Fragment 处理状态保存和恢复。

<!-- more -->

## 使用 SavedState

可以显式引入 SavedState 库

```groovy
implementation "androidx.savedstate:savedstate:1.0.0"
```

但实际上 appcompat 会引入 activity 的依赖，而 activity 会自动引入 savedstate。

## SavedState 组件

SavedState 是一个非常小的库，总共由四个 class 文件组成。

![package](https://i.loli.net/2020/06/20/GrMv3ZAcYgtN6HX.png)

### SavedStateRegistry.SavedStateProvider

用于标记一个组件需要保存状态，该状态会在以后恢复的时候使用。

```java
public interface SavedStateProvider {
    @NonNull
    Bundle saveState();
}
```

### SavedStateRegistry

管理 SavedStateProvider 的组件，它绑定了其所有者的生命周期（ Activity 或 Fragment）。

每次创建生命周期所有者都会创建一个新的实例

创建注册表的所有者后（例如，在调用 Activity 的 `onCreate(savedInstanceState)` 方法之后），将调用其 `performRestore(state)` 方法，以恢复系统杀死其所有者之前保存的任何状态。

```java
void performRestore(@NonNull Lifecycle lifecycle, @Nullable Bundle savedState) {
    // ...
    if (savedState != null) {
        mRestoredState = savedState.getBundle(SAVED_COMPONENTS_KEY);
    }
    // ...
}
```

每个 SavedStateProvider 都会注册自己的唯一 Key

```java
private SafeIterableMap<String, SavedStateProvider> mComponents = new SafeIterableMap<>();

public void registerSavedStateProvider(@NonNull String key, @NonNull SavedStateProvider provider) {
    SavedStateProvider previous = mComponents.putIfAbsent(key, provider);
    if (previous != null) {
        throw new IllegalArgumentException("SavedStateProvider with the given key is already registered");
    }
}

public void unregisterSavedStateProvider(@NonNull String key) {
    mComponents.remove(key);
}
```

一旦完成注册，就可以通过 `consumeRestoredStateForKey(key)` 获取之前保存的状态。

在 Activity 的 `onSaveInstanceState()` 被调用时，SavedStateRegistry 的 `performSave(outBundle)` 会调用每个已注册的 SavedStateProvider 的 `saveState()` 来保存状态。

```java
void performSave(@NonNull Bundle outBundle) {
    Bundle components = new Bundle();
    if (mRestoredState != null) {
        components.putAll(mRestoredState);
    }
    for (Iterator<Map.Entry<String, SavedStateProvider>> it =
            mComponents.iteratorWithAdditions(); it.hasNext(); ) {
        Map.Entry<String, SavedStateProvider> entry1 = it.next();
        components.putBundle(entry1.getKey(), entry1.getValue().saveState());
    }
    outBundle.putBundle(SAVED_COMPONENTS_KEY, components);
}
```

### SavedStateRegistryController

SavedStateRegistry 的控制器，对 SavedStateRegistry 的两个方法进行了封装，屏蔽了 SavedStateRegistry 的一些细节：

```java
public final class SavedStateRegistryController {
    private final SavedStateRegistryOwner mOwner;
    private final SavedStateRegistry mRegistry;

    public void performRestore(@Nullable Bundle savedState) {
        // ...
        mRegistry.performRestore(lifecycle, savedState);
    }

    public void performSave(@NonNull Bundle outBundle) {
        mRegistry.performSave(outBundle);
    }
}
```

### SavedStateRegistryOwner

定义了一个 SavedStateRegistry 持有者的接口，提供了一个获取 SavedStateRegistry 的方法。ComponentActivity 和 Fragment 都已经实现了该接口。

```java
public interface SavedStateRegistryOwner extends LifecycleOwner {
    @NonNull
    SavedStateRegistry getSavedStateRegistry();
}
```

### SavedState 组件关系

![savedsate](https://i.loli.net/2020/06/20/sUpmQ2n8HXovKNS.png)

## Activity 状态保存

Activity 的状态保存分为 View 状态和成员状态

默认情况下，系统使用 Bundle 实例状态来保存有关 Activity 布局中每个 View 对象的信息（例如，输入到 EditText 中的文本值或 Recyclerview 的滚动位置）。

因此，如果 Activity 实例被销毁并重新创建，则布局状态将恢复为之前的状态，而无需您执行任何代码。（注意，需要恢复状态的 view 需要配置 id ）

这部分逻辑在 Activity 中的 onSaveInstanceState 方法内实现

```java
protected void onSaveInstanceState(@NonNull Bundle outState) {
    outState.putBundle(WINDOW_HIERARCHY_TAG, mWindow.saveHierarchyState());

    outState.putInt(LAST_AUTOFILL_ID, mLastAutofillId);
    Parcelable p = mFragments.saveAllState();
    if (p != null) {
        outState.putParcelable(FRAGMENTS_TAG, p);
    }
    if (mAutoFillResetNeeded) {
        outState.putBoolean(AUTOFILL_RESET_NEEDED, true);
        getAutofillManager().onSaveInstanceState(outState);
    }
    dispatchActivitySaveInstanceState(outState);
}
```

ComponentActivity 实现了 SavedStateRegistryOwner，它的相关源码如下：

```java
public class ComponentActivity extends androidx.core.app.ComponentActivity implements SavedStateRegistryOwner {

    private final SavedStateRegistryController mSavedStateRegistryController =
            SavedStateRegistryController.create(this);
  
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mSavedStateRegistryController.performRestore(savedInstanceState);
        // ...
    }
  
    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        // ...
        //这里先调用父类的 onSaveInstanceState 保存 view 状态
        super.onSaveInstanceState(outState);
        mSavedStateRegistryController.performSave(outState);
    }
  
    @NonNull
    @Override
    public final SavedStateRegistry getSavedStateRegistry() {
        return mSavedStateRegistryController.getSavedStateRegistry();
    }
}
```

ComponentActivity 持有 SavedStateRegistryController 的实例 `mSavedStateRegistryController`，在 onCreate 生命周期方法中调用 controller 的 `performRestore` 查询已保存的状态，在 onSaveInstanceState 中调用 controller 的 `performSave` 保存。

FragmentActivity 在 onSaveInstanceState 中还会对其内部的 fragment 的状态保存，并在 onCreate 中恢复。

```java
final FragmentController mFragments = FragmentController.createController(new HostCallbacks());

@Override
protected void onCreate(@Nullable Bundle savedInstanceState) {
    mFragments.attachHost(null /*parent*/);

    super.onCreate(savedInstanceState);

    // ...
    if (savedInstanceState != null) {
        Parcelable p = savedInstanceState.getParcelable(FRAGMENTS_TAG);
        mFragments.restoreSaveState(p);
        // ...
    }
    // ...
}

@Override
protected void onSaveInstanceState(Bundle outState) {
    super.onSaveInstanceState(outState);
    markFragmentsCreated();
    Parcelable p = mFragments.saveAllState();
    if (p != null) {
        outState.putParcelable(FRAGMENTS_TAG, p);
    }
    // ...
}
```

## Fragment 状态保存

androidx 的 Fragment 使用 FragmentManager 处理 Fragment 的状态保存。

Activity 中调用 FragmentController 的 `saveAllState()` 方法，间接调用 FragmentManager 的实现类 FragmentManagerImpl 的 `saveAllState()`。

```java
Parcelable saveAllState() {
    // ...
    mStateSaved = true;

    // 收集 Active Fragment
    ArrayList<FragmentState> active = mFragmentStore.saveActiveFragments();

    if (active.isEmpty()) {
        if (isLoggingEnabled(Log.VERBOSE)) Log.v(TAG, "saveAllState: no fragments!");
        return null;
    }

    // 构建一个 Added Fragment 的 List
    ArrayList<String> added = mFragmentStore.saveAddedFragments();

    // 保存回退栈
    BackStackState[] backStack = null;
    if (mBackStack != null) {
        // 省略保存操作
    }

    FragmentManagerState fms = new FragmentManagerState();
    fms.mActive = active;
    fms.mAdded = added;
    fms.mBackStack = backStack;
    fms.mBackStackIndex = mBackStackIndex.get();
    if (mPrimaryNav != null) {
        fms.mPrimaryNavActiveWho = mPrimaryNav.mWho;
    }
    return fms;
}
```

其中最重要的是 `mFragmentStore.saveActiveFragments()`，收集 Active 状态的 Fragment 信息。

```java
@NonNull
ArrayList<FragmentState> saveActiveFragments() {
    ArrayList<FragmentState> active = new ArrayList<>(mActive.size());
    for (FragmentStateManager fragmentStateManager : mActive.values()) {
        if (fragmentStateManager != null) {
            Fragment f = fragmentStateManager.getFragment();

            FragmentState fs = fragmentStateManager.saveState();
            active.add(fs);

            if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
                Log.v(TAG, "Saved state of " + f + ": " + fs.mSavedFragmentState);
            }
        }
    }
    return active;
}
```

它最终是调用了 FragmentStateManager 的 `saveState()` 方法保存状态。

```java
@NonNull
FragmentState saveState() {
    FragmentState fs = new FragmentState(mFragment);

    if (mFragment.mState > Fragment.INITIALIZING && fs.mSavedFragmentState == null) {
        fs.mSavedFragmentState = saveBasicState();
        // ...
        } else {
        fs.mSavedFragmentState = mFragment.mSavedFragmentState;
    }
    return fs;
}

private Bundle saveBasicState() {
    Bundle result = new Bundle();

    mFragment.performSaveInstanceState(result);
    // ...

    if (mFragment.mView != null) {
        saveViewState();
    }
    // ...
    return result;
}

void saveViewState() {
    if (mFragment.mView == null) {
        return;
    }
    SparseArray<Parcelable> mStateArray = new SparseArray<>();
    mFragment.mView.saveHierarchyState(mStateArray);
    if (mStateArray.size() > 0) {
        mFragment.mSavedViewState = mStateArray;
    }
}
```

Fragment 的状态保存可以大致分为以下几步：

1. saveState
2. saveBasicState
3. Fragment.performSaveInstanceState
4. saveViewState

而在 Fragment 的 performSaveInstanceState 方法中，会调用 `SavedStateRegistryController.performSave(outState)` 保存自身状态。

然后调用  mChildFragmentManager 的 `saveAllState()` 方法保存子 Fragment 状态。

```java
void performSaveInstanceState(Bundle outState) {
    onSaveInstanceState(outState);
    mSavedStateRegistryController.performSave(outState);
    Parcelable p = mChildFragmentManager.saveAllState();
    if (p != null) {
        outState.putParcelable(FragmentActivity.FRAGMENTS_TAG, p);
    }
}
```

Fragment 的 onCreate 方法中会调用 `restoreChildFragmentState` 恢复子 Fragment 状态。

```java
public void onCreate(@Nullable Bundle savedInstanceState) {
    mCalled = true;
    restoreChildFragmentState(savedInstanceState);
    if (!mChildFragmentManager.isStateAtLeast(Fragment.CREATED)) {
        mChildFragmentManager.dispatchCreate();
    }
}

void restoreChildFragmentState(@Nullable Bundle savedInstanceState) {
    if (savedInstanceState != null) {
        Parcelable p = savedInstanceState.getParcelable(
                FragmentActivity.FRAGMENTS_TAG);
        if (p != null) {
            mChildFragmentManager.restoreSaveState(p);
            mChildFragmentManager.dispatchCreate();
        }
    }
}
```

## ViewModel-SavedState

Jetpack 中使用 MVVM 模式时，UI 的状态通常被 ViewModel 持有并存储。ViewModel-SavedState 就是一个使得使用 ViewModel 时可以非常方便的恢复状态的库。

使用该库时，ViewModel 对象需要有一个参数为 SavedStateHandle 的构造方法，然后在其初始化方法中恢复数据。

### ViewModel-SavedState 组件

#### SavedStateHandle

可以把 saved state 传递给 ViewModel 的类，内部持有保存状态的键值对数据。

这是在 ViewModel 中主要使用的类，我们通常会如下使用它：

```java
class SaveStateViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    val liveDataText: LiveData<TestModel> = savedStateHandle.getLiveData(LIVE_DATE_KEY)
}
```

在调用其 `getLiveData()` 方法的时候，我们就会把该 LiveData 根据 key 存入对应的 map。

```java
public final class SavedStateHandle {
    final Map<String, Object> mRegular;
    private final Map<String, SavingStateLiveData<?>> mLiveDatas = new HashMap<>();

    @NonNull
    public <T> MutableLiveData<T> getLiveData(@NonNull String key,
            @SuppressLint("UnknownNullness") T initialValue) {
        return getLiveDataInternal(key, true, initialValue);
    }

    @NonNull
    private <T> MutableLiveData<T> getLiveDataInternal(
            @NonNull String key,
            boolean hasInitialValue,
            @Nullable T initialValue) {
        MutableLiveData<T> liveData = (MutableLiveData<T>) mLiveDatas.get(key);
        if (liveData != null) {
            return liveData;
        }
        SavingStateLiveData<T> mutableLd;
        // double hashing but null is valid value
        if (mRegular.containsKey(key)) {
            mutableLd = new SavingStateLiveData<>(this, key, (T) mRegular.get(key));
        } else if (hasInitialValue) {
            mutableLd = new SavingStateLiveData<>(this, key, initialValue);
        } else {
            mutableLd = new SavingStateLiveData<>(this, key);
        }
        mLiveDatas.put(key, mutableLd);
        return mutableLd;
    }
}
```

被 SavedStateHandle 持有的 mSavedStateProvider 实现了其数据保存逻辑，把 mRegular 中的数据遍历保存。

```java
private final SavedStateProvider mSavedStateProvider = new SavedStateProvider() {
    @SuppressWarnings("unchecked")
    @NonNull
    @Override
    public Bundle saveState() {
        Set<String> keySet = mRegular.keySet();
        ArrayList keys = new ArrayList(keySet.size());
        ArrayList value = new ArrayList(keys.size());
        for (String key : keySet) {
            keys.add(key);
            value.add(mRegular.get(key));
        }

        Bundle res = new Bundle();
        // "parcelable" arraylists - lol
        res.putParcelableArrayList("keys", keys);
        res.putParcelableArrayList("values", value);
        return res;
    }
};
```

而 mLiveDatas 保存的 SavingStateLiveData，在其内部值变化的时候都会存入 mRegular 中：

```java
static class SavingStateLiveData<T> extends MutableLiveData<T> {
    private String mKey;
    private SavedStateHandle mHandle;

    SavingStateLiveData(SavedStateHandle handle, String key, T value) {
        super(value);
        mKey = key;
        mHandle = handle;
    }

    SavingStateLiveData(SavedStateHandle handle, String key) {
        super();
        mKey = key;
        mHandle = handle;
    }

    @Override
    public void setValue(T value) {
        if (mHandle != null) {
            mHandle.mRegular.put(mKey, value);
        }
        super.setValue(value);
    }

    void detach() {
        mHandle = null;
    }
}
```

除了 `getLiveData`，我们也可以使用 `set` 和 `get` 方法保存或恢复数据。

```java
public <T> void set(@NonNull String key, @Nullable T value) {
    validateValue(value);
    @SuppressWarnings("unchecked")
    MutableLiveData<T> mutableLiveData = (MutableLiveData<T>) mLiveDatas.get(key);
    if (mutableLiveData != null) {
        // it will set value;
        mutableLiveData.setValue(value);
    } else {
        mRegular.put(key, value);
    }
}

public <T> T get(@NonNull String key) {
    return (T) mRegular.get(key);
}
```

#### SavedStateHandleController

实现了 LifecycleEventObserver 的类，在创建的的时候从 SavedStateRegistry 中恢复状态到 SavedStateHandle，再调用 attachToLifecycle 把持有的 SavedStateHandle 内部的 SavedStateProvider 注册到 SavedStateRegistry 中。

```java
final class SavedStateHandleController implements LifecycleEventObserver {

    private final SavedStateHandle mHandle;

    void attachToLifecycle(SavedStateRegistry registry, Lifecycle lifecycle) {
        // ...
        lifecycle.addObserver(this);
        registry.registerSavedStateProvider(mKey, mHandle.savedStateProvider());
    }

    static SavedStateHandleController create(SavedStateRegistry registry, Lifecycle lifecycle,
            String key, Bundle defaultArgs) {
        Bundle restoredState = registry.consumeRestoredStateForKey(key);
        SavedStateHandle handle = SavedStateHandle.createHandle(restoredState, defaultArgs);
        SavedStateHandleController controller = new SavedStateHandleController(key, handle);
        controller.attachToLifecycle(registry, lifecycle);
        tryToAddRecreator(registry, lifecycle);
        return controller;
    }
}
```

#### AbstractSavedStateViewModelFactory

一个实现 ViewModelFactory.KeyedFactory 的 ViewModel Factory ，它会创建一个与实例化的请求的 ViewModel 关联的
SavedStateHandle

```java
public abstract class AbstractSavedStateViewModelFactory extends ViewModelProvider.KeyedFactory {
  
    private final SavedStateRegistry mSavedStateRegistry;
  
    // Default state used when the saved state is empty
    private final Bundle mDefaultArgs;

    @Override
    public final <T extends ViewModel> T create(@NonNull String key, @NonNull Class<T> modelClass) {
        // 读取保存的状态
        Bundle restoredState = mSavedStateRegistry.consumeRestoredStateForKey(key);

        // 创建保存状态的 handle
        SavedStateHandle handle = SavedStateHandle.createHandle(restoredState, mDefaultArgs);

        // ...

        // 创建 viewModel
        T viewmodel = create(key, modelClass, handle);

        // ...

        return viewmodel;
    }
}
```

#### SavedStateViewModelFactory

AbstractSavedStateViewModelFactory 的具体实现

```java
public final class SavedStateViewModelFactory extends AbstractSavedStateVMFactory {

    public SavedStateViewModelFactory(@NonNull Application application,
            @NonNull SavedStateRegistryOwner owner) {
        this(application, owner, null);
    }

    public SavedStateViewModelFactory(@NonNull Application application, @NonNull SavedStateRegistryOwner owner, @Nullable Bundle defaultArgs) {
        mSavedStateRegistry = owner.getSavedStateRegistry();
        mLifecycle = owner.getLifecycle();
        mDefaultArgs = defaultArgs;
        mApplication = application;
        mFactory = ViewModelProvider.AndroidViewModelFactory.getInstance(application);
    }

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
        T viewmodel;
        if (isAndroidViewModel) {
            viewmodel = constructor.newInstance(mApplication, controller.getHandle());
        } else {
            viewmodel = constructor.newInstance(controller.getHandle());
        }
        viewmodel.setTagIfAbsent(TAG_SAVED_STATE_HANDLE_CONTROLLER, controller);
        return viewmodel;
        //...
    }
}
```

它在我们创建 ViewModel 实例的时候被创建:

```java
MyViewModel model = new ViewModelProvider(this).get(MyViewModel.class);
```

ViewModelProvider

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

ComponentActivity 和 Fragment 都实现了 ViewModelStoreOwner，并返回了一个 SavedStateViewModelFactory。

```java
// ComponentActivity
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

// Fragment
@NonNull
@Override
public ViewModelProvider.Factory getDefaultViewModelProviderFactory() {
    if (mFragmentManager == null) {
        throw new IllegalStateException("Can't access ViewModels from detached fragment");
    }
    if (mDefaultFactory == null) {
        mDefaultFactory = new SavedStateViewModelFactory(
                requireActivity().getApplication(),
                this,
                getArguments());
    }
    return mDefaultFactory;
}
```

而调用 ViewModelProvider 的 `get` 方法时，若 ViewModelStore 中没有缓存的 ViewModel，就会调用 SavedStateViewModelFactory 实例 mFactory 的 `create` 方法创建 ViewModel，这一步检查 ViewModel 的构造方法是否有 SavedStateHandle 作为参数，若有就调用构造方法并传入恢复状态的 SavedStateHandle 构造一个 ViewModel。

### 工作流程

![work-flow](https://i.loli.net/2020/06/20/IWEt1LnhAvjQo9F.png)

## 总结

本文从 SavedState 引出了 androidx 中 Activity 和 Fragment 保存和恢复状态的流程，并解析了 ViewModel-SavedState 库的工作原理。在 androidx 的支持下现在 Android 开发者可以非常方便的编写不会丢失状态的界面，以前的各种困难都得到了解决。
