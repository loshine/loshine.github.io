---
title: Java中的模板方法模式
date: 2015-08-25 13:50:30
tags: [Java, 设计模式]
---
准备一个抽象类，将部分逻辑以具体方法以及具体构造子的形式实现，然后声明一些抽象方法来迫使子类实现剩余逻辑。不同的子类可以以不同的方式实现这些抽象方法，从而对剩余的逻辑有不同的实现。模版方法模式是基于继承的代码复用的基本技术。

# 目录

* [结构](#structure)
* [在Servlet中的应用](#application)

<h1 id="structure">结构</h1>

模板方法模式需要开发抽象类和具体子类的设计师之间的协作。一个设计师负责给出一个算法的轮廓和骨架，另一些设计师则负责给出这个算法的各个逻辑步骤。代表这些具体逻辑步骤的方法称做**基本方法**(primitive method)；而将这些基本方法汇总起来的方法叫做**模板方法**(template method)，这个设计模式的名字就是从此而来。

模板方法所代表的行为称为顶级行为，其逻辑称为顶级逻辑。模板方法模式的静态结构图如下所示：

![](http://7xl94a.com1.z0.glb.clouddn.com/123123123.png)

这里涉及到两个角色：

**抽象模板(Abstract Template)角色：**

* 定义了一个或多个抽象操作，以便让子类实现。这些抽象操作叫做基本操作，它们是一个顶级逻辑的组成步骤。
* 定义并实现了一个模板方法。这个模板方法一般是一个具体方法，它给出了一个顶级逻辑的骨架，而逻辑的组成步骤在相应的抽象操作中，推迟到子类实现。顶级逻辑也有可能调用一些具体方法。

**具体模板(Concrete Template)角色：**

* 实现父类所定义的一个或多个抽象方法，它们是一个顶级逻辑的组成步骤。
* 每一个抽象模板角色都可以有任意多个具体模板角色与之对应，而每一个具体模板角色都可以给出这些抽象方法（也就是顶级逻辑的组成步骤）的不同实现，从而使得顶级逻辑的实现各不相同。

## 示例代码

抽象模板角色类，`abstractMethod()`、`doHookMethod()`等基本方法是顶级逻辑的组成步骤，这个顶级逻辑由`templateMethod()`方法代表。

```java
public abstract class AbstractTemplate {
    
    /**
     * 模板方法
     */
    public void templateMethod(){
        // 调用基本方法
        abstractMethod();
        doHookMethod();
        concreteMethod();
    }
    
    /**
     * 抽象方法，子类必须实现的方法
     */
    protected abstract void abstractMethod();
    
    /**
     * 钩子方法，子类可选择是否实现。注意钩子方法一般以 do 开头
     */
    protected void doHookMethod(){}
    
    /**
     * 具体方法，由父类实现，子类无法 override
     */
    private final void concreteMethod(){
        // 业务相关的代码
    }
}
```

具体模板角色类，实现了父类所声明的基本方法，`abstractMethod()`方法所代表的就是强制子类实现的剩余逻辑，而`doHookMethod()`方法是可选择实现的逻辑，不是必须实现的。

```java
public class ConcreteTemplate extends AbstractTemplate {
    
    // 基本方法的实现
    @Override
    public void abstractMethod() {
        // 业务相关的代码
    }
    
    // 重写父类的方法
    @Override
    public void hookMethod() {
        // 业务相关的代码
    }
}
```

**模板方法模式的关键**：*子类可以置换掉父类的可变部分，但是子类却不可以改变模板方法所代表的顶级逻辑*。
 
每当定义一个新的子类时，不要按照控制流程的思路去想，而应当按照**责任**的思路去想。换言之，应当考虑哪些操作是必须置换掉的，哪些操作是可以置换掉的，以及哪些操作是不可以置换掉的。使用模板模式可以使这些责任变得清晰。

<h1 id="application">在Servlet中的应用</h1>

使用过Servlet的人都清楚，除了要在web.xml做相应的配置外，还需继承一个叫HttpServlet的抽象类。HttpService类提供了一个`service()`方法，这个方法调用七个do方法中的一个或几个，完成对客户端调用的响应。这些do方法需要由HttpServlet的具体子类提供，因此这是典型的**模板方法模式**。下面是`service()`方法的源代码：

```java
    protected void service(HttpServletRequest req, HttpServletResponse resp)
        throws ServletException, IOException {
 
        String method = req.getMethod();
 
        if (method.equals(METHOD_GET)) {
            long lastModified = getLastModified(req);
            if (lastModified == -1) {
                // servlet doesn't support if-modified-since, no reason
                // to go through further expensive logic
                doGet(req, resp);
            } else {
                long ifModifiedSince = req.getDateHeader(HEADER_IFMODSINCE);
                if (ifModifiedSince < (lastModified / 1000 * 1000)) {
                    // If the servlet mod time is later, call doGet()
                    // Round down to the nearest second for a proper compare
                    // A ifModifiedSince of -1 will always be less
                    maybeSetLastModified(resp, lastModified);
                    doGet(req, resp);
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
                }
            }
 
        } else if (method.equals(METHOD_HEAD)) {
            long lastModified = getLastModified(req);
            maybeSetLastModified(resp, lastModified);
            doHead(req, resp);
 
        } else if (method.equals(METHOD_POST)) {
            doPost(req, resp);
 
        } else if (method.equals(METHOD_PUT)) {
            doPut(req, resp);       
 
        } else if (method.equals(METHOD_DELETE)) {
            doDelete(req, resp);
 
        } else if (method.equals(METHOD_OPTIONS)) {
            doOptions(req,resp);
 
        } else if (method.equals(METHOD_TRACE)) {
            doTrace(req,resp);
 
        } else {
            //
            // Note that this means NO servlet supports whatever
            // method was requested, anywhere on this server.
            //
 
            String errMsg = lStrings.getString("http.method_not_implemented");
            Object[] errArgs = new Object[1];
            errArgs[0] = method;
            errMsg = MessageFormat.format(errMsg, errArgs);
 
            resp.sendError(HttpServletResponse.SC_NOT_IMPLEMENTED, errMsg);
        }
    }
```

当然，这个`service()`方法也可以被子类置换掉。
 
下面给出一个简单的 Servlet 例子：
 
TestServlet 类是 HttpServlet 类的子类，并且置换掉了父类的两个方法：`doGet()`和`doPost()`：

```java
    public class TestServlet extends HttpServlet {
     
        public void doGet(HttpServletRequest request, HttpServletResponse response)
                throws ServletException, IOException {
     
            System.out.println("using the GET method");
 
        }
     
        public void doPost(HttpServletRequest request, HttpServletResponse response)
                throws ServletException, IOException {
     
            System.out.println("using the POST method");
        }
     
    }
```

从上面的例子可以看出这是一个典型的模板方法模式。
 
HttpServlet 担任抽象模板角色
 
* **模板方法**：由`service()`方法担任。
* **基本方法**：由`doPost()`、`doGet()`等方法担任。
 
TestServlet 担任具体模板角色
 
* TestServlet 置换掉了父类 HttpServlet 中七个基本方法中的其中两个，分别是`doGet()`和`doPost()`。
