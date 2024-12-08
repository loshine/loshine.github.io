---
title: KSP
date: 2024-12-01 17:47:00
category: [技术]
tags: [Android, Kotlin]
toc: true
thumbnail: https://s2.loli.net/2024/12/01/OEdnXUkwIRMT2CG.png
---

Kotlin 符号处理（KSP）是一种 API，您可以用它来开发轻量级编译器插件。KSP 提供了一个简化的编译器插件 API，可充分利用 Kotlin 的强大功能，同时将学习曲线保持在最低水平。与 kapt 相比，使用 KSP 的注释处理器运行速度最多可提高两倍。

<!-- more -->

# KSP



## What is KSP

借用官网的内容

> Kotlin 符号处理（KSP）是一种 API，您可以用它来开发轻量级编译器插件。KSP 提供了一个简化的编译器插件 API，可充分利用 Kotlin 的强大功能，同时将学习曲线保持在最低水平。与 kapt 相比，使用 KSP 的注释处理器运行速度最多可提高两倍。

直白的意思就是说，可以读取 Kotlin 文件中的注释，在编译过程中对注解和其注解的内容进行处理的一个框架。

常见的使用方式如使用注解处理器搭配 KPoet生成模板代码(如 ButterKnife、Room)，或者使用注解处理器搭配 ASM 或 KASM 在编译期进行字节码插桩以实现面向切面编程。



## Why KSP

简单的说，对比 kapt 而言 KSP 的性能更高，不依赖于 JVM 平台，API 设计以 Kotlin 的语法为目标，更易使用也更加容易理解。

> kapt 将 Kotlin 代码编译成 Java 存根，这些存根保留了 Java 注释处理器关心的信息，但也拖慢了速度。生成存根的成本大约是完整 kotlinc 分析的 1/3，这个过程可能比很多注解处理器耗费的时间还长。



## Quick Start

参照官网教程



### 创建自定义处理器

1. 创建 Kotlin 项目
2. 在项目中引入 ksp 依赖

```kotlin
dependencies {
  implementation("com.google.devtools.ksp:symbol-processing-api:2.1.0-1.0.29")
}
```

3. 创建自定义注解

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class TestAnnotation
```

4. 实现 SymbolProcessor

```kotlin
class TestSymbolProcessor(private val environment: SymbolProcessorEnvironment) : SymbolProcessor {

    /**
     * 由Kotlin符号处理调用来运行处理任务。
     * Params:
     * 解析器-为SymbolProcessor提供对编译器详细信息的访问权限，例如符号。
     * Returns:
     * 处理器无法处理的延迟符号列表。只应返回本轮无法处理的符号。编译代码（库）中的符号始终有效，如果在延迟列表中返回，则会被忽略。
     */
    override fun process(resolver: Resolver): List<KSAnnotated> {
        environment.logger.warn("TestSymbolProcessor begin process!")
        val symbols = resolver.getSymbolsWithAnnotation(TestAnnotation::class.qualifiedName!!)
        val list = mutableListOf<KSAnnotated>()
        symbols.forEach { symbol ->
            if (!symbol.validate())
                list.add(symbol)
            else
                symbol.accept(TestSymbolVisitor(environment), Unit)
        }
        return list
    }
}
```

5. 实现 SymbolProcessorProvider

```kotlin
class TestSymbolProcessorProvider : SymbolProcessorProvider {
    override fun create(environment: SymbolProcessorEnvironment): SymbolProcessor {
        return TestSymbolProcessor(environment)
    }
}
```

6. 实现 KSVisitor

```kotlin
class TestSymbolVisitor(private val environment: SymbolProcessorEnvironment) : KSVisitorVoid() {
    override fun visitClassDeclaration(classDeclaration: KSClassDeclaration, data: Unit) {
        // 因为我们定义的注解是一个目标是 CLASS 的所以我们在 visit class 里处理就行
        if (classDeclaration.annotations.any { it.annotationType.resolve().declaration.qualifiedName?.asString() == TestAnnotation::class.qualifiedName }) {
            // 打印出被注解的类的全名
            environment.logger.warn(classDeclaration.qualifiedName?.asString() ?: "")
        }
    }
}
```



`symbol.accept` 方法的第一个参数需要传入一个 `KSVisitor<D, R>`。D 是上下文或数据，R 是返回值。一般情况下如果不需要传递上下文(数据) 以及不需要返回值，使用 `KSVisitorVoid` 即可。

KSVisitor 提供了 `visitX` 系列方法，以及一个保底的 `visitNode` 方法，在里面可以拦截对应扫描到类、注解、方法、参数等，这样就可以进行对应的处理了。

比如利用 KPoet 生成 Kotlin 代码。

```kotlin
interface KSVisitor<D, R> {
    fun visitNode(node: KSNode, data: D): R

    // 处理被注解标注的元素
    fun visitAnnotated(annotated: KSAnnotated, data: D): R

    // 处理注解本身
    fun visitAnnotation(annotation: KSAnnotation, data: D): R

    // 处理修饰符的拥有者
    fun visitModifierListOwner(modifierListOwner: KSModifierListOwner, data: D): R

    // 处理声明??
    fun visitDeclaration(declaration: KSDeclaration, data: D): R

    // 处理声明容器??
    fun visitDeclarationContainer(declarationContainer: KSDeclarationContainer, data: D): R

    // 处理动态引用??
    fun visitDynamicReference(reference: KSDynamicReference, data: D): R

    // 处理一个 Kotlin 文件
    fun visitFile(file: KSFile, data: D): R

    // 处理函数声明（KSFunctionDeclaration），包括普通函数和扩展函数。
    fun visitFunctionDeclaration(function: KSFunctionDeclaration, data: D): R

    // 处理函数引用
    fun visitCallableReference(reference: KSCallableReference, data: D): R

    // 处理括号内的引用(lambda 里的 it 或其它命名的引用)
    fun visitParenthesizedReference(reference: KSParenthesizedReference, data: D): R

    // 处理属性声明
    fun visitPropertyDeclaration(property: KSPropertyDeclaration, data: D): R

    // 处理属性的 setter getter
    fun visitPropertyAccessor(accessor: KSPropertyAccessor, data: D): R

    // 处理属性的 getter
    fun visitPropertyGetter(getter: KSPropertyGetter, data: D): R

    // 处理属性的 setter
    fun visitPropertySetter(setter: KSPropertySetter, data: D): R

    // 处理引用元素
    fun visitReferenceElement(element: KSReferenceElement, data: D): R

    // 处理类型别名
    fun visitTypeAlias(typeAlias: KSTypeAlias, data: D): R

    // 处理类型参数
    fun visitTypeArgument(typeArgument: KSTypeArgument, data: D): R

    // 处理类声明
    fun visitClassDeclaration(classDeclaration: KSClassDeclaration, data: D): R

    // 处理类型参数，例如泛型类型中的 T。
    fun visitTypeParameter(typeParameter: KSTypeParameter, data: D): R

    // 处理类型引用，例如函数或属性的类型。
    fun visitTypeReference(typeReference: KSTypeReference, data: D): R

    // 处理注解或函数调用的参数（KSValueArgument）。
    fun visitValueParameter(valueParameter: KSValueParameter, data: D): R

    // 处理函数或构造函数的参数声明（KSValueParameter）。
    fun visitValueArgument(valueArgument: KSValueArgument, data: D): R

    // 处理类、接口和对象的引用
    fun visitClassifierReference(reference: KSClassifierReference, data: D): R

    // 处理非空引用
    fun visitDefNonNullReference(reference: KSDefNonNullReference, data: D): R
}
```

