---
title: 集成友盟分析和推送的一些坑
date: 2016-10-11 01:22:47
category: [技术]
tags: [Android, 友盟]
toc: true
---

> 最近公司的项目用到了友盟的统计和推送，在集成的过程中遇到了一点小坑，这里记录一下方便以后查阅。

<!--more-->

# 集成统计

## 获得 Appkey

在集成友盟的统计 SDK 之前肯定要先注册帐号，添加新应用并获取 Appkey。

![app_key](http://dev.umeng.com/system/images/W1siZiIsIjIwMTQvMDEvMTcvMTNfNTJfMzBfMjI4X2RldjUucG5nIl1d/dev5.png)

## 导入 SDK

官网提供了两种导入方式：

1. 下载集成
2. 使用 Gradle 集成

在这里建议使用 Android Studio 并且使用 Gradle 集成，非常简单方便，只需要添加如下依赖即可：

```gradle
dependencies {
   compile 'com.umeng.analytics:analytics:latest.integration'
}
```

> `latest.integration`代表友盟统计的最新版本，笔者使用时最新版本为`6.0.0`

## 配置项目

接下来修改`AndroidManifest.xml`文件添加权限，填写 **Appkey** 以及填写**渠道 id** ：

```xml
<manifest……>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
    <application ……>
        ……
        <activity ……/>
        <meta-data android:value="YOUR_APP_KEY" android:name="UMENG_APPKEY"/>
        <meta-data android:value="Channel ID" android:name="UMENG_CHANNEL"/>
    </application>    
</manifest>
```

> 以上需要把`UMENG_APPKEY`替换成自己的应用的 **Appkey**，`UMENG_CHANNEL`替换成对应渠道的渠道号。多渠道打包可以参考美团的多渠道打包方案。

## 统计页面访问

我司的应用界面全部由 Fragment 呈现，Activity 只用作管理 Fragment。

按照文档首先在 Application 类中调用`MobclickAgent.openActivityDurationTrack(false)` 禁止默认的页面统计方式，这样将不会再自动统计Activity。

然后封装一下 **BaseActivity** 以统计时长：

```java
class BaseActivity extends AppCompatActivity {
	public void onResume() {
        super.onResume();
        MobclickAgent.onResume(this);       //统计时长
    }
    public void onPause() {
        super.onPause();
        MobclickAgent.onPause(this);
    }
}
```

封装 BaseFragment 以统计具体页面：

```java
class BaseFragment extends Fragment {

    public void onResume() {
        super.onResume();
        // 统计页面
        MobclickAgent.onPageStart(getPageName());
    }

    public void onPause() {
        super.onPause();
        MobclickAgent.onPageEnd(getPageName()); 
    }

    /**
     * 默认页面名是类名，可以给子类重写
     */
    public String getPageName() {  
        return this.getClass().getName();
    }  
}
```

## 帐号统计

暂时还未使用，之后补充。

## 混淆配置

按官方文档配置混淆，以免混淆之后的错误

```
-keepclassmembers class * {
    public <init> (org.json.JSONObject);
}

-keep public class [您的应用包名].R$*{
    public static final int *;
}

-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
```

## 使用集成测试

首先在 Application 中打开测试模式：

```java
MobclickAgent.setDebugMode(BuildConfig.DEBUG);
```

然后[添加测试设备](http://mobile.umeng.com/test_devices?ticket=ST-1450072700rPWK4t4q46xw-qpBXzk)

这样所有测试数据不会进入应用正式的统计后台，只能在 **管理--集成测试--实时日志** 里查看，测试数据的数据就不会污染生产环境数据了。

# 推送服务

## 创建应用

首先需要[创建应用]([http://push.umeng.com](http://push.umeng.com/) )，获取应用对应的 **AppKey** 和 **Umeng Message Secret**。

因为之前使用了**友盟统计**，我们需要**从已有应用中添加**以保证 **AppKey** 的唯一。

## 导入 PushSDK

1. 把下载的 zip 文件解压缩（解压后的文件路径不能有中文）

2. 把解压缩后得到的目录下的 PushSDK 当做 Module 导入到自己的工程

3. 在之前的`AndroidManifest.xml`的基础上添加

   ```xml
   <meta-data
       android:name="UMENG_MESSAGE_SECRET"
       android:value="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"/>
   ```

4. 编辑`build.gradle`添加模块

   ```gradle
   dependencies {
       // ...
       compile project(':PushSDK')
   }
   ```

## 权限配置

若主工程的`targetSdkVersion`为 23 及以上，需要运行时申请**存储权限**（`WRITE_EXTERNAL_STORAGE`），否则在 Android 6.0 及以上机型可能出现无法选举宿主的情况。

## 注册服务

在工程的 Application 类的`onCreate()` 方法中注册推送服务，无论推送是否开启都需要调用此方法：

```java
PushAgent mPushAgent = PushAgent.getInstance(this);
// 注册推送服务，每次调用 register 方法都会回调该接口
mPushAgent.register(new IUmengRegisterCallback() {

    @Override
    public void onSuccess(String deviceToken) {
        // 注册成功会返回 device token
    }

    @Override
    public void onFailure(String s, String s1) {

    }
});
```

在 **BaseActivity** 的`onCreate`方法中添加如下代码启动**推送统计**：

```
PushAgent.getInstance(context).onAppStart();
```

## 混淆配置

按照文档配置混淆

```
-dontwarn com.taobao.**
-dontwarn anet.channel.**
-dontwarn anetwork.channel.**
-dontwarn org.android.**
-dontwarn org.apache.thrift.**
-dontwarn com.xiaomi.**
-dontwarn com.huawei.**

-keepattributes *Annotation*

-keep class com.taobao.** {*;}
-keep class org.android.** {*;}
-keep class anet.channel.** {*;}
-keep class com.umeng.** {*;}
-keep class com.xiaomi.** {*;}
-keep class com.huawei.** {*;}
-keep class org.apache.thrift.** {*;}

-keep public class **.R$*{
    public static final int *;
}
```

## 集成推送中的一些坑

### UnsatisfiedLinkError

按照如上设置之后运行项目发现会如下报错

```
java.lang.UnsatisfiedLinkError: dlopen failed: "/data/data/应用包名/files/libtnet-3.1.7bk1.so" is 32-bit instead of 64-bit
```

需要在项目根目录的`build.gradle`中如下设置解决：

```gradle
	defaultConfig {
		// ...
        ndk {
            abiFilters "armeabi", "x86"
        }
	}
```

### 使用 BuildTypes 修改包名的错误

因为友盟使用 ApplicationId 作为包名利用反射获取资源文件，而当 BuildTypes 中的 ApplicationId 改变了导致应用包名和 Java 包名不一致的时候就会导致错误。此时需要在注册推送服务之前重新设置包名：

```java
PushAgent mPushAgent = PushAgent.getInstance(this);
// 首先重新设置包名
mPushAgent.setResourcePackageName(R.class.getPackage().getName());
// 注册推送服务，每次调用 register 方法都会回调该接口
mPushAgent.register(new IUmengRegisterCallback() {

    @Override
    public void onSuccess(String deviceToken) {
        // 注册成功会返回 device token
    }

    @Override
    public void onFailure(String s, String s1) {

    }
});
```

# 总结

以上就是实际项目中集成友盟统计和推送的方法了，查阅资料解决了一些官方文档没有提及的东西，希望可以给后来者一个参考。