---
title: Kotlin CoroutineContext
date: 2024-12-08 20:02:00
category: [技术]
tags: [Android, Kotlin]
toc: true
thumbnail: https://s2.loli.net/2024/12/08/kPahmsBMnyl3EuI.png
---

CoroutineContext 是协程中的一个重要概念，我们可以通过它来调度协程执行、进行异常处理、跟踪协程层级关系以及携带协程作用域信息。本文通过启动协程的源码，尝试分析其数据结构以及传递机制。

<!-- more -->

# Kotlin CoroutineContext

## What is CoroutineContext

通常我们启动一个协程，通过 `CoroutineScope.launch` 来启动，需要传入三个参数，其中第一个参数就是 `CoroutineContext`。

```kotlin
public fun CoroutineScope.launch(
    context: CoroutineContext = EmptyCoroutineContext,
    start: CoroutineStart = CoroutineStart.DEFAULT,
    block: suspend CoroutineScope.() -> Unit
): Job {
    val newContext = newCoroutineContext(context)
    val coroutine = if (start.isLazy)
        LazyStandaloneCoroutine(newContext, block) else
        StandaloneCoroutine(newContext, active = true)
    coroutine.start(start, coroutine, block)
    return coroutine
}
```

通过初步学习协程我们知道，`CoroutineContext` 是协程运行时的一种上下文环境，提供了一种机制，用来定义协程的行为和执行环境。每个协程都会关联一个 `CoroutineContext`，这个上下文包含了一组元素，可以用于控制协程的执行。

下面是 `CoroutineContext` 类的定义，其注释如下

> 协程的持久上下文。它是 Element 实例的索引集合。索引集合是 Set 和 Map 的混合体。这个集合中的每个 Element 都有一个唯一的 Key。

```kotlin
@SinceKotlin("1.3")
public interface CoroutineContext {
    /**
     * 返回此上下文中具有给定 [key] 的 Element 或 `null`。
     */
    public operator fun <E : Element> get(key: Key<E>): E?

    /**
     * 从[初始]值开始累加该上下文的条目，并对当前累加器值和该上下文的每个元素从左至右应用[operation]。
     */
    public fun <R> fold(initial: R, operation: (R, Element) -> R): R

    /**
     * 返回包含本上下文 Element 和其他 [context] Element 的上下文。
     * 该上下文中与另一上下文中 Key 相同的 Element 将被删除。
     */
    public operator fun plus(context: CoroutineContext): CoroutineContext =
        if (context === EmptyCoroutineContext) this else // 快速通道 -- 避免创建 lambda
            context.fold(this) { acc, element ->
                val removed = acc.minusKey(element.key)
                if (removed === EmptyCoroutineContext) element else {
                    // 确保拦截器在上下文中总是最后一个（因此在出现时可以快速获取）
                    val interceptor = removed[ContinuationInterceptor]
                    if (interceptor == null) CombinedContext(removed, element) else {
                        val left = removed.minusKey(ContinuationInterceptor)
                        if (left === EmptyCoroutineContext) CombinedContext(element, interceptor) else
                            CombinedContext(CombinedContext(left, element), interceptor)
                    }
                }
            }

    /**
     * 返回包含此上下文中元素的上下文，但不包含指定 [key] 的元素。
     */
    public fun minusKey(key: Key<*>): CoroutineContext

    /**
     * [CoroutineContext] Element 的密钥。[E]是具有此关键字的 Element 类型。
     */
    public interface Key<E : Element>

    /**
     * [CoroutineContext] 的一个 Element。协程上下文的 Element 本身就是一个单例上下文。
     */
    public interface Element : CoroutineContext {
        /**
         * 该例程上下文元素的密钥。
         */
        public val key: Key<*>

        public override operator fun <E : Element> get(key: Key<E>): E? =
            @Suppress("UNCHECKED_CAST")
            if (this.key == key) this as E else null

        public override fun <R> fold(initial: R, operation: (R, Element) -> R): R =
            operation(initial, this)

        public override fun minusKey(key: Key<*>): CoroutineContext =
            if (this.key == key) EmptyCoroutineContext else this
    }
}
```

可以看到该接口的定义是非常简单的，它主要定义了本身的数据结构：Element 的索引集合(Set 和 Map 的混合体)，以及该数据结构的一系列操作：

* `get`：根据 Key 获取对应的 Element(不存在时返回 null)
* `fold`: 累加 CoroutineContext
* `plus`: 重载 `+` 操作符，实现多个 CoroutineContext 的相加操作，在相加的过程中会把重复 [Key] 的 `CoroutineContext` 移除，并将 `ContinuationInterceptor` 类型放到最后
* `minusKey`： 从当前上下文中去除含有 key 的 CoroutineContext 并返回自身

`Element` 接口就是一个很简单的具有 Key 和 CoroutineContext 的类。

### EmptyCoroutineContext

上述代码中我们可以看到 `EmptyCoroutineContext` 和 `CoroutineContext`，这里查看 `EmptyCoroutineContext` 的源码发现它是一个空实现，结合在 `CoroutineContext` 以及 `launch` 方法不难发现，这就是一个空 `CoroutineContext`，作为一个占位来使用，内部没有任何特殊的定义和作用。

```kotlin
@SinceKotlin("1.3")
public object EmptyCoroutineContext : CoroutineContext, Serializable {
    private const val serialVersionUID: Long = 0
    private fun readResolve(): Any = EmptyCoroutineContext

    public override fun <E : Element> get(key: Key<E>): E? = null
    public override fun <R> fold(initial: R, operation: (R, Element) -> R): R = initial
    public override fun plus(context: CoroutineContext): CoroutineContext = context
    public override fun minusKey(key: Key<*>): CoroutineContext = this
    public override fun hashCode(): Int = 0
    public override fun toString(): String = "EmptyCoroutineContext"
}
```

### CombinedContext

`CombinedContext` 是 `CoroutineContext` 数据结构的基础，它持有一个 `left` 指向自身左边的 `CoroutineContext`，`element` 则代表自身持有的 `CoroutineContext`，多个不同的 `CombinedContext` 相连则组成了一个单向链表结构。

> 这里注意 size 最小是 2，这是因为只有当有 2 个元素或以上，才会使用到 `CombinedContext`。

```kotlin
@SinceKotlin("1.3")
internal class CombinedContext(
    private val left: CoroutineContext,
    private val element: Element
) : CoroutineContext, Serializable {

    override fun <E : Element> get(key: Key<E>): E? {
        var cur = this
        while (true) {
            cur.element[key]?.let { return it }
            val next = cur.left
            if (next is CombinedContext) {
                cur = next
            } else {
                return next[key]
            }
        }
    }

    public override fun <R> fold(initial: R, operation: (R, Element) -> R): R =
        operation(left.fold(initial, operation), element)

    public override fun minusKey(key: Key<*>): CoroutineContext {
        element[key]?.let { return left }
        val newLeft = left.minusKey(key)
        return when {
            newLeft === left -> this
            newLeft === EmptyCoroutineContext -> element
            else -> CombinedContext(newLeft, element)
        }
    }

    private fun size(): Int {
        var cur = this
        var size = 2
        while (true) {
            cur = cur.left as? CombinedContext ?: return size
            size++
        }
    }

    private fun contains(element: Element): Boolean =
        get(element.key) == element

    private fun containsAll(context: CombinedContext): Boolean {
        var cur = context
        while (true) {
            if (!contains(cur.element)) return false
            val next = cur.left
            if (next is CombinedContext) {
                cur = next
            } else {
                return contains(next as Element)
            }
        }
    }

    override fun equals(other: Any?): Boolean =
        this === other || other is CombinedContext && other.size() == size() && other.containsAll(this)

    override fun hashCode(): Int = left.hashCode() + element.hashCode()

    override fun toString(): String =
        "[" + fold("") { acc, element ->
            if (acc.isEmpty()) element.toString() else "$acc, $element"
        } + "]"

    private fun writeReplace(): Any {
        val n = size()
        val elements = arrayOfNulls<CoroutineContext>(n)
        var index = 0
        fold(Unit) { _, element -> elements[index++] = element }
        check(index == n)
        @Suppress("UNCHECKED_CAST")
        return Serialized(elements as Array<CoroutineContext>)
    }

    private class Serialized(val elements: Array<CoroutineContext>) : Serializable {
        companion object {
            private const val serialVersionUID: Long = 0L
        }

        private fun readResolve(): Any = elements.fold(EmptyCoroutineContext, CoroutineContext::plus)
    }
}
```

## How CoroutineContext work

### CoroutineContext 如何传递

还是从 `launch` 方法继续出发，其第一行调用了 `newCoroutineContext` 方法

```kotlin
@ExperimentalCoroutinesApi
public actual fun CoroutineScope.newCoroutineContext(context: CoroutineContext): CoroutineContext {
    val combined = foldCopies(coroutineContext, context, true)
    val debug = if (DEBUG) combined + CoroutineId(COROUTINE_ID.incrementAndGet()) else combined
    return if (combined !== Dispatchers.Default && combined[ContinuationInterceptor] == null)
        debug + Dispatchers.Default else debug
}

private fun foldCopies(originalContext: CoroutineContext, appendContext: CoroutineContext, isNewCoroutine: Boolean): CoroutineContext {
    // 我们有东西要复制到左手边吗？
    val hasElementsLeft = originalContext.hasCopyableElements()
    val hasElementsRight = appendContext.hasCopyableElements()

    // 无需折叠，只需返回上下文的总和。
    if (!hasElementsLeft && !hasElementsRight) {
        return originalContext + appendContext
    }

    var leftoverContext = appendContext
    val folded = originalContext.fold<CoroutineContext>(EmptyCoroutineContext) { result, element ->
        if (element !is CopyableThreadContextElement<*>) return@fold result + element
        // 该元素会被覆盖吗？
        val newElement = leftoverContext[element.key]
        // 不，复制即可
        if (newElement == null) {
            // 对于类似于 "withContext "的构建器，我们不会复制，因为元素不是共享的
            return@fold result + if (isNewCoroutine) element.copyForChild() else element
        }
        // 是，那么首先从追加上下文中移除元素
        leftoverContext = leftoverContext.minusKey(element.key)
        // 返回总和
        @Suppress("UNCHECKED_CAST")
        return@fold result + (element as CopyableThreadContextElement<Any?>).mergeForChild(newElement)
    }

    if (hasElementsRight) {
        leftoverContext = leftoverContext.fold<CoroutineContext>(EmptyCoroutineContext) { result, element ->
            // 我们正在添加新的上下文元素 -- 我们必须复制它，否则它可能会被其他人共享
            if (element is CopyableThreadContextElement<*>) {
                return@fold result + element.copyForChild()
            }
            return@fold result + element
        }
    }
    return folded + leftoverContext
}
```

该代码是通过 `foldCopies` 方法对父协程的 `CoroutineContext` 和 `launch` 方法启动传入的 `CoroutineContext` 进行组合并复制了一份拷贝作为子协程的 `CoroutineContext`。

这也是协程传递 `CoroutineContext` 的核心逻辑。

### CoroutineContext 如何作用

我们以默认参数的 `launch` 方法为例，默认会创建一个 `StandaloneCoroutine` 调用其 `start` 方法，`StandaloneCoroutine` 是一个 `AbstractCoroutine`，其持有了上面合并后的 Context。而 `AbstractCoroutine` 也在 `init` 块里初始化了 Job 和父子 Job 的关联，这里就不具体展开了。

```kotlin
@OptIn(InternalForInheritanceCoroutinesApi::class)
@InternalCoroutinesApi
public abstract class AbstractCoroutine<in T>(
    parentContext: CoroutineContext,
    initParentJob: Boolean,
    active: Boolean
) : JobSupport(active), Job, Continuation<T>, CoroutineScope {

    public final override val context: CoroutineContext = parentContext + this
}
```

我们知道当协程执行时，会通过 `Continuation` 接口传递这个 CoroutineContext

```kotlin
public interface Continuation<in T> {
    public val context: CoroutineContext
    public fun resumeWith(result: Result<T>)
}
```

状态机生成的代码会使用这个 CoroutineContext 来:

* 调度协程执行(通过 Dispatcher)
* 进行异常处理(通过 CoroutineExceptionHandler)
* 跟踪协程层级关系(通过 Job)
* 携带协程作用域信息(通过 CoroutineName 等)