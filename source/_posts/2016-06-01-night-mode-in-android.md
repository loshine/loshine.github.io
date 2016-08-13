---
title: 夜间模式初探
date: 2016-06-01 22:19:13
category: [技术]
tags: [Android]
toc: true
description: Android Support Library 23.2.0 版为我们带来了官方的夜间模式，现在我们可以很容易地为 App 开发夜间模式了。
---

> Android Support Library 23.2.0 版为我们带来了官方的夜间模式，现在我们可以很容易地为 App 开发夜间模式了。

# 如何使用

使用起来非常简单，我们只需要将主题继承其即可

```xml
<!-- parent 为 Theme.AppCompat.DayNight -->
<style name="AppTheme" parent="Theme.AppCompat.DayNight">
    <!-- Blah blah -->
</style>
```

## 应用全局主题

然后我们在程序中调用方法设置模式即可，推荐在 Application 的`onCreate()`中进行设置

```java
AppCompatDelegate.setDefaultNightMode(int mode);
```

它有四个可选值，分别是：

* `MODE_NIGHT_NO`： 使用亮色(light)主题
* `MODE_NIGHT_YES`：使用暗色(dark)主题
* `MODE_NIGHT_AUTO`：根据当前时间自动切换 亮色(light)/暗色(dark)主题
* `MODE_NIGHT_FOLLOW_SYSTEM`(默认选项)：设置为跟随系统，通常为 MODE_NIGHT_NO

## 组件主题

我们也可以为某一个组件设置主题，通过`getDelegate().setLocalNightMode(int mode);`即可。注意如果改变了 Activity 的主题，我们需要调用`recreate()`重启来显示改变后的效果。

# 获取当前主题

## 应用全局主题

和设置相对应，非常简单

```java
AppCompatDelegate.getDefaultNightMode();
```

## 组件主题

如果没有为组件单独设置主题，那么将会获取全局主题，否则获取到组件的主题。

```java
int currentNightMode = getResources().getConfiguration().uiMode
        & Configuration.UI_MODE_NIGHT_MASK;
switch (currentNightMode) {
    case Configuration.UI_MODE_NIGHT_NO:
        // Night mode is not active, we're in day time
    case Configuration.UI_MODE_NIGHT_YES:
        // Night mode is active, we're at night!
    case Configuration.UI_MODE_NIGHT_UNDEFINED:
        // We don't know what mode we're in, assume notnight
}
```

# 属性和资源

对应夜间模式，我们会需要在不同的模式下使用不同的资源文件或不同的属性，此时我们可以新建一个带`-night`后缀的资源文件夹，然后再创建对应的资源文件即可，比如：`drawable-night`、`values-night`等。

此时如果应用切换到了夜间模式，将会自动使用`-night`后缀中对应的资源。

非夜间模式的后缀是`-notnight`，但是因为不是夜间模式就不会使用`-night`里的资源所以一般我们没必要使用这个后缀。

# 主题适配

按照如上设置了之后还可能会出现一些问题如夜间模式下文字颜色还是黑色的所以看不清了（直接给 TextView 设置了`textColor="@color/xxx"`，而比较建议的是直接引用主题属性或者给不同模式设置不同的资源。

如字体颜色一般使用`?android:attr/textColorPrimary`，图标颜色一般使用`?attr/colorControlNormal`等。

# WebView 的主题适配

WebView 因为没有特别的处理，所以我们需要通过加载特殊的 css 来完成夜间模式的适配。通过判断现在处于哪种主题然后切换对应的 css 即可。