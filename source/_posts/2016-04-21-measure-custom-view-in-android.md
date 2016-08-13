---
title: Anroid中的自定义View测量
date: 2016-04-22 00:51:22
category: [技术]
tags: [Android]
toc: true
description: 在《Android中的自定义View绘制》中，我们了解了如何使用 Paint、Cavans 等类来绘制 View，但当时的例子中，所有的自定义 View 如果不指定为特定的大小，都是直接占满父容器的。那么我们这篇文章就主要讲解如何测量自定义 View 的大小并对 wrap_content 进行处理。
---

> 之前已经讲过了 Android 中 View 的绘制流程，上次主要讲的是`onDraw`方法，这次主要讲的就是在`onMeasure`方法中对 View 的大小进行测量。

# 理解 MeasureSpec

要了解如何在`onMeasure`方法中对 View 进行测量，我们首先需要了解的就是`onMeasure`方法传入的两个 int 值：**widthMeasureSpec** 和 **heightMeasureSpec**。

它们都是32位的 int 值，高2位代表 SpecMode(测量模式)，低30位代表 SpecSize(对应模式下的测量大小)。通过以下的代码我们可以了解到 MeasureSpec 的原理：

```java
private static final int MODE_SHIFT = 30; // Mode 的移位(高2位也就是左移30位)
// 以下四个都是 Mode 常量
private static final int MODE_MASK = 0x3 << MODE_SHIFT;
private static final int UNSPECIFIED = 0 << MODE_SHIFT;
private static final int EXACTLY = 1 << MODE_SHIFT;
private static final int AT_MOST = 2 << MODE_SHIFT;

// 该方法用于组装 MeasureSpec，其中 sUseBrokenMakeMeasureSpec 是一个兼容参数，如果为 true 时可能会出错(sdk19之后默认走底下的逻辑)
public static int makeMeasureSpec(int size, int mode) {
	if (sUseBrokenMakeMeasureSpec) {
		return size + mode;
	} else {
		return (size & ~MODE_MASK) | (mode & MODE_MASK);
	}
}

// 获取 Mode
public static int getMode(int measureSpec) {
	return (measureSpec & MODE_MASK);
}

// 获取 Size
public static int getSize(int measureSpec) {
	return (size & ~MODE_MASK);
}
```

> 因为 Android 中会有大量的 View 存在，所以必然会有很多 MeasureSpec，如果将 MeasureSpec 封装成一个对象必然会造成大量的对象内存分配，这也不难理解为什么要将其包装成一个 int 了。

## SpecMode

SpecMode 有三类，我们在前面的代码定义中看到了有五个常量，其中两个是作为工具存在的（MODE_SHIFT 和 MODE_MASK），另外三个就是 SpecMode 了。

### UNSPECIFIED

该模式下父容器不对 View 的大小有任何限制，一般不做处理。

### EXACTLY

父容器已经检测出 View 所需要的精确大小，此时 View 的最终大小就是 SpecSize 指定的大小。

对应 LayoutParams 中`match_parent`以及具体数值。

### AT_MOST

父容器指定了一个 SpecSize，View 不能大于这个值。

它对应于 LayoutParams 中的`wrap_content`。

# 与 Layout_Params 的关系

在 View 测量的时候，会将 Layout_Params 在父容器的约束下转换成对应的 MeasureSpec，然后根据这个 MeasureSpec 确认 View 测量后的宽高。一旦 MeasureSpec 确认了，在`onMesure`中就可以确认 View 的测量宽高了。

* match_parent: 对应 EXACTLY
* 精确值: 对应 EXACTLY
* wrap_content: 对应 AT_MOST

# measure 过程

measure 过程要分为 View 和 ViewGroup，它们的测量是不同的

## View

由其`measure`方法完成，该方法是`final`关键字修饰的，无法重写。但`measure`会调用`onMeasure`，所以只需要看`onMeasure`如何实现即可。

```java
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
	setMeasureDimension(getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec), getDefaultSize(getSuggestedMinimumHeight(), HeightMeasureSpec));
}

public static int getDefaultSize(int size, int measureSpec) {
	int result = size;
	int specMode = MeasureSpec.getMode(measureSpec);
	int specSize = MeasureSpec.getSize(measureSpec);
	
	switch (specMode) {
		case MeasureSpec.UNSPECIFIED:
			result = size;
			break;
		case MeasureSpec.ATMOST:
		case MeasureSpec.EXACTLY:
			result = specSize;
			break;
	}
	
	return result;
}

protected int getSuggestedMinimumWidth() {
	return (mBackground ==  null) ? mMinWidth : max(mMinWidth, mBackground.getMinimumWidth());
}

protected int getSuggestedMinimumHeight() {
	return (mBackground ==  null) ? mMinHeight : max(mMinHeight, mBackground.getMinimumHeight());
}
```

其逻辑很简单，`getDefaultSize`方法中可以看出，View 的宽高由 SpecSize 决定。于是我们知道：直接继承 View 的自定义控件需要重写`onMeasure`方法并设置`wrap_content`时的自身大小，否则使用`wrap_content`属性是无效的(等同于`match_parent`)。

所以我们可以这样实现来使得`wrap_content`生效：

```java
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {

    int widthSpecMode = MeasureSpec.getMode(widthMeasureSpec);
    int widthSpecSize = MeasureSpec.getSize(widthMeasureSpec);

    int heightSpecMode = MeasureSpec.getMode(heightMeasureSpec);
    int heightSpecSize = MeasureSpec.getSize(heightMeasureSpec);

    int realWidth = widthSpecMode == MeasureSpec.AT_MOST ? mWidth : widthSpecSize;
    int realHeight = heightSpecMode == MeasureSpec.AT_MOST ? mHeight : heightSpecSize;

    setMeasuredDimension(realWidth, realHeight);
}
```

在如上代码中我们只需要指定默认最小时的`mWidth`,`mHeight`即可(`wrap_content`的默认宽高)，其它模式下交给系统测量即可。

> 需要注意的是`onMeasure`方法中获取到的测量宽高并不一定就是控件的最终宽高，比如 RelativeLayout 中的控件会有多次测量，LinearLayout 中的子控件如果设置了`weight`也会有多次测量，那么第一次`onMeasure`的就不会准了。

## ViewGroup

其实就是在测量自己的宽高之后还会调用`measureChildren`来遍历子控件并且测量子控件的大小。

```java
protected void measureChildren(int widthMeasureSpec, int heightMeasureSpec) {
	final int size = mChildrenCount;
	final View[] children = mChildren;
	for (int i = 0; i < size; ++i) {
		final View child = children[i];
		if ((child.mViewFlags & VISIBILITY_MASK) != GONE) {
			measureChild(child, widthMeasureSpec, heightMeasureSpec);
		}
	}
}

protected void measureChild(View child, int parentWidthMeasureSpec,  
         int parentHeightMeasureSpec) {  
	final LayoutParams lp = child.getLayoutParams();
	
	final int childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec, 
			mPaddingLeft + mPaddingRight, lp.width);  
	final int childHeightMeasureSpec = getChildMeasureSpec(parentHeightMeasureSpec, 
			mPaddingTop + mPaddingBottom, lp.height);
	
	child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
}
```

ViewGroup 是一个抽象类，其`onMeasure`方法是没有具体实现的，所以我们继承 ViewGroup 必须重写`onMeasure`，重写该方法需要进行的步骤如下：

1. 调用`super.onMeasure(widthMeasureSpec, heightMeasureSpec)`处理非`wrap_content`的情况
2. 单独处理`wrap_content`，即 SpecMode 为`AT_MOST`的情况
3. 遍历子 View，并测量子 View

测量子 View 我们可以使用这几个方法

```java
// 使用子view自身的测量方法
subView.measure(int wSpec, int hSpec);

// ViewGroup 的测量子 View 方法
// 某一个子view，多宽，多高, 内部加上了 viewGroup 的 padding 值
measureChild(subView, int wSpec, int hSpec); 
// 所有子view 都是 多宽，多高, 内部调用了 measureChild 方法
measureChildren(int wSpec, int hSpec);
// 某一个子view，多宽，多高, 内部加上了 viewGroup 的 padding 值、margin 值和传入的宽高 wUsed、hUsed
measureChildWithMargins(subView, intwSpec, int wUsed, int hSpec, int hUsed); 

```

# 总结

View 的测量基本就是如上所述了，自定义 View 需要重写`onMeasure`方法并对`wrap_content`进行特殊处理，其实说起来需要做的并不多，但原理还是满复杂的，全部了解了之后还是觉得学到了不少东西。