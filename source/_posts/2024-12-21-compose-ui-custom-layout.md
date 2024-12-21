---
title: Compose UI 自定义布局实战
date: 2024-12-21 15:05:00
category: [技术]
tags: [Android, Jetpack]
toc: true
thumbnail: https://s2.loli.net/2024/12/21/M7RxjZso5ipqDnY.png
---

工作中碰到有一个需求是类似于 FlexColumn 的排列，但是项目中的 Compose 版本较低没有 `Modifier.fillMaxColumnWidth()`，于是考虑使用自定义 Layout 实现。

<!-- more -->

# Compose UI 自定义布局实战

## Layout

Compose UI 中其实和原生 View 系统类似，也可以实现自己的布局。原生 ViewGroup 需要实现 `onMeasure`，在里面测量每一个子 View，最后确定自身的尺寸。然后实现 `onLayout` 确定子 View 如何布局。

Compose 中我们使用 `Layout` 来实现，也是分两步：**测量**和**布局**。

```kotlin
Layout(
  modifier = modifier,
  content = content,
) { measurables, constraints ->

}
```

我们需要对每个 measurable 调用 `measure` 传入对应的约束（Compose 父布局决定约束条件），然后调用 `layout` 方法决定每个 placeable 如何布局。

以一个自定义的 Column 为例，我们测量完成之后，一个个根据本身的高度向下排列即可。

```kotlin
@Composable
fun CustomColumn(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(
        modifier = modifier,
        content = content
    ) { measurables, constraints ->
        val placeables = measurables.map { it.measure(constraints) }
        var yPosition = 0
        layout(constraints.maxWidth, constraints.maxHeight) {
            placeables.map {
                it.placeRelative(0, yPosition)
                yPosition += it.height
            }
        }
    }
}
```

一切复杂的布局其实都是对 Layout 的两个步骤的扩展，只要对测量和布局过程熟悉就可以完成不同的布局的编写。

## 实战

需求是有一个 2～9 个子控件的布局，根据子控件的数量实现如下的排列：

![灵活布局](https://s2.loli.net/2024/12/21/M7RxjZso5ipqDnY.png)

FlowColumn 搭配使用 `Modifier.fillMaxColumnWidth` 和 `Modifier.weight` 将可以很轻松的实现需求的效果。

但由于项目依赖库的版本较低，无法使用 `Modifier.fillMaxColumnWidth`，且 FlowColumn 本身还被标记为 ExperimentalLayoutApi，于是该方案无法使用。

考虑到项目情况，该需求应该使用自定义 Layout 实现是更稳妥的方案。

### 需求分析

根据上述需求，我们可以发现该布局是一个以列为基本单位的布局。当子控件不足 7 个的时候，有两列；如果在 7 到 9 个之间，则有 3 列。

确定列数之后，可以取余确定第一列的 item 有多少个，如果余数为 0 表示第一列和其他列一样；否则余数为第一列的 item 个数。

每一列的宽度都是相等的，均分布局，但注意要减去分割线的宽度。

第一列如果是余数列，则以余数的数量均分高度（减去分割线宽度）；否则所有列都是按行数均分高度（减去分割线宽度）。

### 方法定义

根据需求，我们有一个圆角的背景，子控件之间有分割线，所以我们添加对应的参数。

```kotlin
@Composable
fun CustomFlexLayout(
    modifier: Modifier = Modifier,
    dividerColor: Color = Color.Black,
    dividerWidth: Dp = 1.dp,
    shape: Shape = RoundedCornerShape(16.dp),
    content: @Composable () -> Unit,
) {
    // ...
}
```

### 分割线支持

Modifier 添加背景和 Shape，然后在布局的时候处理即可。

```kotlin
        modifier = modifier
            .background(color = dividerColor, shape = shape)
            .clip(shape),
```

### 测量和布局

#### 预计算

在测量和布局之前，我们已经可以根据参数预先完成计算。然后我们就得出了 item 宽度，余数列(如果不能均分的时候的第一列)和普通列的 item 高度，以及每个 item 的位置（用一个 List 保存方便后续使用）。

```kotlin
        // 先确定列
        val columns = columnStrategy(childrenSize)
        // 根据列算出最大多少行
        val maxItemsInEachColumn = (childrenSize + columns - 1) / columns
        // 如果无法完全均分的话，第一列有多少 item
        // 当可以均分的时候此数为 0
        val firstColumnItemsIfNotEvenly = childrenSize % maxItemsInEachColumn
        val dividerWidthPx = dividerWidth.roundToPx()
        // 判断当不均分的时候，对应 index 的 item 是否在第一列
        val isInFirstColumnIfNotEvenly: (Int) -> Boolean = { index ->
            firstColumnItemsIfNotEvenly > 0 && index < firstColumnItemsIfNotEvenly
        }
        // 预计算一下第一列和正常列 item 高度，不要丢循环里计算
        val normalColumnItemMaxHeight =
            (constraints.maxHeight - (dividerWidthPx * (maxItemsInEachColumn - 1).coerceAtLeast(0))) / maxItemsInEachColumn
        val firstColumnItemMaxHeightIfNotEvenly = if (firstColumnItemsIfNotEvenly == 0)
            0
        else
            (constraints.maxHeight -
                    (dividerWidthPx * (firstColumnItemsIfNotEvenly - 1).coerceAtLeast(0))) / firstColumnItemsIfNotEvenly
        // 按规则测量宽度，分割线不能是负数
        val itemMaxWidth =
            (constraints.maxWidth - (dividerWidthPx * (columns - 1).coerceAtLeast(0))) / columns
        // 遍历一下算出 Size 和 Position
        val positionList = (0 until childrenSize).map { index ->
            // 按索引计算所在行和列以及摆放的位置
            val (rowIndex, columnIndex, itemMaxHeight) = if (isInFirstColumnIfNotEvenly(index)) {
                Triple(index, 0, firstColumnItemMaxHeightIfNotEvenly)
            } else {
                val adjustIndex = index - firstColumnItemsIfNotEvenly
                val row =
                    if (maxItemsInEachColumn == 1) 0 else adjustIndex % maxItemsInEachColumn
                val column =
                    adjustIndex / maxItemsInEachColumn + if (firstColumnItemsIfNotEvenly > 0) 1 else 0
                Triple(row, column, normalColumnItemMaxHeight)
            }
            val positionX = itemMaxWidth * columnIndex + dividerWidthPx * columnIndex
            val positionY = itemMaxHeight * rowIndex + dividerWidthPx * rowIndex
            Pair(positionX, positionY)
        }
```

#### 测量

需要注意的是 constraints 需要调用 `copy` 方法按索引生成新的约束，宽度所有 item 都是一样的，高度如果不均分情况下第一列和其他列会不一样。

```kotlin
        // 测量子控件
        val placeables = measurables.mapIndexed { index, measureable ->
            val maxHeight = if (isInFirstColumnIfNotEvenly(index))
                firstColumnItemMaxHeightIfNotEvenly else normalColumnItemMaxHeight
            measureable.measure(
                constraints.copy(
                    minWidth = 0,
                    maxWidth = itemMaxWidth,
                    minHeight = 0,
                    maxHeight = maxHeight
                )
            )
        }
```

#### 布局

使用预计算好的 positionList 摆放子控件即可。

```kotlin
        // Layout 摆放子控件
        layout(constraints.maxWidth, constraints.maxHeight) {
            placeables.mapIndexed { index, placeable ->
                val (positionX, positionY) = positionList[index]
                placeable.placeRelative(positionX, positionY)
            }
        }
```

## To-do

以当前需求而言已经够用了，但是该控件还可以更进一步，比如

1. 目前是列排列优先，可以增加行排列优先的支持
2. 可以去掉子控件数量限制支持更多子控件数量
3. 支持布局反向排列

## 总结

* 自定义布局的时候应该注意预先计算好一些参数，可以避免在测量和布局的时候在循环中计算，提高性能。
* 算法对写自定义布局是有帮助的，有空可以多刷一下 LeetCode 的算法题
* 善用语法糖可以让编码过程变得愉悦