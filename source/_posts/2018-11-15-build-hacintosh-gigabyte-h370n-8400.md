---
title: 自己攒个黑苹果 —— 基于 Gigabyte z370n
date: 2018-11-15 14:37:00
category: [玩具]
tags: [Apple]
toc: true
thumbnail: https://i.loli.net/2020/06/03/Xcda3MQq1xsDkbA.png
description: 看到 Apple 新发布会发布了新款的 iMac mini，突然被种草。但转念一想 Mac mini 没有升级潜力，而且价格又太贵，不如自己来组个黑苹果吧，于是心动不如行动。
---

看到 Apple 新发布会发布了新款的 iMac mini，突然被种草。但转念一想 Mac mini 没有升级潜力，而且价格又太贵，不如自己来组个黑苹果吧，于是心动不如行动。

<!-- more -->

# 购买建议

首先参照 [Tonymacx86 Buyer's Guide](https://www.tonymacx86.com/buyersguide/building-a-customac-hackintosh-the-ultimate-buyers-guide/) 购买硬件。

我购置的一套配置如下：

| 部件 | 型号 |
|------|------|
| 主板 | Gigabyte z370n wifi |
| CPU | Intel I5 8400 |
| 内存 | Crucial 8g 2666 |
| SSD | Samsung 970 EVO 500g M.2 |
| SSD | Toshiba Q200EX 256g SATA |
| 显卡 | EVGA GTX1060 6G SC |
| 机箱 | 乔斯伯 TU 手提箱 |
| 电源 | SilverStone ST45SF SFX |
| 显示器 | ASUS MX27AQ 2K IPS |
| 鼠标 | 罗技 G102 |
| 键盘 | Cherry G80-3494 红轴 |

~~在购买的时候我踩了个小坑，因为 Intel 在 H370 这一代芯片的主板上更换了新规格的网卡接口 **CNVI**，不兼容老的 **NGFF** 规格无线网卡，所以无法直接更换无线网卡达到免驱支持无线上网。~~

~~这里如果有条件最好还是购买 Z370 的主板，可以直接更换`BCM94360CS2`这款网卡达到免驱支持 Wifi，否则和我一样踩坑就只能插 USB Wifi 了。~~

**最后我还是更换了 z370n 主板，并更换了`BCM94360CS2`，不用去操心 Wifi 和蓝牙的问题了**

另外有条件的最好购买免驱的 A卡，可以安装最新的 Mac OS，不用像我需要等待 Nvidia Webdriver 适配 Mojave。

> PS: 因为我的机箱没有前置的 USB 2.0 接口，所以我还购置了一个 3.0 转 2.0 转接线，安装系统的时候最好插在 2.0 接口。

# 安装

主要步骤还是参照 [Tonymacx86 Installation Guide](https://www.tonymacx86.com/threads/unibeast-install-macos-mojave-on-any-supported-intel-based-pc.259381/)

但因为我的显卡还没有 **Mojave** 的 WebDriver，所以只能安装 **High Sierra**

> 最好有一个 U 盘用来刻录系统安装，没有的话自行购买。

## 下载 macOS High Sierra

首先从 App Store [下载 High Sierra 安装包](https://itunes.apple.com/us/app/macos-high-sierra/id1246284741?mt=12)

如果你没有 Mac，自行寻找下载方式和刻录方式

## 创建 USB 启动盘

1. 插入 U 盘
2. 打开磁盘管理
3. 选择 U盘
4. 抹除
5. 名字：USB
6. 格式：Mac OS 扩展（日志式）
7. 抹除
8. 下载 [Unibeast](https://www.tonymacx86.com/resources/categories/tonymacx86-downloads.3/)
9. 选择 U盘，UEFI 模式，显卡补丁不需要，然后等待刻录完成
10. 下载 USBInjectAll.kext 并放入`/EFI/Clover/kext/Others`
11. 下载 [Multibeast](https://www.tonymacx86.com/resources/categories/tonymacx86-downloads.3/)，放入 U盘

## 设置 BIOS

1. Save & Exit → Load Optimized Defaults
2. M.I.T. → Advanced Memory Settings  Extreme Memory Profile(X.M.P.) : Profile1
3. BIOS → Fast Boot : Disabled
4. BIOS → LAN PXE Boot Option ROM : Disabled
5. BIOS → Storage Boot Option Control : UEFI
6. Peripherals → Trusted Computing → Security Device Support : Disabled
7. Peripherals → Network Stack Configuration → Network Stack : Disabled
8. Peripherals → USB Configuration → Legacy USB Support : Auto
9. Peripherals → USB Configuration → XHCI Hand-off : Enabled
10. Chipset → Vt-d : Disabled
11. Chipset → Wake on LAN Enable : Disabled
12. Chipset → IOAPIC 24-119 Entries : Enabled
13. Peripherals → Initial Display Output : PCIe 1 Slot

## 安装 High Sierra

1. 插入 U 盘，选择从 U 盘启动，选择 OS X Install from Install macOS High Sierra
2. 选择语言
3. 使用磁盘工具把目标安装盘格式化为 Mac OS扩展（日志式）
4. 完成重启后选择 U 盘，High Sierra 启动

## 驱动

系统安装完成之后，就是之后的驱动安装了。

首先打开 U 盘里的 Multibeast，按如下选择(其它主板自行选择对应的驱动)即可。

```bash
Audio: Realtek ALCxxx -> ALC1220
Network: Intel -> IntelMausiEthernet v2.4.0
USB: USBInjectAll
```

声卡驱动：待补
USB 网卡驱动：[下载地址](https://drive.google.com/open?id=1tV2y9iEVsmBNodiDsKX6MZOF5yDgpJq0)
Nvidia Webdriver：[下载地址](https://www.tonymacx86.com/nvidia-drivers/)

# 总结

我的配置目前未试验过有线网卡联网，睡眠被我禁用了，也没试验过是否可以使用。蓝牙可以直接使用，USB 无线网卡体验良好。除了 Airdrop 不可以用其它基本完美了，算是不错的 build 了。