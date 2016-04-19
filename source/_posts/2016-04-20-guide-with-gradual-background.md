---
title: 背景色渐变的引导页
date: 2016-04-01 02:03:33
category: [技术]
tags: [Android,Java]
toc: true
description: Google 的不少 App 都已经使用了背景色渐变的引导页，我也跟风实现一个
---

# 使用什么实现

还用问么，ViewPager 以及 Fragment 呀，非常简单。

# 关键 API

下面的 API 可以根据初始颜色和结束颜色计算中间值。

```java
Object ArgbEvaluator.evaluate(float fraction, Object startValue, Object endValue);
```

# 具体实现

## 布局

* activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context="me.loshine.guidedemo.MainActivity">

    <android.support.v4.view.ViewPager
        android:id="@+id/view_pager"
        android:layout_width="match_parent"
        android:layout_height="match_parent"/>

</RelativeLayout>
```

## 处理滑动背景色

* MainActivity.xml

```java
public class MainActivity extends AppCompatActivity implements ViewPager.OnPageChangeListener {

    ViewPager mViewPager;

    private int[] colors;
    private int state = ViewPager.SCROLL_STATE_IDLE; // 初始位于停止滑动状态

    private ArgbEvaluator mArgbEvaluator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initColors();
        initViewPager();
    }

    /**
     * 初始化 ViewPager
     */
    private void initViewPager() {
        mViewPager = (ViewPager) findViewById(R.id.view_pager);
        if (mViewPager != null) {
            // 初始颜色
            mViewPager.setBackgroundColor(colors[0]);
            mViewPager.setAdapter(new FragmentStatePagerAdapter(getSupportFragmentManager()) {
                @Override
                public Fragment getItem(int position) {
                    return GuideBaseFragment.newInstance(position);
                }

                @Override
                public int getCount() {
                    return 4;
                }
            });

            mViewPager.addOnPageChangeListener(this);
        }
    }

    /**
     * 初始化颜色
     */
    private void initColors() {
        colors = new int[4];
        colors[0] = getResources().getColor(R.color.guideBackgroundColor1);
        colors[1] = getResources().getColor(R.color.guideBackgroundColor2);
        colors[2] = getResources().getColor(R.color.guideBackgroundColor3);
        colors[3] = getResources().getColor(R.color.guideBackgroundColor4);

        mArgbEvaluator = new ArgbEvaluator();
    }

    @Override
    public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
        // 只要不是滑动停止状态就计算颜色
        if (state != ViewPager.SCROLL_STATE_IDLE) {
            if (positionOffset > 0 && position < 4) {
                int evaluatePreColor = (int) mArgbEvaluator
                        .evaluate(positionOffset, colors[position], colors[position + 1]);
                mViewPager.setBackgroundColor(evaluatePreColor);
            } else if (positionOffset < 0 && position > 0) {
                int evaluateNextColor = (int) mArgbEvaluator
                        .evaluate(-positionOffset, colors[position], colors[position - 1]);
                mViewPager.setBackgroundColor(evaluateNextColor);
            }
        }
    }

    @Override
    public void onPageSelected(int position) {
    }

    @Override
    public void onPageScrollStateChanged(int state) {
        this.state = state;
    }
}
```

# 总结

其实实现方式并不复杂，监听 ViewPager 的滚动然后计算中间值即可，重要的是又学习到酷炫的新东西了。