---
title: 自定义View之自定义属性
date: 2016-08-13 22:32:31
category: [技术]
tags: [Android]
toc: true
description: 在之前我们学会了自定义 View 的测量和绘制，那么接下来我们需要在布局文件中给它设置一些自定义属性以个性化控件——如我希望第一个该控件是蓝色的，但希望另一个是红色的。这个时候我们就需要在布局文件中定义属性了，本文就记录一下如何获取并使用自定义属性。
---

# 定义一个控件

我们先画一个简单的圆形 View，在`onDraw`中绘制。

```java
public class CircleView extends View {

    private Paint mPaint;

    public CircleView(Context context) {
        super(context);
        init();
    }

    public CircleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public CircleView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public CircleView(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
        init();
    }

    private void init() {
        mPaint = new Paint();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawCircle(100, 100, 100, mPaint);
    }
}
```

然后在布局文件中使用：

```xml
    <io.github.loshine.customview.view.CircleView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
```

然后我们就可以在 preview 窗口中看到效果了

![](http://7xl94a.com1.z0.glb.clouddn.com/blog-attr-circle-1.png)

一个很简单的黑色的圆形

# 定义需要的属性

现在我觉得黑色不好看了，我想给它换个颜色，那么一般来说可以用`Paint.setColor(int color)`来修改为其它的颜色。但这会让所有的 CircleView 都变成另一个颜色。

但我可能希望在一个 Activity 里的 CircleView 是红色，但在另一个中的是蓝色。

此时我们就需要给该 View 自定义属性了。

自定义属性就类似 TextView 的`android:text="xxx"`，ImageView 的`android:src="@drawable/xxx"`，可以给相同类型的 View 设置不同的属性展示不同的效果。

这里我们定义一个 color 属性。

## 声明属性名称

在`res/values`文件夹下新建一个资源文件，叫 attrs.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <declare-styleable name="CircleView">
        <attr name="circle_color" format="color" />
    </declare-styleable>
</resources>
```

这样就完成了属性名称的声明。

`declare-styleable`的 name 必须要对应 View 的类名，`attr`标签中定义的就是需要自定义的属性名称和类型。

我们有这几种类型：

* boolean
* color
* dimension
* enum
* flag
* float
* fraction
* integer
* reference
* string

声明完成之后就可以在代码中根据对应的方法获取布局中使用的自定义属性了。

# 获取属性

## 构造方法

我们在自定义 View 的时候 IDE 通常会提醒我们需要拥有构造函数，然后我们使用其智能提醒会发现有四个构造函数供我们选择：

```java
public View(Context context);
public View(Context context, AttributeSet attrs);
public View(Context context, AttributeSet attrs, int defStyleAttr);
public View(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes)
```

查看源码注释，我们知道这四个方法分别对应不同方式创建 View：

* `View(context)`：直接在代码中 new 出来
* `View(context, attrs)`：当 View 是从布局文件 inflate 出来的时候会调用这个构造方法，使用默认的 style 和 theme。
* `View(context, attrs, defStyleAttr)`：该方法不会被系统直接调用，我们需要手动调用。该方法相比第二个方法多了一个默认 style 的参数，它的作用就是为 View 提供一个基本的样式。
* `View(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes)`：将资源文件中定义的某个样式作为默认样式。

我们在实现自定义 View 的时候，通常至少有两个构造方法（至于为什么我们后文再说），分别是`View(Context context)`以及`View(Context context, AttrbuteSet attires)`，这样我们才可以在 Java 代码中以及在布局文件中（或使用 Inflater）实例化它们。

## obtainStyledAttributes

看过了 View 的构造方法，我们现在就要在构造方法里获取 View 的参数了。`Context`这个类为我们提供了以下几个方法来获取属性：

```java
obtainAttributes(AttributeSet set, int[] attrs) // 从 layout 设置的属性集中获取 attrs 中的属性
obtainStyledAttributes(int[] attrs) // 从系统主题中获取 attrs 中的属性
obtainStyledAttributes(int resId, int[] attrs) // 从资源文件定义的 style 中读取属性
obtainStyledAttributes(AttributeSet set, int[] attrs, int defStyleAttr, int defStyleRes) // 后面详细说这个方法
```

我们了解一下这几个 API 的参数，然后就可以很方便的获取自定义属性了。

### 参数解析

#### attrs

就是我们需要获取属性集中的哪些属性，通常我们会定义一个`<styleable>`来管理所有的`<attr>`，然后我们就可以用`R.styleable.someAttrs`来使用这个参数了。

#### AttrbuteSet

即我们在 xml 中定义的属性的集合，如：

```xml
    <Button
        android:id="@+id/dial_button"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="@string/dial" />
```

这里我们的每一条属性都会放到 AttrbuteSet 中去，当然自定义属性也不例外。需要注意的是，`style="@style/somestyle"`这样添加的属性也是会放进去的。

> 这也是我们必须要实现`View(Context context, AttrbuteSet attr)`的原因，因为我们需要把布局文件中定义的参数传进来处理。

#### defStyleAttrs

这是自定义属性中可以让其在 Theme 中配置的关键，使用它作为参数会从当前 Theme 中去获取参数。

#### resId/defStyleRes

直接从资源文件中定义的某个样式中读取。

#### Null

注意到我们有一个方法只需要`attrs`作为参数，那它的属性从哪里来呢？其实是我们可以直接在 Theme 中指定属性并且用这个方法获取属性。

#### 四个参数

`obtainStyledAttributes(AttributeSet set, int[] attrs, int defStyleAttr, int defStyleRes)`这个方法有四个参数，我们获取到的属性可能从四个地方来：布局文件(set), defStyleAttr(主题可配置样式), defStyleRes(默认样式), NULL(主题中直接获取)

如果一个属性在多个地方都被定义了，那么它们的优先级如下：

`set`>`defStyleAttr`>`defStyleRes`>`NULL`

## TypedArray

通过`obtainStyledAttributes()`我们就拿到了 TypedValue，我们需要的属性都存在里面。然后我们可以对应声明的时候的类型，使用对应的`getXXX()`方法来获取自定义属性，之后我们就可以使用自定义属性来绘图了。

# 实例

我们将上述的圆形控件修改为五种不同颜色的同心圆，然后使用上面的不同定义属性的方式来定义一遍并且使用。

首先我们的圆形 View 改成这样了：

```java
public class CircleView extends View {

    private Paint mPaint;
    private int mColor1 = Color.BLACK;
    private int mColor2 = Color.BLACK;
    private int mColor3 = Color.BLACK;
    private int mColor4 = Color.BLACK;
    private int mColor5 = Color.BLACK;

    public CircleView(Context context) {
        this(context, null);
    }

    public CircleView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CircleView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.CircleView,
                defStyleAttr, R.style.default_style);
        mColor1 = typedArray.getColor(R.styleable.CircleView_circle_color1, Color.BLACK);
        mColor2 = typedArray.getColor(R.styleable.CircleView_circle_color2, Color.BLACK);
        mColor3 = typedArray.getColor(R.styleable.CircleView_circle_color3, Color.BLACK);
        mColor4 = typedArray.getColor(R.styleable.CircleView_circle_color4, Color.BLACK);
        mColor5 = typedArray.getColor(R.styleable.CircleView_circle_color5, Color.BLACK);
        typedArray.recycle();
        init();
    }

    private void init() {
        mPaint = new Paint();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        mPaint.setColor(mColor1);
        canvas.drawCircle(100, 100, 100, mPaint);
        mPaint.setColor(mColor2);
        canvas.drawCircle(100, 100, 80, mPaint);
        mPaint.setColor(mColor3);
        canvas.drawCircle(100, 100, 60, mPaint);
        mPaint.setColor(mColor4);
        canvas.drawCircle(100, 100, 40, mPaint);
        mPaint.setColor(mColor5);
        canvas.drawCircle(100, 100, 20, mPaint);
    }
}
```

然后在`attrs.xml`中如下定义：

```xml
<resources>
    <declare-styleable name="CircleView">
        <!-- 对应五个同心圆的颜色 -->
        <attr name="circle_color1" format="color"/>
        <attr name="circle_color2" format="color"/>
        <attr name="circle_color3" format="color"/>
        <attr name="circle_color4" format="color"/>
        <attr name="circle_color5" format="color"/>
    </declare-styleable>

    <!-- 定义 theme 可配置 style -->
    <attr name="circle_style" format="reference"/>
</resources>
```

然后我们的`style.xml`中是这样的：

```xml
<resources>

    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>

        <!-- 配置style -->
        <item name="circle_style">@style/custom_theme</item>
        <!-- 直接在主题中指定 -->
        <item name="circle_color1">#ffff00ff</item>
        <item name="circle_color2">#ffff00ff</item>
        <item name="circle_color3">#ffff00ff</item>
        <item name="circle_color4">#ffff00ff</item>
        <item name="circle_color5">#ffff00ff</item>
    </style>

    <!-- 主题中配置的style -->
    <style name="custom_theme">
        <item name="circle_color1">#ffff0000</item>
        <item name="circle_color2">#ffff0000</item>
        <item name="circle_color3">#ffff0000</item>
    </style>

    <!-- 直接在layout文件中引用的style，最后会被放到set中 -->
    <style name="myStyle">
        <item name="circle_color1">#ff00ff00</item>
        <item name="circle_color2">#ff00ff00</item>
    </style>

    <style name="default_style">
        <item name="circle_color1">#ffffff00</item>
        <item name="circle_color2">#ffffff00</item>
        <item name="circle_color3">#ffffff00</item>
        <item name="circle_color4">#ffffff00</item>
    </style>

</resources>
```

在布局中我们是这样使用的：

```xml
    <io.github.loshine.customview.view.CircleView
        style="@style/myStyle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        app:circle_color1="#ff00ffff"/>
```

如上配置，我们效果如图所示：

![](http://7xl94a.com1.z0.glb.clouddn.com/custom_attr.png)

可以看出我们的 color4 没有起效果，这是因为使用了 defStyle，这个时候默认 Style 就不会起作用了。

# 参考文章

[深入理解Android 自定义attr Style styleable以及其应用](http://www.jianshu.com/p/61b79e7f88fc)

