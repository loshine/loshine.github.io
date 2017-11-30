---
title: 使用 Jenkins 打造 Android 自动构建工具流
date: 2017-11-27 12:06:32
category: [技术]
tags: [Android, Jenkins]
toc: true
---

每次给测试打包应用的时候，因为编译 Andorid apk 非常消耗性能，所以基本上只能看着电脑发呆。高级的工程师怎么可以这样被难倒，于是乎我就开始了漫长的折腾之旅。

<!-- more -->

# 工具选择

比较常用的有 Travis-ci，Jenkins，gitlab-ci 等，综合考虑了一下我的需求：

1. 我们的 repo 在 github 上，gitlab-ci 被淘汰
2. 私有 repo，Travis-ci 需要收费被淘汰

所以最终我选择了 Jenkins

# Jenkins 安装 & 配置

## 安装 Jenkins

ssh 工具连上服务器，根据[官方 Wiki](https://pkg.jenkins.io/debian-stable/)一顿操作


### 1. 添加 repo

```bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
```

### 2. 添加 sources

将下面的内容添加到`/etc/apt/sources.list`

```bash
deb https://pkg.jenkins.io/debian-stable binary/
```

### 3. 安装

无须多言，照做便是

```bash
sudo apt-get update
sudo apt-get install jenkins
```

## 配置 Jenkins

如上操作完毕之后其实我们已经安装完毕了，然后我们需要配置一下

> 其实是我的 8080 端口已经使用了，所以要换个端口。
> 
> 然后呢，如果你是用 vps，注意改一下安全策略把对应端口对外开放。

```bash
vim /etc/default/jenkins
```

找到`HTTP_PORT`配置为你需要的端口即可

然后再运行以下命令，复制好初始密码，之后要用到的

```bash
cat /var/lib/jenkins/secrets/initialAdminPassword

*******************************
```

哈哈我的密码肯定不会给你看的~~

## 启动

```bash
/etc/init.d/jenkins start
```

其它可选命令：`{start|stop|status|restart|force-reload}`

然后我们打开浏览器：`{你的服务器 IP 地址}:{你修改的端口号}`

输入你刚刚复制好的初始密码，就可以了。

选择安装建议的插件，然后设置好账号密码，就 OK 了。

## 安装插件包

之前建议的插件包可以会漏掉一些东西，我们再装一下看有没有都装齐

* Git plugin
* Gradle Plugin
* Email Extension Plugin
* description setter plugin
* build-name-setter
* user build vars plugin
* Post-Build Script Plug-in
* Branch API Plugin
* SSH plugin
* Scriptler
* Dynamic Parameter Plug-in
* Git Parameter Plug-In

### fir.im 插件

[fir.im](https://fir.im) 的插件需要自己安装，详情看(fir.im Jenkins 插件使用方法)[https://blog.fir.im/jenkins/]

## 设置工具

在这一步之前，我们先检查一下编译 Android 项目需要的依赖都有了吗

### JDK

我安装的 1.8

```bash
sudo add-apt-repository ppa:webupd8team/java

sudo apt-get update
sudo apt-get install oracle-java8-installer
```

> 如果你找不到 add-apt-repository 命令，就装一下以下两个包

```bash
sudo apt-get install software-properties-common python-software-properties
```

安装好了之后的的路径是`/usr/lib/jvm/java-8-oracle`

### Gradle

现在我们不需要自己安装 Gradle 了，Android 项目现在是默认启用 gradle-wrapper 的，然后会自行下载和编写项目一致的 Gradle 版本

### Android-Sdk

这一步稍微麻烦点，首先我们去 Android 官网找到 SDK：[sdk-tools-linux-3859397.zip](https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip)

然后在服务器上下载：

```bash
# 没有安装 wget 先安装 wget
# sudo apt-get install wget
wget https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip
```

解压并移动到`/usr/local/android-sdk`

```bash
# 没有安装 unzip 先安装 unzip
# sudo apt-get install unzip
unzip sdk-tools-linux-3859397.zip
sudo mkdir /usr/local/android-sdk
sudo mv tools /usr/local/android-sdk
```

安装依赖

> 注：如果您运行的是 64 位版本 Ubuntu，则您需要使用以下命令安装一些 32 位库：
> 
> `sudo apt-get install lib32z1 lib32ncurses5 lib32bz2-1.0 lib32stdc++6`
> 
> 如果您运行的是 64 位版本的 Fedora，则所用命令为：
> 
> `sudo yum install zlib.i686 ncurses-libs.i686 bzip2-libs.i686`

更新 sdk

```bash
cd tools
sudo ./android update sdk
```

等待更新完毕之后，运行如下命令

```bash
cd ..
cd tools/bin
sudo ./sdkmanager --update
sudo ./sdkmanager --list
```

然后按照需求安装对应的包即可

> 其他 sdkmanager 操作可以参考[这里](https://developer.android.com/studio/command-line/sdkmanager.html)

```bash
# 按需安装
sudo ./sdkmanager "platforms;android-26"
```

### 配置 tools path

系统管理 > Global Tool Configuration

#### JDK 

新增 JDK

* **JDK 别名**: `JAVA_8`
* **JAVA_HOME**: `/usr/lib/jvm/java-8-oracle`
* **自动安装**: 取消勾选

#### Git

* **Name**: `Native-Git`
* **Path to Git executable**: `/usr/bin/git`
* **自动安装**: 取消勾选

Apply > Save

系统管理 > 系统设置

#### 全局属性

* **Environment variables**: 勾选
* **键值对列表**: `ANDROID_HOME:/usr/local/android-sdk`

到此 Jenkins 的所有属性都配置完毕了。

# 项目

我们整个理想化的流程是

1. 本地代码 push 到 Github 的 master 分支
2. Jenkins 监听到 Github 的 webhook，拉取项目更新
3. Gradle build
4. 输出 apk 到 fir.im

先用一个 github 上的项目测试一次

## 新建项目

### 1. 创建项目

输入项目名称，并选择 **构建一个自由风格的软件项目**

### 2. 填写项目资料

#### 通用

因为我是一个 Github 项目，所以勾选上 **Github project**，并填上了项目链接

#### 源码管理

源码管理选择 Git，填入 Github 上的 **Repository URL**，然后添加自己的 Github 账号并选中，分支选择`master`

#### 构建触发器

触发构建的条件，我的需求是每次 push master 分支的时候都会触发构建，所以我勾选了 **GitHub hook trigger for GITScm polling**

这里注意，需要到自己的 Github 页面以及 Jenkins 的设置页面进行一些配置，详情请看 [Github Plugin Wiki](https://wiki.jenkins.io/display/JENKINS/GitHub+Plugin)

#### 构建环境

可以自己按需设置，我没有要求所以跳过

#### 构建

增加构建步骤 > Invoke Gradle script > Use Gradle Wrapper

勾选上 **Make gradlew executable**

Tasks 填入 `clean assembleDebug`

> 如果是打正式包，配置好签名之后 Task 填入 `clean assembleRelease`

#### 构建后操作

##### 1. 上传 fir.im

这里我们需要把 Build 完毕的 Android apk 上传到 fir.im，并且发邮件通知开发者。

增加构建后操作步骤 > Upload to fir.im

填入申请的 **Token** 和其它内容即可

##### 2. 邮件通知

我们这里使用 [Email Extension Plugin](https://wiki.jenkins.io/display/JENKINS/Email-ext+plugin)

安装和初始设置就不说了，直接添加最后的内容

* **Project Recipient List**: 添加邮件接收者的邮箱地址，用`,`分隔
* **Content Type**: HTML
* **Default Subject**: `构建通知: $PROJECT_NAME - Build # $BUILD_NUMBER - $BUILD_STATUS!`
* **Default Content**: 

```
(本邮件是 Jenkins 服务端构建完毕后自动发送，请勿回复)<br/><hr/>

项目名称: $PROJECT_NAME<br/>
Git 版本号: $GIT_REVISION<br/>
触发原因: $CAUSE<br/>
构建编号: # $BUILD_NUMBER<br/>
构建状态: $BUILD_STATUS<br/>

构建地址: <a href="$BUILD_URL">$BUILD_URL</a><br/>
```

* **Attach Build Log**: Compress and Attach Build Log

## 触发构建

全部设置完毕了，接下来我们就要去触发构建了。

我们默认设置的是 Github Webhook 的方式构建，但我现在想直接构建，所以进入项目，点击 **立即构建**，等待全部运行完毕即可。

## 一些额外的小帮助

如果构建过程中 gradle wrapper 下载 gradle 可执行文件特别慢，你可以先在本机下载好，用 sftp 软件传到服务器

然后把你下载好的压缩文件移动到`/var/lib/jenkins/.gradle/wrapper/dists/gradle-{version_number}-all/{strange_strings}`，取消正在进行的构建，重来一次就可以了

# 总结

为了弄 Jenkins 自动构建工具流，我来回忙活了好几天。首先在 Aliyun 上买了个 **单核1G内存** 的服务器，然后一直卡在`transformDexArchiveWithExternalLibsDexMergerForDebug`这里任务 failed

发现不要用不是稳定版的 Android Studio 来创建项目，似乎是最新非稳定版的 Gradle 和 Ubuntu 的兼容性问题。

然后呢，华丽丽的开始 Build 了之后，就，服务器整个卡死，Jenkins 无法连接，ssh 无法连接，阿里云监控也看不出啥原因，最后我猜测是内存爆了，升级到**单核2G内存**，并且为了减小项目的影响，新建了一个项目来 Build，就通过了。

查看阿里云内存监控发现一个刚创建的项目构建的时候内存峰值就已经快到 2G 的极限了，这没办法，只能选择更高配的机器了。但阿里云坑的是没有**1核4G**的可选了，只好退款换到腾讯云，然后就搞定了。

> Warning: Gradle 构建项目的时候实在是太吃内存了，大家一定要选购内存足够的机器，否则会卡死。