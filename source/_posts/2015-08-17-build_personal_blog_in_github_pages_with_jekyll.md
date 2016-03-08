---
title: 使用Jekyll在Github-Pages上搭建个人博客
date: 2015-08-17 10:12:30
category: [技术]
tags: [jekyll, github, github-page]
toc: true
description: 我的个人博客也在Github-Pages上搭建起来了，其中各个步骤参照了[《“授人以渔”的教你搭建个人独立博客》——Azure Yu][site1]、[《Using Jekyll with Pages》][site2]。鄙人于此也作一下**使用Jekyll在Github-Pages上搭建个人博客**的总结，也可以给其他后来者做一些参考。
---
> 我的个人博客也在Github-Pages上搭建起来了，其中各个步骤参照了[《“授人以渔”的教你搭建个人独立博客》——Azure Yu][site1]、[《Using Jekyll with Pages》][site2]。鄙人于此也作一下**使用Jekyll在Github-Pages上搭建个人博客**的总结，也可以给其他后来者做一些参考。
> 
> 本文默认读者已经拥有了Github的帐号，并且对Git的使用较为熟练。如果对Git以及Github不是很了解，可以参考[《版本控制入门 – 搬进 Github》][site3]。
> 
> 在这个过程中可能需要使用到少许的Ruby知识，如果您需要学习，可以看[这里][site4]

[site1]: http://azureyu.com/blog/2015/08/15/HowToBulidBlog.html
[site2]: https://help.github.com/articles/using-jekyll-with-pages/
[site3]: http://www.imooc.com/learn/390
[site4]: http://saito.im/slide/ruby-new.html

# 开始

## 新建一个仓库

* 如果没有Github帐号，首先[注册一个][register]。
* 接下来新建一个仓库

**注：**Repository name(仓库名)必须是 `yourusername.github.io`

比如我的用户名是loshine，那么我的这个仓库名就是`loshine.github.io`

[register]: https://github.com/

## clone到本地

使用Github客户端或者Git命令行工具将这个项目clone到本地。

## 上传页面

之后，新建一个`index.html`文件，push到对应的**master**分支（推荐官网教程）。等一段时间之后（可以听首歌），网站生效，访问`yourusername.github.io`，就能看见完整的网页了。
<h1 id="build">建造</h1>

## 搭建本地环境

由于我们使用Jekell来将markdown文件生成博客文章，所以我们需要搭建本地的Jekyll环境。

1. **Ruby** - Mac已经自带了Ruby，所以无需再次安装。如果是其它系统且没有安装Ruby，请[安装Ruby环境][ruby]。
2. **Bundler** - 打开终端输入`gem install bundler`以安装。
3. **github-pages** - 打开终端输入`gem install github-pages`以安装。
3. **Jekyll** - 打开终端输入`gem install jekyll`以安装。

**注**: 如果你在墙内则可能会出现无法安装的问题，可以通过将Gem源更换为[淘宝镜像源][taobaoGem]解决。

[ruby]: https://www.ruby-lang.org/en/downloads/
[taobaoGem]: http://ruby.taobao.org/

## Jekyll的使用

1. 在我们之前创建的仓库下新建一个文件，命名为**Gemfile**，并写入`gem 'github-pages'`。
2. 在仓库目录下打开命令行工具，输入`bundle install`。
3. 在命令行工具中输入`bundle exec jekyll serve`，按提示打开地址，就可以在本地进行查看和调试网站了。

## Jekyll目录解析

```
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
|—— css
    |—— *.css
|—— script
    |—— *.js
|—— Gemfile
|—— Gemfile.lock
|—— index.html
```

接下来按顺序介绍一下以上文件目录树的每一个文件夹以及文件的作用。

* `_config.yml` 配置文件，你可以在里面配置你博客会用到的常量，比如博客名，邮件
* `_includes` 文章各个部分的html文件，可以在布局中包含这些文件
* `_layouts` 存放模板。就是你网页的布局，主页布局，文章布局。当然不是指CSS那样的布局，是指，你包含哪些基本的内容到页面上。包含的内容就是includes里面的文件。
* `_posts` 存放博客文章
* `CNAME` 域名地址
* `css` 存放博客所用css
* `script` 存放博客所用JavaScript
* `index.html` 博客主页
<h1 id="write blog">写博客</h1>

博客文章都是用[markdown格式][markdown]书写，命名格式为*时间加标题*，形如：`2015-08-17-使用Jekyll在Github-Pages上搭建个人博客.md`

文章需要在开头位置加入一段特殊的文字，其中定义了使用到的**样式**、**文章标题**、**时间**、**分类**。

```md
---
layout: post
title: "Welcome to Jekyll!"
date: 2014-01-27 21:57:11
categories: Blog
---
```

完成了以上的步骤，就可以开始撰写博客了。写完之后记得把它放入`_post`文件夹中，并同步到Github上哦。

[markdown]: http://wowubuntu.com/markdown/

# 装修

## 使用模板

之前在[Jekyll目录解析](#jekyll dictionary)中我们大致了解了各个目录的结构。如果您是一名资深的前端工程师，那么就可以直接开始编写自己喜欢的样式的博客了。如果您对于前端并不是那么擅长，那么您可以直接在[Jekyll 主题][theme]中选择自己喜欢的主题并放入到自己的项目中去。

以我的博客为例，我选择了[Pithy][theme-pithy]主题，将其下载了下来，然后放入了自己的项目中，覆盖已有的文件，然后在终端中输入`bundle exec jekyll serve`运行jekyll服务器，打开`http://localhost:4000`就可以查看到效果了。

[theme]: http://jekyllthemes.org/
[theme-pithy]: http://jekyllthemes.org/themes/pithy/

## 自定义样式

如果您不是一名资深的前端工程师但是还是想要自己定义自己博客的样式。那么我推荐您[Run Noob][run noob]、[w3cschool][w3cschool]这两个地方学习前端知识。之后您就可以根据自己的需求装点自己的博客了。

[run noob]: http://www.runoob.com/
[w3cschool]: http://www.w3school.com.cn/

# 定制

## 使用独立域名

* 新建一个文件，命名为**CNAME**，然后在里面写入你需要绑定的独立域名就可以了。
* 在你的域名服务商处添加解析地址。

完成以上步骤你就可以使用自己的独立域名了。

## 添加评论功能

### 多说

多说评论对国内的社交帐号支持不错，自定义性也很强，是一个不错的选择。

* 登录[多说][ds]，创建一个项目，拷贝你的**通用代码**。
* 在`_include`文件夹里新建一个`comment.html`文件，将通用代码粘贴进去。
* 修改**通用代码**中需要配置的地方

```html
<div class="ds-thread" data-thread-key="请将此处替换成文章在你的站点中的ID"
    data-title="请替换成文章的标题" data-url="请替换成文章的网址"></div>
```

修改为

```html
<div class="ds-thread" data-thread-key="【 page.id 】"
    data-title="【 page.title 】" data-url="your web site【 page.url 】"></div>
```

注意`【】`需要替换为**两个大括号**，`your web site`需替换为**您的域名地址**。

* 在`_layout`中的`post.html`中的底部加入`【% include comment.html %】`（【】须替换为{}）
* 在**多说**的控制台里你可以设置很多自定义项，如：评论审核、评论显示方式、关键词过滤、主题、自定义CSS等

[ds]: http://duoshuo.com/

### Disqus

Disqus支持使用Disqus、Facebook、Twitter以及Google帐号登录，如果你的博客不是主要面向国内普通用户的话，可以考虑使用Disqus。

* [注册Disqus][disqus]
* 右上角设置项中选择`Add Disqus To Site`，按步骤走，最后复制生成的**Universal Code**
* 其它部分类似如上的集成多说操作，*但不需要自己修改代码了*
* Disqus也有控制台可以对评论进行操作

**注意**：Disqus在国内的访问速度可能比较慢，可能需要慎重考虑使用。

[disqus]: https://disqus.com/

# 参考

* [《“授人以渔”的教你搭建个人独立博客》——Azure Yu][site1]
* [官方文档][official documents]

[official documents]: https://help.github.com/categories/github-pages-basics/
