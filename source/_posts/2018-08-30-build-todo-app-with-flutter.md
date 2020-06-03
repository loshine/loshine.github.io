---
title: 用 Flutter 写一个 TODO 应用
date: 2018-08-30 11:50:00
category: [技术]
tags: [Flutter]
toc: true
thumbnail: https://i.loli.net/2020/06/03/dzlZjibJcREmoWN.png
description: Google 在 Github 上提供了一个 Android 各种架构的 Todo 项目，那我就以这个项目的业务为模板用 Flutter 也实现一个。
---

Google 在 Github 上提供了一个 Android 各种架构的 Todo 项目，那我就以这个项目的业务为模板用 Flutter 也实现一个。

<!-- more -->

## 分析

我们以最基础的 [todo-mvp](https://github.com/googlesamples/android-architecture/tree/todo-mvp) 来分析

![tasks](https://i.loli.net/2020/06/03/BV2RQH1vPLJN5md.jpg)

![statistics](https://i.loli.net/2020/06/03/iHKrVCWPmsyl29Q.jpg)

![taskdetail](https://i.loli.net/2020/06/03/Bs2ATbnmLSdUI4z.jpg)

![addedittask](https://i.loli.net/2020/06/03/zlWxg62bAdaOotf.jpg)

### 任务列表

我们进入应用首先是一个任务列表页面，展示所有的任务列表，右上角 Menu 栏有两个按钮，分别是过滤和更多操作。

右下角是一个 FloatingActionButton，点击之后会跳转到创建任务页面。

左上角点击或者屏幕左侧滑动可以展开 DrawerView，里面可以切换到数据统计页面。

### 数据统计

数据统计页面非常简单，就是展示有多少正在进行的任务和已结束的任务

### 添加、编辑任务页

该页面由两个 EditText 组成，用于编辑或创建任务，EditText 分别需要填入标题和描述，右下角有一个 FloatingActionButton 用于编辑结束之后点击提交。

### 任务详情页

任务详情页用于查看任务详情，右上角有一个 **DELETE TASK** Menu Item 可以删除任务，右下角 FloatingActionButton 用于进入编辑页，Checkbox 用于勾选完成任务。

## 开始

分析完毕项目，我们就开始使用 Flutter 实现

> 安装 Flutter 请参考 [Get started](https://flutter.io/get-started/install/)

首先需要创建项目，可以使用工具或命令行创建

### 数据

因为涉及到本地数据存储，我们需要引入 dart 的 sqlite 操作库 [sqflite](https://pub.dartlang.org/packages/sqflite)

根据文档修改`pubspec.yaml`，然后编写数据类和数据操作类

task.dart

```dart
import 'dart:async';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

const tableTask = "task";
const columnId = "_id";
const columnTitle = "title";
const columnDescription = "description";
const columnCompleted = "completed";

const dbName = "tasks.db";

const String createDB = '''
create table $tableTask ( 
  $columnId integer primary key autoincrement, 
  $columnTitle text not null,
  $columnDescription text,
  $columnCompleted integer not null)
''';

class Task {
  Task();

  int id;
  String title;
  String description;
  bool completed;

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      columnTitle: title,
      columnDescription: description,
      columnCompleted: completed == true ? 1 : 0,
    };
    if (id != null) {
      map[columnId] = id;
    }
    return map;
  }

  Task.fromMap(Map<String, dynamic> map) {
    id = map[columnId];
    title = map[columnTitle];
    description = map[columnDescription];
    completed = map[columnCompleted] == 1;
  }
}

class TaskProvider {
  static Database _db;

  Future<Database> get db async {
    if (_db == null) {
      var databasePath = await getDatabasesPath();
      String path = join(databasePath, dbName);
      _db = await open(path);
    }
    return _db;
  }

  Future<Database> open(String path) async {
    return openDatabase(path, version: 1, onCreate: (db, version) async {
      await db.execute(createDB);
    });
  }

  Future<Task> insert(Task task) async {
    var d = await db;
    task.id = await d.insert(tableTask, task.toMap());
    return task;
  }

  Future<Task> get(int id) async {
    var d = await db;
    List<Map> maps = await d.query(tableTask,
        columns: [columnId, columnTitle, columnDescription, columnCompleted],
        where: "$columnId = ?",
        whereArgs: [id]);
    if (maps.length > 0) {
      return new Task.fromMap(maps.first);
    }
    return null;
  }

  Future<List<Task>> getAll() async {
    var d = await db;
    List<Map<String, dynamic>> maps = await d.query(tableTask,
        columns: [columnId, columnTitle, columnDescription, columnCompleted]);
    return maps.map((it) => Task.fromMap(it)).toList();
  }

  Future<int> delete(int id) async {
    var d = await db;
    return await d.delete(tableTask, where: "$columnId = ?", whereArgs: [id]);
  }

  Future<int> clearCompleted() async {
    var d = await db;
    return d.delete(tableTask, where: "$columnCompleted = 1");
  }

  Future<int> update(Task task) async {
    var d = await db;
    return await d.update(tableTask, task.toMap(),
        where: "$columnId = ?", whereArgs: [task.id]);
  }

  Future close() async {
    await _db?.close();
  }
}
```

### UI

Flutter 天生支持数据绑定，UI 部分编写也不困难

需要注意的是纯展示类 UI 继承 StatelessWidget，而有状态的 UI 需要继承 StatefulWidget，然后再继承 State 来编写 UI 和属性。

StatefulWidget 有属性变化的时候需要调用`setState`方法，否则 UI 无法更新

具体 UI 编码可以查看 [Flutter-todo](https://github.com/loshine/flutter-todo) 项目，这里就不具体展开了。

### 页面跳转

需要注意的是 Flutter 一切基于 Widget，所以不区分 Activity，Fragment 这些东西的。

涉及到页面的跳转需要用 Route 来实现，而 Flutter Android 默认的 Route 动画不是很好看，所以我也实现了一个侧滑动画的 [SlideRoute](https://github.com/loshine/flutter-todo/blob/master/lib/utils.dart)

## 总结

Flutter 的使用总体来说还是比较简单的，dart 也是比较简单易学的一门语言，Flutter 的未来我也是十分看好的。接下来我需要做的就是使用一个合理的架构，如 redux 来重构一下这个项目，以及具体深入学习一下 Flutter 的机制和架构了。
