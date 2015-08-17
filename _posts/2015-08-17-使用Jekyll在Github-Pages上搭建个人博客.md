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

<br>

#目录

* [开始](#begin)
	* [新建一个仓库](#new respontory)
	* [clone到本地](#clone)
	* [上传页面](#update index)
* [建造](#build)
	* [搭建本地环境](#build environment)
	* [Jekyll的使用](#use jekyll)
	* [Jekyll目录解析](#jekyll dictionary)
* [装修](#decoration)
	* 使用模板
	* 自定义样式
* [定制](#customize)
	* 使用独立域名
	* 添加评论功能
* [参考](#reference)

<br>

<h2 id="begin">开始</h2>

<h3 id="new respontory">新建一个仓库</h3>

* 如果没有Github帐号，首先[注册一个][register]。
* 接下来新建一个仓库

**注：**Repository name(仓库名)必须是 `yourusername.github.io`

比如我的用户名是loshine，那么我的这个仓库名就是`loshine.github.io`

[register]: https://github.com/


<h3 id="clone">clone到本地</h3>

使用Github客户端或者Git命令行工具将这个项目clone到本地。


<h3 id="update index">上传页面</h3>

之后，新建一个`index.html`文件，push到对应的**master**分支（推荐官网教程）。等一段时间之后（可以听首歌），网站生效，访问`yourusername.github.io`，就能看见完整的网页了。

<br>

<h2 id="build">建造</h2>

<h3 id="build environment">搭建本地环境</h3>

由于我们使用Jekell来将markdown文件生成博客文章，所以我们需要搭建本地的Jekyll环境。

1. **Ruby** - Mac已经自带了Ruby，所以无需再次安装。如果是其它系统且没有安装Ruby，请[安装Ruby环境][ruby]。
2. **Bundler** - 打开终端输入`sudo gem install bundler`以安装。
3. **github-pages** - 打开终端输入`sudo gem install github-pages`以安装。
3. **Jekyll** - 打开终端输入`sudo gem install jekyll`以安装。

**注**: 如果你在墙内则可能会出现无法安装的问题，可以通过将Gem源更换为[淘宝镜像源][taobaoGem]解决。

[ruby]: https://www.ruby-lang.org/en/downloads/
[taobaoGem]: http://ruby.taobao.org/

<h3 id="use jekyll">Jekyll的使用</h3>

1. 在我们之前创建的仓库下新建一个文件，命名为**Gemfile**，并写入`gem 'github-pages'`。
2. 在仓库目录下打开命令行工具，输入`bundle install`。
3. 在命令行工具中输入`bundle exec jekyll serve`，按提示打开地址，就可以在本地进行查看和调试网站了。

<h3 id="jekyll dictionary">Jekyll目录解析</h3>


	|—— _config.yml
	|—— _includes
	    |—— footer.html
	    |—— header.html
	|—— _layouts
	    |—— default.html
	    |—— post.html
	|—— _posts
	    |—— 2015-04-09-welcome-to-jekyll.md
	    |—— 2015-08-17-使用Jekyll在Github-Pages上搭建个人博客.md
	|—— _site
	|—— Gemfile
	|—— Gemfile.lock
	|—— index.html
