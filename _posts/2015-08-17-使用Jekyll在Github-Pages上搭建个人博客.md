---
layout: post
title:  "使用Jekyll在Github-Pages上搭建个人博客"
date:   2015-08-17 10:12:30
categories: jekyll github github-page
---
> 我的个人博客也在Github-Pages上搭建起来了，其中各个步骤参照了[《“授人以渔”的教你搭建个人独立博客》——Azure Yu][site1]、[《Using Jekyll with Pages》][site2]。鄙人于此也作一下**使用Jekyll在Github-Pages上搭建个人博客**的总结，也可以给其他后来者做一些参考。

> * 本文默认读者已经拥有了Github的帐号，并且对Git的使用较为熟练。如果对Git以及Github不是很了解，可以参考[《版本控制入门 – 搬进 Github》][site3]。
* 在这个过程中可能需要使用到少许的Ruby知识，如果您需要学习，可以看[这里][site4]


[site1]: http://azureyu.com/blog/2015/08/15/HowToBulidBlog.html
[site2]: https://help.github.com/articles/using-jekyll-with-pages/
[site3]: http://www.imooc.com/learn/390
[site4]: http://saito.im/slide/ruby-new.html

#目录

* [开始](#begin)
	* [新建一个仓库](#new respontory)
	* clone到本地
* 建造
	* 搭建本地环境
	* Jekyll的使用
* 装修
	* 使用模板
	* 自定义样式
* 定制
	* 使用独立域名
	* 添加			


<h1 id="begin">开始</h1>

<h2 id="new respontory">新建一个仓库</h2>

* 如果没有Github帐号，首先[注册一个][register]。
* 接下来新建一个仓库

**注：**Repository name(仓库名)必须是 `yourusername.github.io`

比如我的用户名是loshine，那么我的这个仓库名就是`loshine.github.io`

* 再之后使用Github客户端或者Git命令行工具将这个项目clone到本地。

[register]: https://github.com/