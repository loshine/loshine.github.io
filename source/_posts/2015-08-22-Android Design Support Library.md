---
title: Android Design Support Library
date: 2015-08-22 11:24:30
tags: [Android]
---
Google 在2015的 IO 大会上，给我们带来了更加详细的 Material Design 设计规范，同时，也给我们带来了全新的 Android Design Support Library，在这个 support 库里面，Google 给我们提供了更加规范的 Material design 设计风格的控件。本文将介绍MD设计风格的兼容库以及它们的用法，也是对自己的学习做一个记录。

# 目录

* [使用](#use)
* [组件](#components)
    * [Snackbar](#snackbar)
    * [TextInputLayout](#textinputlayout)
    * [Floating Action Button](#floatingactionbutton)
    * [TabLayout](#tablayout)
    * [NavigationView](#navigationview)
    * [AppBarLayout](#appbarlayout)
    * [CoordinatorLayout](#coordinatorlayout)
    * [CollapsingToolbarLayout](#collapsingtoolbarlayout)
* [总结](#summary)
* [参考](#references)

<h1 id="use">使用</h1>

要使用非常简单，在Gradle中添加如下语句即可

```groovy
compile 'com.android.support:design:23.0.0'
```

<h1 id="components">组件</h1>

<h2 id="snackbar">Snackbar</h2>

Snackbar 提供了一个介于 Toast 和 AlertDialog 之间轻量级控件，它可以很方便的提供消息的提示和动作反馈。*其使用方式与Toast基本相同*。

```java
Snackbar.make(view, "Snackbar comes out", Snackbar.LENGTH_LONG)
                        .setAction("Action", new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {
                                Toast.makeText(
                                        MainActivity.this,
                                        "Toast comes out",
                                        Toast.LENGTH_SHORT).show();
                            }
                        }).show();
```

此处注意传入的第一个 view 是 Snackbar 显示的基准元素，Snackbar 会显示在该 view 的底部位置。Action 可以传入多个，每一个都可以配置点击事件。

显示效果：

![Snackbar](http://7xl94a.com1.z0.glb.clouddn.com/123123.png)

官网API：[Snackbar API][snackbar api]

<h2 id="textinputlayout">TextInputLayout</h2>

通常，单独的 EditText 会在用户输入第一个字母之后隐藏hint提示信息，但是现在你可以使用 TextInputLayout 来将 EditText 包裹起来，提示信息会变成一个显示在 EditText 之上的 floating label，这样用户就始终知道他们现在输入的是什么。同时，如果给 EditText 增加监听，还可以给它增加更多的 floating label。

使用方法：

```xml
<android.support.design.widget.TextInputLayout
        android:id="@+id/til_pwd"
        android:layout_width="match_parent"
        android:layout_height="wrap_content">

        <EditText
            android:layout_width="match_parent"
            android:layout_height="wrap_content"/>

</android.support.design.widget.TextInputLayout>
```

在代码中监听：

```java
TextInputLayout textInputLayout = (TextInputLayout) findViewById(R.id.til_pwd);
EditText editText = textInputLayout.getEditText();
textInputLayout.setHint("Password");

editText.addTextChangedListener(new TextWatcher() {
    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
        if (s.length() > 4) {
            textInputLayout.setError("Password error");
            textInputLayout.setErrorEnabled(true);
        } else {
            textInputLayout.setErrorEnabled(false);
        }
    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
    }

    @Override
    public void afterTextChanged(Editable s) {
    }
});
```

**注意**：TextInputLayout 的颜色来自 style 中的 colorAccent 的颜色：

```xml
<item name="colorAccent">#1743b7</item>
```

显示效果：

![textinputlayout1](http://7xl94a.com1.z0.glb.clouddn.com/20150603224122229.png)

![textinputlayout2](http://7xl94a.com1.z0.glb.clouddn.com/20150603224141620.png)

官网API：[TextInputLayout API][textinputlayout api]

<h2 id="floatingactionbutton">Floating Action Button</h2>

FloatingActionButton 是一个浮动显示的圆形按钮，Design library 中的 FloatingActionButton 实现了一个默认颜色为主题中 colorAccent 的悬浮操作按钮，like this：

![floatingactionbutton](http://7xl94a.com1.z0.glb.clouddn.com/20150604094913153.png)

FloatingActionButton 的使用非常简单，一般将其放入 CoordinatorLayout 中。

```xml
<android.support.design.widget.FloatingActionButton
        android:id="@+id/fab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="end|bottom"
        android:layout_margin="@dimen/fab_margin"
        android:src="@drawable/ic_done"/>
```

通过指定`layout_gravity`就可以指定它的位置。 

同样，你可以通过指定`anchor`，即显示位置的锚点：

```xml
<android.support.design.widget.FloatingActionButton
        android:layout_height="wrap_content"
        android:layout_width="wrap_content"
        app:layout_anchor="@id/app_bar"
        app:layout_anchorGravity="bottom|right|end"
        android:src="@android:drawable/ic_done"
        android:layout_margin="15dp"
        android:clickable="true"/>
```

除了一般大小的悬浮操作按钮，它还支持 mini size（`fabSize="mini"`）。FloatingActionButton 继承自 ImageView，你可以使用`android:src`或者 ImageView 的任意方法，比如`setImageDrawable()`来设置 FloatingActionButton 里面的图标。

官网API：[Floating Action Button][floatingactionbutton api]

<h2 id="tablayout">TabLayout</h2>

TabLayout既实现了**固定的选项卡** - view的宽度平均分配，也实现了**可滚动的选项卡** - view宽度不固定同时可以横向滚动。选项卡可以在程序中动态添加：

```java
TabLayout tabLayout = (TabLayout) findViewById(R.id.tabs);
tabLayout.addTab(tabLayout.newTab().setText("tab1"));
tabLayout.addTab(tabLayout.newTab().setText("tab2"));
tabLayout.addTab(tabLayout.newTab().setText("tab3"));
```

通常 TabLayout 都会和 ViewPager 配合起来使用：

```java
mViewPager = (ViewPager) findViewById(R.id.viewpager);
// 设置 ViewPager 的数据等
setupViewPager();
TabLayout tabLayout = (TabLayout) findViewById(R.id.tabs);
tabLayout.setupWithViewPager(mViewPager);
```

显示效果：

![tablayout](http://7xl94a.com1.z0.glb.clouddn.com/201506041446331510.png)

官网API：[TabLayout API][tablayout api]

<h2 id="navigationview">NavigationView</h2>

NavigationView 主要用于实现滑动显示的导航抽屉，这在 Material Design 中是十分重要的。使用 NavigationView，我们可以这样写导航抽屉了：

```xml
<android.support.v4.widget.DrawerLayout
    android:id="@+id/dl_main_drawer"
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="true">

    <!-- 你的内容布局-->
    <include layout="@layout/navigation_content"/>

    <android.support.design.widget.NavigationView
        android:id="@+id/nv_main_navigation"
        android:layout_width="wrap_content"
        android:layout_height="match_parent"
        android:layout_gravity="start"
        app:headerLayout="@layout/navigation_header"
        app:menu="@menu/drawer_view"/>

</android.support.v4.widget.DrawerLayout>
```

其中最重要的就是这两个属性：`app:headerLayout`和`app:menu`

通过这两个属性，我们可以非常方便的指定导航界面的头布局和菜单布局：

![navigationview](http://7xl94a.com1.z0.glb.clouddn.com/20150604151120067.png)

其中最上面的布局就是`app:headerLayout`所指定的头布局：

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:layout_width="match_parent"
              android:layout_height="200dp"
              android:background="?attr/colorPrimaryDark"
              android:gravity="center"
              android:orientation="vertical"
              android:padding="16dp"
              android:theme="@style/ThemeOverlay.AppCompat.Dark">

    <ImageView
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:layout_marginTop="16dp"
        android:background="@drawable/ic_user"/>

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:gravity="center"
        android:text="XuYisheng"
        android:textAppearance="@style/TextAppearance.AppCompat.Body1"
        android:textSize="20sp"/>

</LinearLayout>
```

而下面的菜单布局，我们可以直接通过 menu 内容自动生成，而不需要我们来指定布局：

```xml
<?xml version="1.0" encoding="utf-8"?>
<menu xmlns:android="http://schemas.android.com/apk/res/android">

    <group android:checkableBehavior="single">
        <item
            android:id="@+id/nav_home"
            android:icon="@drawable/ic_dashboard"
            android:title="CC Talk"/>
        <item
            android:id="@+id/nav_messages"
            android:icon="@drawable/ic_event"
            android:title="HJ Class"/>
        <item
            android:id="@+id/nav_friends"
            android:icon="@drawable/ic_headset"
            android:title="Words"/>
        <item
            android:id="@+id/nav_discussion"
            android:icon="@drawable/ic_forum"
            android:title="Big HJ"/>
    </group>

    <item android:title="Version">
        <menu>
            <item
                android:icon="@drawable/ic_dashboard"
                android:title="Android"/>
            <item
                android:icon="@drawable/ic_dashboard"
                android:title="iOS"/>
        </menu>
    </item>

</menu>
```

你可以通过设置一个`OnNavigationItemSelectedListener`，使用其`setNavigationItemSelectedListener()`来获得元素被选中的回调事件。它可以让你处理选择事件，改变复选框状态，加载新内容，关闭导航菜单，以及其他任何你想做的操作。例如这样：

```java
private void setupDrawerContent(NavigationView navigationView) {
    navigationView.setNavigationItemSelectedListener(
        new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(MenuItem menuItem) {
                menuItem.setChecked(true);
                mDrawerLayout.closeDrawers();
                return true;
            }
        }
    });
}
```

官网API：[NavigationView API][navigationview api]

<h2 id="appbarlayout">AppBarLayout</h2>

AppBarLayout 是一个容器，会把所有放在里面的组件一起作为一个 AppBar。

![appbarlayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604173640997.png)

这里就是把 Toolbar 和 TabLayout 放到了 AppBarLayout 中，让他们当做一个整体作为 AppBar。

```xml
    <android.support.design.widget.AppBarLayout
        android:id="@+id/appbar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:theme="@style/ThemeOverlay.AppCompat.Dark.ActionBar">

        <android.support.v7.widget.Toolbar
            android:id="@+id/toolbar"
            android:layout_width="match_parent"
            android:layout_height="?attr/actionBarSize"
            android:background="?attr/colorPrimary"
            app:popupTheme="@style/ThemeOverlay.AppCompat.Light"/>

        <android.support.design.widget.TabLayout
            android:id="@+id/tabs"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"/>

    </android.support.design.widget.AppBarLayout>
```

官网API：[AppBarLayout API][appbarlayout api]

<h2 id="coordinatorlayout">CoordinatorLayout</h2>

CoordinatorLayout 是这次新添加的一个增强型的 FrameLayout。在 CoordinatorLayout 中，我们可以在 FrameLayout 的基础上完成很多新的操作。

### Floating View

Material Design 的一个新的特性就是增加了很多可悬浮的 View，像我们前面说的 Floating Action Button。我们可以把 FAB 放在任何地方，只需要通过：

```xml
android:layout_gravity="end|bottom"
```

来指定显示的位置。同时，它还提供了`layout_anchor`来供你设置显示坐标的锚点：

```xml
app:layout_anchor="@id/appbar"
```

### 创建滚动

CoordinatorLayout 可以说是这次 support library 更新的重中之重。它从另一层面去控制子 view 之间触摸事件的布局，Design Library 中的很多控件都利用了它。

> 一个很好的例子就是当你将 FloatingActionButton 作为一个子 View 添加进 CoordinatorLayout 并且将 CoordinatorLayout 传递给`Snackbar.make()`，在3.0及其以上的设备上，Snackbar 不会显示在悬浮按钮的上面，而是 FloatingActionButton 利用 CoordinatorLayout 提供的回调方法，在 Snackbar 以动画效果进入的时候自动向上移动让出位置，并且在 Snackbar 动画地消失的时候回到原来的位置，不需要额外的代码。

官方的例子很好的说明了这一点：

```xml
<android.support.design.widget.CoordinatorLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        android:layout_width="match_parent"
        android:layout_height="match_parent">

     <! -- Your Scrollable View -->
    <android.support.v7.widget.RecyclerView
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            app:layout_behavior="@string/appbar_scrolling_view_behavior" />

    <android.support.design.widget.AppBarLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">
            <android.support.v7.widget.Toolbar
                  ...
                  app:layout_scrollFlags="scroll|enterAlways">

            <android.support.design.widget.TabLayout
                  ...
                  app:layout_scrollFlags="scroll|enterAlways">
     </android.support.design.widget.AppBarLayout>
</android.support.design.widget.CoordinatorLayout>
```

其中，一个可以滚动的组件，例如 RecyclerView、ListView（**注意：目前貌似只支持RecyclerView、ListView，如果你用一个ScrollView，是没有效果的**）。如果：

1. 给这个可滚动组件设置了`layout_behavior`
2. 给另一个控件设置了`layout_scrollFlags`

那么，当设置了`layout_behavior`的控件滑动时，就会触发设置了`layout_scrollFlags`的控件发生状态的改变。 

![coordinatorlayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604225906021.gif)

设置的`layout_scrollFlags`有如下几种选项：

* scroll: 所有想滚动出屏幕的 view 都需要设置这个 flag，没有设置这个flag的view将被固定在屏幕顶部。
* enterAlways: 这个 flag 让任意向下的滚动都会导致该view变为可见。
* enterAlwaysCollapsed: 当你的视图已经设置 minHeight 属性又使用此标志时，你的视图只能以最小高度进入，只有当滚动视图到达顶部时才扩大到完整高度。
* exitUntilCollapsed: 向上滚动时收缩 View。

需要注意的是，后面两种模式基本只有在 CollapsingToolbarLayout 才有用，而前面两种模式基本是需要一起使用的，也就是说，这些 flag 的使用场景，基本已经固定了。

例如我们前面例子中的，也就是这种模式：

```xml
app:layout_scrollFlags="scroll|enterAlways"
```

> PS：所有使用 scroll flag 的 view 都必须定义在没有使用 scroll flag 的 view 的前面，这样才能确保所有的 view 从顶部退出，留下固定的元素。

官网API：[CoordinatorLayout][coordinatorlayout]

<h2 id="collapsingtoolbarlayout">CollapsingToolbarLayout</h2>

CollapsingToolbarLayout 提供了一个可以折叠的 Toolbar，这也是 Google+、photos 中的效果。Google 把它做成了一个标准控件，更加方便使用。

这里先看一个例子：

```xml
    <android.support.design.widget.AppBarLayout
        android:id="@+id/appbar"
        android:layout_width="match_parent"
        android:layout_height="@dimen/detail_backdrop_height"
        android:fitsSystemWindows="true"
        android:theme="@style/ThemeOverlay.AppCompat.Dark.ActionBar">

        <android.support.design.widget.CollapsingToolbarLayout
            android:id="@+id/collapsing_toolbar"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:fitsSystemWindows="true"
            app:contentScrim="?attr/colorPrimary"
            app:expandedTitleMarginEnd="64dp"
            app:expandedTitleMarginStart="48dp"
            app:layout_scrollFlags="scroll|exitUntilCollapsed">

            <ImageView
                android:id="@+id/backdrop"
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:fitsSystemWindows="true"
                android:scaleType="centerCrop"
                android:src="@drawable/ic_banner"
                app:layout_collapseMode="parallax"/>

            <android.support.v7.widget.Toolbar
                android:id="@+id/toolbar"
                android:layout_width="match_parent"
                android:layout_height="?attr/actionBarSize"
                app:layout_collapseMode="pin"
                app:popupTheme="@style/ThemeOverlay.AppCompat.Light"/>

        </android.support.design.widget.CollapsingToolbarLayout>

    </android.support.design.widget.AppBarLayout>
```

我们在 CollapsingToolbarLayout 中放置了一个 ImageView 和一个 Toolbar。并把这个 CollapsingToolbarLayout 放到 AppBarLayout 中作为一个整体。在 CollapsingToolbarLayout 中，我们分别设置了 ImageView 和一个 Toolbar 的`layout_collapseMode`。

这里使用了 CollapsingToolbarLayout 的`app:layout_collapseMode="pin"`来确保 Toolbar 在 view 折叠的时候仍然被固定在屏幕的顶部。当你让 CollapsingToolbarLayout 和 Toolbar 在一起使用的时候，title 会在展开的时候自动变得大些，而在折叠的时候让字体过渡到默认值。必须注意，在这种情况下你必须在 CollapsingToolbarLayout 上调用`setTitle()`，而不是在 Toolbar 上。

除了固定住 view，你还可以使用`app:layout_collapseMode="parallax"`（以及使用`app:layout_collapseParallaxMultiplier="0.7"`来设置视差因子）来实现视差滚动效果（比如 CollapsingToolbarLayout 里面的一个 ImageView），这中情况和 CollapsingToolbarLayout 的`app:contentScrim="?attr/colorPrimary"`属性一起配合更完美。

在这个例子中，我们同样设置了：

```xml
app:layout_scrollFlags="scroll|exitUntilCollapsed">
```

来接收一个：

```xml
app:layout_behavior="@string/appbar_scrolling_view_behavior">
```

这样才能产生滚动效果，而通过`layout_collapseMode`，我们就设置了滚动时内容的变化效果。

![CollapsingToolbarLayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604230018928.gif)

### CoordinatorLayout与自定义view

有一件事情必须注意，那就是 CoordinatorLayout 并不知道 FloatingActionButton 或者 AppBarLayout 的内部工作原理，它只是以`Coordinator.Behavior`的形式提供了额外的 API，该 API 可以使子 View 更好的控制触摸事件与手势以及声明它们之间的依赖，并通过`onDependentViewChanged()`接收回调。

可以使用`CoordinatorLayout.DefaultBehavior(你的View.Behavior.class)`注解或者在布局中使用`app:layout_behavior="com.example.app.你的View$Behavior"`属性来定义view的默认行为。framework让任意view和CoordinatorLayout结合在一起成为了可能。

官方API：[CollapsingToolbarLayout][collapsingtoolbarlayout]

<h2 id="summary">总结</h2>

研究了一整天的 Android Design Support Library，感觉还是非常强大的。虽然自定义性不是很强，但已经给开发者提供了很简单方便的 Material Design 的官方实现，也不用集成很多的第三方库了，还是很不错的，推荐大家在自己的项目中使用。

<h2 id="references">参考</h2>

Thanks to [《Android Design Support Library使用详解》][article]


[snackbar api]: http://developer.android.com/reference/android/support/design/widget/Snackbar.html
[textinputlayout api]: http://developer.android.com/reference/android/support/design/widget/TextInputLayout.html
[floatingactionbutton api]: http://developer.android.com/reference/android/support/design/widget/FloatingActionButton.html
[tablayout api]: http://developer.android.com/reference/android/support/design/widget/TabLayout.html
[navigationview api]: http://developer.android.com/intl/zh-cn/reference/android/support/design/widget/NavigationView.html
[appbarlayout api]: http://developer.android.com/reference/android/support/design/widget/AppBarLayout.html
[coordinatorlayout]: http://developer.android.com/reference/android/support/design/widget/CoordinatorLayout.html
[collapsingtoolbarlayout]: http://developer.android.com/reference/android/support/design/widget/CollapsingToolbarLayout.html
[article]: http://blog.csdn.net/eclipsexys/article/details/46349721