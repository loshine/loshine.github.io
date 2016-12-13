---
title: Anroid中的自定义View绘制
date: 2016-03-26 00:09:00
category: [技术]
tags: [Android]
toc: true
description: 在 Android 中，自定义 View 几乎是每一个开发者都需要去实现的，本文就简单讲解一下我在学习自定义 View 的一些心得和体会。
---

> 虽然我们在开发中基本可以用 Android 自带的各种控件实现绝大多数的功能，但难以避免还是有一些需求是自带的控件无法实现的。这个时候我们通常会想到去 Github 上寻找开源控件，但有的东西是有成熟的实现如：ViewPager 的 Indicator。而有的就没那么容易找到了。
>
> 还有就是虽然我们平时的一些需求可以使用图片资源代替，但过多的图片资源不仅会使得应用体积增大，还会使得加载的过程中消耗不少的系统资源（内存以及 CPU）—— 我曾经就这么干过，至少这种方法做东西很快（但也很坑）。
>
> 这个时候我们就应该想到自定义 View 了，下面就讲讲我在学习自定义 View 的一些心得体会吧。

# View绘制流程

View 的绘制是从 ViewRoot 的`performTraversals()`方法开始的，其执行过程可简单概括为根据之前所有设置好的状态，判断是否需要计算视图大小（measure）、是否需要重新安置视图的位置（layout），以及是否需要重绘（draw）视图，其流程图如下所示：

![流程图](https://i.niupic.com/images/2016/12/13/saC88t.png)

而我们今天讲的自定义 View 的绘制，主要就是在是否需要重新 draw 这一步来实现。

# 三个绘图工具类简介

要在自定义 View 中进行重新绘制，我们首先需要了解一下 Android 中的三个重要的绘图工具类，它们就是`Paint`(画笔)、`Canvas`(画布)以及`Path`(路径)。当然其实不仅仅只有这三个可以作用于画图和图像处理，但它们是最基础的。

## Paint

Paint 就是画笔，在 Android 图形绘制的时候，我们就好像真的有一个人拿着画笔把图像画出来一样，所以画笔这个类也给了我们和现实世界作画的时候一样的一些设定。

我们可以通过 Paint 来设定线宽(就像现实中画笔的粗细)、颜色(颜料)、透明度以及填充风格等。

我们可以通过它的构造函数来新建一个画笔

```java
Paint paint = new Paint();
```

然后对它进行一些设定

```java
paint.setARGB(255, 255, 0, 0); // 设置 ARGB 颜色 int
paint.setAlpha(0); // 设置透明度 int
paint.setColor(getResources().getColor(android.R.color.black)); // 设置颜色
paint.setAntiAlias(true); // 开启抗锯齿
paint.setDither(true); // 开启抖动处理，使得绘制的图形更清晰
paint.setFilterBitmap(true); // 滤掉对Bitmap图像的优化操作,加快显示速度
paint.setMaskFilter(maskFilter); // 添加滤镜
paint.setColorFilter(colorFilter); // 设置颜色过滤器
paint.setPathEffect(pathEffect); // 设置路径效果(如虚线等)
paint.setShader(shader); // 设置渐变效果
paint.setShadowLayer(2, 2, 2, Color.GRAY); // 半径2,x,y 距离为2，颜色灰色的阴影
paint.setStyle(Paint.Style.FILL_AND_STROKE); // 画笔样式(内部、边框还是both，画封闭图形的时候比较重要)
paint.setStrokeCap(Paint.Cap.SQUARE); // 方形笔刷
paint.setStrokeJoin(Paint.Join.MITER); // 各图形的结合方式
paint.setStrokeWidth(2); // 画笔粗细
paint.setXfermode(xfermode); // 图形重叠时的处理方式
paint.setFakeBoldText(true); // 模拟粗体
paint.setSubpixelText(true); // 提升文字在 LCD 的显示效果
paint.setTextAlign(Paint.Align.CENTER); // 文字对齐方向
paint.setTextScaleX(0.5); // 文字 X 轴缩放
paint.setTextSize(40); // 文字大小
paint.setTextSkewX(30); // 文字倾斜度
paint.setTypeface(Typeface.SANS_SERIF); // 字体风格
paint.setUnderlineText(true); // 下划线
paint.setStrikeThruText(true); // 删除线
paint.setStrokeJoin(Paint.Join.ROUND); // 结合处风格
paint.setStrokeMiter(30); // 画笔倾斜度
paint.setStrokeCap(Paint.Cap.ROUND); // 拐角处风格
paint.ascent(); // baseline之上至字符最高处的距离
paint.descent(); // baseline之下至字符最低处的距离
paint.clearShadowLayer(); // 清除阴影
// 等等
```

但我们光有画笔还是不够的，我们至少还需要画布(Canvas)才可以真正开始作画呢。

## Canvas

Canvas 就是画布，我们有了画笔和画布就可以开始作画(图形绘制)了。

我们有两种创建 Canvas 的方法：

```java
Canvas canvas = new Canvas();
Canvas canvasByBitmap = new Canvas(bitmap);
```

其中传入 Bitmap 的方法会将 Bitmap 作为画布的背景。

下面是常用的`drawXXX()`方法，它们被用于绘制不同的图形

```java
canvas.drawRect(new RectF(0, 0, 100, 100), mPaint); // 绘制一个方形
canvas.drawRect(0, 0, 100, 100, mPaint); // 绘制一个方形
canvas.drawPath(path, paint); // 绘制一个路径
canvas.drawBitmap(bitmap, src, dst, mPaint); // 第二和第三个参数是 Rect
canvas.drawLine(0, 0, 100, 100, mPaint); // 画线
canvas.drawPoint(100, 20, mPaint); // 画点
canvas.drawText("这是一段文字", 0, 0, mPaint); // 画文字
canvas.drawOval(new RectF(0, 0, 100, 200), mPaint); // 画方形的内切椭圆
canvas.drawCircle(300, 300, 100, mPaint); // 画圆
canvas.drawArc(new RectF(0, 0, 100, 100), 0, 30, true, mPaint); // 一个矩形内的扇形
```

还有`clipXXX()`方法，它们是裁剪一块新的区域用于绘图，这里就不详细说明了。

`save()`和`restore()`方法用来保存和恢复 Canvas 的状态，简单而言就是一个存档，一个恢复存档。

还有就是三个变换方法：`translate`(平移)、`scale`(缩放)以及`rotate`(旋转)了，它们可以控制画布的一些动作，就好像我们真实世界中作画的时候对画布的一些动作一样(除了缩放，2333)。

## Path

其实在有了上面两个类之后我们就已经可以开始绘制了，但还是先把 Path 也介绍完毕之后再开始真实案例吧。

Path 就是路径，有点像我们在初中数学中学习函数的时候，可以根据几个点确认画出一个函数的图形。

下面是一些常用的方法：

```java
path.addArc(new RectF(0, 0, 100, 100), 0, 30); // 添加一段圆弧
path.addCircle(300, 300, 100, Path.Direction.CW); // 顺时针圆
path.addOval(rectF, Path.Direction.CCW); // 逆时针椭圆
path.addRect(rectF, Path.Direction.CW); // 添加矩形
path.addRoundRect(rectF, {5, 5, 5, 5}, path.Direction.CW); // 添加圆角矩形
path.isEmpty(); // 是否无路径
path.transform(matrix); // 矩阵变换
path.moveTo(100, 100); // 移动画笔而不绘制
path.lineTo(300, 300); // 默认从(0，0)开始绘制,可以用 moveTo 移动起始点,调用 canvas.drawPath(path, paint) 绘制
path.quadTo(x1, y1, x2, y2); // 绘制贝塞尔曲线,三点(起始点默认(0, 0))确认
path.rCubicTo(x1, y1, x2, y2, x3, y3); // 多一个控制点的贝塞尔曲线
path.arcTo(rectF, 0, 50); // 圆弧
```

# 开始绘制

介绍完了三个绘制 UI 的基础类，那么我们现在来动手试试吧。难度从低到高，循序渐进完成自定义 View 中复杂图形的绘制。

我们自定义一个 View 并且要重新绘制的话，我们只需要新建一个类**继承** View 并且实现`onDraw(Canvas canvas)`即可，View 会调用子类实现的`onDraw`完成绘制。

那么我们接下来的示例就只列出`onDraw`方法和对应的效果图了。

## 简单图形

### 矩形

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        // 在构造函数中初始化画笔并设置为黑色
        canvas.drawRect(0, 0, 100, 200, mPaint);
    }
```

![黑色矩形](https://i.niupic.com/images/2016/12/13/jNDPVs.png)

### 线段

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawLine(0, 0, 100, 200, mPaint);
    }
```

![线段](https://i.niupic.com/images/2016/12/13/nCM5eC.png)

### 圆形

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawCircle(100, 100, 100, mPaint);
    }
```

![圆形](https://i.niupic.com/images/2016/12/13/9NiLUM.png)

### 画布底色

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        canvas.drawColor(getResources().getColor(android.R.color.darker_gray));
    }
```

![画布底色](https://i.niupic.com/images/2016/12/13/RKAF1q.png)

## 复杂图形

### 刻度尺

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        // 防止数字0出界
        canvas.translate(0, 50);

        for (int i = 0; i <= 100; i++) {
            if (i % 10 == 0) {
                // 带有数字的长刻度
                canvas.drawLine(0, 0, 70, 0, mPaint);
                // 画文字
                canvas.drawText(String.format(Locale.CHINESE, "%d", i / 10), 100, 10, mPaint);
            } else if (i % 5 == 0) {
                // 每隔5的中等长度的刻度
                canvas.drawLine(0, 0, 40, 0, mPaint);
            } else {
                // 其它小刻度
                canvas.drawLine(0, 0, 30, 0, mPaint);
            }
            // 每个刻度画完之后位移
            canvas.translate(0, 15);
        }
    }
```

![刻度尺](https://i.niupic.com/images/2016/12/13/VDPSNo.png)

### 手表表盘

```java
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        // 绘制外圈圆
        canvas.drawCircle(400, 400, 400, mPaint);

        // 绘制分针和时针
        canvas.drawLine(400, 400, 400, 200, mPaint);
        canvas.drawLine(400, 400, 550, 400, mPaint);

        // 绘制刻度和文字
        for (int i = 0; i < 12; i++) {
            canvas.drawLine(400, 0, 400, 10, mPaint);
            canvas.drawText(String.format(Locale.CHINESE, "%d", i == 0 ? 12 : i),
                    400, 100, mTextPaint);
            // 旋转画布
            canvas.rotate(30, 400, 400);
        }
    }
```

![表盘](https://i.niupic.com/images/2016/12/13/cmF5N5.png)

# 总结

其实 Android 中的图形绘制基本就是靠这三个类扩展变化而来，掌握了它们的使用方式我们也就可以定义各种各样的好看的自定义控件了。

那么我们掌握了绘制之后，我们还要考虑的就是自定义 View 的测量了，我会在之后再写一篇博文来总结我学习自定义 View 的测量的一些经验，感谢观看（虽然并不会有多少人看……）。