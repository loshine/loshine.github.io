---
title: 记一次升级LEDE后的坑——从0开始编译ssr
date: 2017-11-26 19:47:45
category: [技术]
tags: [LEDE]
toc: true
description: 今天手贱，把手里的 NETGEAR WNDR4300 从 OpenWRT 15.05 升级到了 LEDE 17.01.4。虽然配置保留了，但比较悲剧的是之前安装的 ssr 和其他服务都没了，需要重新安装。但安装完 ssr 之后更坑的来了：github 上直接下载的编译好的包是 for OpenWRT 的，LEDE 需要自行编译，于是就只能自己动手，丰衣足食了。
---

今天手贱，把手里的 NETGEAR WNDR4300 从 OpenWRT 15.05 升级到了 LEDE 17.01.4。虽然配置保留了，但比较悲剧的是之前安装的 ssr 和其他服务都没了，需要重新安装。但安装完 ssr 之后更坑的来了：github 上直接下载的编译好的包是 for OpenWRT 的，LEDE 需要自行编译，于是就只能自己动手，丰衣足食了。

<!-- more -->

# Warning

1. 千万别妄图在 Mac 上直接编译，貌似缺少包还是什么的，浪费了我很多时间。
2. Windows 也别异想天开了
3. 如果你会用 Docker，可以考虑用 Docker，否则选择虚拟机、真机安装 Ubuntu、购买一台 VPS 都是不错的选择。

因为我手头有一台 VPS，于是选择了 ssh 远程连接，在 VPS 上编译之后用 sftp 下载到本机的方式。

# 编译环境搭建

我的编译环境是 Ubuntu 16.04，其它 Linux 不敢保证一定 OK，可以自行尝试

## 安装编译环境依赖包

这是网上搜来的 OpenWRT 编译环境需要的包。

```bash
sudo apt-get update && sudo apt-get upgrade
sudo apt-get install build-essential
sudo apt-get install subversion
sudo apt-get install git-core
sudo apt-get install libncurses5-dev
sudo apt-get install zlib1g-dev
sudo apt-get install gawk
sudo apt-get install flex
sudo apt-get install quilt
sudo apt-get install libssl-dev
sudo apt-get install xsltproc
sudo apt-get install libxml-parser-perl
sudo apt-get install mercurial
sudo apt-get install bzr
sudo apt-get install ecj
sudo apt-get install cvs
sudo apt-get install unzip
sudo apt-get install wget
```

## 按照文档安装依赖

项目地址：[openwrt-ssr](https://github.com/ywb94/openwrt-ssr)

按照要求安装依赖：

```bash
sudo apt-get install gawk libncurses5-dev libz-dev zlib1g-dev git ccache
```

## 下载 LEDE SDK

在 [release](https://downloads.lede-project.org/releases/) 页面找到对应版本对应芯片的 sdk，比如我是 17.01.4，ar71xx，nand，所以我是这个[lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz](https://downloads.lede-project.org/releases/17.01.4/targets/ar71xx/nand/lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz)

在 VPS 里下载 SDK

```bash
wget https://downloads.lede-project.org/releases/17.01.4/targets/ar71xx/nand/lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz
```

解压压缩包

```bash
xz -d lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz
tar xvf lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar
```

# 编译 ipk

## 进入 SDK 目录

```bash
cd lede-sdk-17.01.4-ar71xx-nand_gcc-5.4.0_musl-1.1.16.Linux-x86_64
```

## 安装 feeds

依次运行如下命令安装 feeds

```bash
./scripts/feeds update
./scripts/feeds install zlib
./scripts/feeds install libopenssl
./scripts/feeds update packages
./scripts/feeds install libpcre
```

## 获取 Makefile

使用 git 获取项目

```bash
git clone https://github.com/ywb94/openwrt-ssr.git package/openwrt-ssr
```

## 选择要编译的包

建议选择原始版本，如果需要 GFWList 版本的请按项目页面操作

```bash
# luci ->3. Applications-> luci-app-shadowsocksR         原始版本
make menuconfig
```

![](https://imgur.com/qDkxSlZ.png)
![](https://imgur.com/FLjo439.png)
![](https://imgur.com/rL2zNRl.png)
![](https://imgur.com/Wsp6vFs.png)

## 开始编译

首先是语言文件

```bash
#如果没有安装po2lmo，则安装（可选）
pushd package/openwrt-ssr/tools/po2lmo
make && sudo make install
popd
#编译语言文件（可选）
po2lmo ./package/openwrt-ssr/files/luci/i18n/shadowsocksr.zh-cn.po ./package/openwrt-ssr/files/luci/i18n/shadowsocksr.zh-cn.lmo
```

然后正式开始编译，输入以下命令之后静待编译完成即可。

```bash
# 开始编译
make package/openwrt-ssr/compile V=99
```

# 安装 ipk

编译好的 ipk 文件位于 SDK 下`/bin/packages/{架构}/base`目录，现在只需要将其放到路由器里安装就可以了。

windows 可以用 WinSCP，而 Mac 就只能用命令了

```bash
scp -r luci-app-shadowsocksR_1.2.1_all.ipk root@{路由器IP}:/tmp
```

然后使用 ssh 工具登录路由器，进入`/tmp`目录，安装 ipk 包即可。

```bash
opkg update && opkg install luci-app-shadowsocksR_1.2.1_all.ipk
```

安装过程中会自动安装缺失的依赖，如果没有安装依赖通常是因为 update 失败了，这个时候我们可以把 opkg 源换成中科大的源

```
vim /etc/opkg/distfeeds.conf
```

然后把所有的`https://downloads.lede-project.org/`换成`https://mirrors.ustc.edu.cn/lede/`，编辑完成之后重新运行如上命令即可。