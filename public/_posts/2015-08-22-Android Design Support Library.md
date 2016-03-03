---
layout: post
title:  "Android Design Support Library"
date:   2015-08-22 11:24:30
categories: [Android]
tags: [Android]
---
> Google在2015的IO大会上，给我们带来了更加详细的Material Design设计规范，同时，也给我们带来了全新的Android Design Support Library，在这个support库里面，Google给我们提供了更加规范的MD设计风格的控件。本文将介绍MD设计风格的兼容库以及它们的用法，也是对自己的学习做一个记录。

##目录

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

<br>

<h2 id="use">使用</h2>

要使用非常简单，在Gradle中添加如下语句即可

{% highlight groovy %}
compile 'com.android.support:design:23.0.0'
{% endhighlight %}

<br>

<h2 id="components">组件</h2>

<h3 id="snackbar">Snackbar</h3>

Snackbar提供了一个介于Toast和AlertDialog之间轻量级控件，它可以很方便的提供消息的提示和动作反馈。*其使用方式与Toast基本相同*。

{% highlight java %}
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
{% endhighlight %}

此处注意传入的第一个view是Snackbar显示的基准元素，Snackbar会显示在该view的底部位置。Action可以传入多个，每一个都可以配置点击事件。

显示效果：

![Snackbar](http://7xl94a.com1.z0.glb.clouddn.com/123123.png)

官网API：[Snackbar API][snackbar api]

<br>

<h3 id="textinputlayout">TextInputLayout</h3>

通常，单独的EditText会在用户输入第一个字母之后隐藏hint提示信息，但是现在你可以使用TextInputLayout来将EditText包裹起来，提示信息会变成一个显示在EditText之上的floating label，这样用户就始终知道他们现在输入的是什么。同时，如果给EditText增加监听，还可以给它增加更多的floating label。

使用方法：

{% highlight xml %}
<android.support.design.widget.TextInputLayout
        android:id="@+id/til_pwd"
        android:layout_width="match_parent"
        android:layout_height="wrap_content">

        <EditText
            android:layout_width="match_parent"
            android:layout_height="wrap_content"/>

</android.support.design.widget.TextInputLayout>
{% endhighlight %}

在代码中监听：

{% highlight java %}
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
{% endhighlight %}

**注意**：TextInputLayout的颜色来自style中的colorAccent的颜色：

{% highlight xml %}
<item name="colorAccent">#1743b7</item>
{% endhighlight %}

显示效果：

![textinputlayout1](http://7xl94a.com1.z0.glb.clouddn.com/20150603224122229.png)

![textinputlayout2](http://7xl94a.com1.z0.glb.clouddn.com/20150603224141620.png)

官网API：[TextInputLayout API][textinputlayout api]

<br>

<h3 id="floatingactionbutton">Floating Action Button</h3>

FloatingActionButton是一个浮动显示的圆形按钮，Design library中的FloatingActionButton实现了一个默认颜色为主题中colorAccent的悬浮操作按钮，like this：

![floatingactionbutton](http://7xl94a.com1.z0.glb.clouddn.com/20150604094913153.png)

FloatingActionButton的使用非常简单，一般将其放入CoordinatorLayout中。

{% highlight xml %}
<android.support.design.widget.FloatingActionButton
        android:id="@+id/fab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="end|bottom"
        android:layout_margin="@dimen/fab_margin"
        android:src="@drawable/ic_done"/>
{% endhighlight %}

通过指定`layout_gravity`就可以指定它的位置。 

同样，你可以通过指定`anchor`，即显示位置的锚点：

{% highlight xml %}
<android.support.design.widget.FloatingActionButton
        android:layout_height="wrap_content"
        android:layout_width="wrap_content"
        app:layout_anchor="@id/app_bar"
        app:layout_anchorGravity="bottom|right|end"
        android:src="@android:drawable/ic_done"
        android:layout_margin="15dp"
        android:clickable="true"/>
{% endhighlight %}

除了一般大小的悬浮操作按钮，它还支持mini size（`fabSize="mini"`）。FloatingActionButton继承自ImageView，你可以使用`android:src`或者ImageView的任意方法，比如`setImageDrawable()`来设置FloatingActionButton里面的图标。

官网API：[Floating Action Button][floatingactionbutton api]

<br>

<h3 id="tablayout">TabLayout</h3>

TabLayout既实现了**固定的选项卡** - view的宽度平均分配，也实现了**可滚动的选项卡** - view宽度不固定同时可以横向滚动。选项卡可以在程序中动态添加：

{% highlight java %}
TabLayout tabLayout = (TabLayout) findViewById(R.id.tabs);
tabLayout.addTab(tabLayout.newTab().setText("tab1"));
tabLayout.addTab(tabLayout.newTab().setText("tab2"));
tabLayout.addTab(tabLayout.newTab().setText("tab3"));
{% endhighlight %}

通常TabLayout都会和ViewPager配合起来使用：

{% highlight java %}
mViewPager = (ViewPager) findViewById(R.id.viewpager);
// 设置ViewPager的数据等
setupViewPager();
TabLayout tabLayout = (TabLayout) findViewById(R.id.tabs);
tabLayout.setupWithViewPager(mViewPager);
{% endhighlight %}

显示效果：

![tablayout](http://7xl94a.com1.z0.glb.clouddn.com/201506041446331510.png)

官网API：[TabLayout API][tablayout api]

<br>

<h3 id="navigationview">NavigationView</h3>

NavigationView主要用于实现滑动显示的导航抽屉，这在Material Design中是十分重要的。使用NavigationView，我们可以这样写导航抽屉了：

{% highlight xml %}
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
{% endhighlight %}

其中最重要的就是这两个属性：`app:headerLayout`和`app:menu`

通过这两个属性，我们可以非常方便的指定导航界面的头布局和菜单布局：

![navigationview](http://7xl94a.com1.z0.glb.clouddn.com/20150604151120067.png)

其中最上面的布局就是`app:headerLayout`所指定的头布局：

{% highlight xml %}
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
{% endhighlight %}

而下面的菜单布局，我们可以直接通过menu内容自动生成，而不需要我们来指定布局：

{% highlight xml %}
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
{% endhighlight %}

你可以通过设置一个`OnNavigationItemSelectedListener`，使用其`setNavigationItemSelectedListener()`来获得元素被选中的回调事件。它可以让你处理选择事件，改变复选框状态，加载新内容，关闭导航菜单，以及其他任何你想做的操作。例如这样：

{% highlight java %}
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
{% endhighlight %}

官网API：[NavigationView API][navigationview api]

<br>

<h3 id="appbarlayout">AppBarLayout</h3>

AppBarLayout是一个容器，会把所有放在里面的组件一起作为一个AppBar。

![appbarlayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604173640997.png)

这里就是把Toolbar和TabLayout放到了AppBarLayout中，让他们当做一个整体作为AppBar。

{% highlight xml %}
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
{% endhighlight %}

官网API：[AppBarLayout API][appbarlayout api]

<br>

<h3 id="coordinatorlayout">CoordinatorLayout</h3>

CoordinatorLayout是这次新添加的一个增强型的FrameLayout。在CoordinatorLayout中，我们可以在FrameLayout的基础上完成很多新的操作。

####Floating View

Material Design的一个新的特性就是增加了很多可悬浮的View，像我们前面说的Floating Action Button。我们可以把FAB放在任何地方，只需要通过：

{% highlight xml %}
android:layout_gravity="end|bottom"
{% endhighlight %}

来指定显示的位置。同时，它还提供了`layout_anchor`来供你设置显示坐标的锚点：

{% highlight xml %}
app:layout_anchor="@id/appbar"
{% endhighlight %}

####创建滚动

CoordinatorLayout可以说是这次support library更新的重中之重。它从另一层面去控制子view之间触摸事件的布局，Design library中的很多控件都利用了它。

> 一个很好的例子就是当你将FloatingActionButton作为一个子View添加进CoordinatorLayout并且将CoordinatorLayout传递给`Snackbar.make()`，在3.0及其以上的设备上，Snackbar不会显示在悬浮按钮的上面，而是FloatingActionButton利用CoordinatorLayout提供的回调方法，在Snackbar以动画效果进入的时候自动向上移动让出位置，并且在Snackbar动画地消失的时候回到原来的位置，不需要额外的代码。

官方的例子很好的说明了这一点：

{% highlight xml %}
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
{% endhighlight %}

其中，一个可以滚动的组件，例如RecyclerView、ListView（**注意：目前貌似只支持RecyclerView、ListView，如果你用一个ScrollView，是没有效果的**）。如果：

1. 给这个可滚动组件设置了`layout_behavior`
2. 给另一个控件设置了`layout_scrollFlags`

那么，当设置了`layout_behavior`的控件滑动时，就会触发设置了`layout_scrollFlags`的控件发生状态的改变。 

![coordinatorlayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604225906021.gif)

设置的`layout_scrollFlags`有如下几种选项：

* scroll: 所有想滚动出屏幕的view都需要设置这个flag，没有设置这个flag的view将被固定在屏幕顶部。
* enterAlways: 这个flag让任意向下的滚动都会导致该view变为可见。
* enterAlwaysCollapsed: 当你的视图已经设置minHeight属性又使用此标志时，你的视图只能以最小高度进入，只有当滚动视图到达顶部时才扩大到完整高度。
* exitUntilCollapsed: 向上滚动时收缩View。

需要注意的是，后面两种模式基本只有在CollapsingToolbarLayout才有用，而前面两种模式基本是需要一起使用的，也就是说，这些flag的使用场景，基本已经固定了。

例如我们前面例子中的，也就是这种模式：

{% highlight xml %}
app:layout_scrollFlags="scroll|enterAlways"
{% endhighlight %}

> PS：所有使用scroll flag的view都必须定义在没有使用scroll flag的view的前面，这样才能确保所有的view从顶部退出，留下固定的元素。

官网API：[CoordinatorLayout][coordinatorlayout]

<br>

<h3 id="collapsingtoolbarlayout">CollapsingToolbarLayout</h3>

CollapsingToolbarLayout提供了一个可以折叠的Toolbar，这也是Google+、photos中的效果。Google把它做成了一个标准控件，更加方便使用。

这里先看一个例子：

{% highlight xml %}
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
{% endhighlight %}

我们在CollapsingToolbarLayout中放置了一个ImageView和一个Toolbar。并把这个CollapsingToolbarLayout放到AppBarLayout中作为一个整体。在CollapsingToolbarLayout中，我们分别设置了ImageView和一个Toolbar的`layout_collapseMode`。

这里使用了CollapsingToolbarLayout的`app:layout_collapseMode="pin"`来确保Toolbar在view折叠的时候仍然被固定在屏幕的顶部。当你让CollapsingToolbarLayout和Toolbar在一起使用的时候，title会在展开的时候自动变得大些，而在折叠的时候让字体过渡到默认值。必须注意，在这种情况下你必须在CollapsingToolbarLayout上调用`setTitle()`，而不是在Toolbar上。

除了固定住view，你还可以使用`app:layout_collapseMode="parallax"`（以及使用`app:layout_collapseParallaxMultiplier="0.7"`来设置视差因子）来实现视差滚动效果（比如CollapsingToolbarLayout里面的一个ImageView），这中情况和CollapsingToolbarLayout的`app:contentScrim="?attr/colorPrimary"`属性一起配合更完美。

在这个例子中，我们同样设置了：

{% highlight xml %}
app:layout_scrollFlags="scroll|exitUntilCollapsed">
{% endhighlight %}

来接收一个：

{% highlight xml %}
app:layout_behavior="@string/appbar_scrolling_view_behavior">
{% endhighlight %}

这样才能产生滚动效果，而通过`layout_collapseMode`，我们就设置了滚动时内容的变化效果。

![CollapsingToolbarLayout](http://7xl94a.com1.z0.glb.clouddn.com/20150604230018928.gif)

####CoordinatorLayout与自定义view

有一件事情必须注意，那就是CoordinatorLayout并不知道FloatingActionButton或者AppBarLayout的内部工作原理，它只是以`Coordinator.Behavior`的形式提供了额外的API，该API可以使子View更好的控制触摸事件与手势以及声明它们之间的依赖，并通过`onDependentViewChanged()`接收回调。

可以使用`CoordinatorLayout.DefaultBehavior(你的View.Behavior.class)`注解或者在布局中使用`app:layout_behavior="com.example.app.你的View$Behavior"`属性来定义view的默认行为。framework让任意view和CoordinatorLayout结合在一起成为了可能。

官方API：[CollapsingToolbarLayout][collapsingtoolbarlayout]

<br>

<h3 id="summary">总结</h3>

研究了一整天的Android Design Support Library，感觉还是非常强大的。虽然自定义性不是很强，但已经给开发者提供了很简单方便的Material Design的官方实现，也不用集成很多的第三方库了，还是很不错的，推荐大家在自己的项目中使用。

<br>

<h3 id="references">参考</h3>

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