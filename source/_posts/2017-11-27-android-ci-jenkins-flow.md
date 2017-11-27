---
title: Android 自动构建工具流
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

```bash
sudo apt-get install gradle
```

安装好之后的路径是`/usr/share/gradle`

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
mkdir /usr/local/android-sdk
mv tools /usr/local/android-sdk
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
./android update
```

等待更新完毕之后，运行如下命令

```bash
cd ..
cd tools/bin
./sdkmanager --update
./sdkmanager --list
```

然后按照需求安装对应的包即可

> 其他 sdkmanager 操作可以参考[这里](https://developer.android.com/studio/command-line/sdkmanager.html)

```bash
# 按需安装
./sdkmanager "platforms;android-26"
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

#### Gradle

新增 Gradle

* **Gradle Name**: `Native_Gradle_2.10`
* **GRADLE_HOME**: `/usr/share/gradle`
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

