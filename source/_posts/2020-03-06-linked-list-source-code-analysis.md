---
title: LinkedList 源码解析
date: 2020-03-06 15:41:00
category: [技术]
tags: [Java]
toc: true
thumbnail: https://i.imgur.com/OMNu4cD.png
---

LinkedList 是有序双向链表，本文分析其源码和实现原理。

<!-- more -->

## 定义

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
```

LinkedList 继承了 AbstractSequentialList，实现了 List, Deque, Cloneable, Serializable 接口。

## 初始化

要使用一个 LinkedList，首先我们要初始化它。

查看源码发现 LinkedList 有两个构造方法：

```java
transient int size = 0;

/**
 * 指向第一个节点的指针。
 */
transient Node<E> first;

/**
 * 指向最后一个节点的指针。
 */
transient Node<E> last;

/**
 * 构造一个空列表。
 */
public LinkedList() {
}

/**
 * 构造一个包含指定集合元素的列表，其顺序由集合的迭代器返回。
 *
 * @param  c 放入此列表的元素的集合
 * @throws NullPointerException 如果集合为 null
 */
public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

一个初始化完毕的空 LinkedList 拥有三个属性：第一个节点`first`，最后一个节点`last`和大小`size`。

另一个重载方法调用了`addAll`方法将集合元素添加到链表。

### Node 结构

Node 类保存了节点当前元素，前一个节点和下一个节点的引用。

```java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;

    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

## 常用方法解析

### node(int index)

该方法是此类的一个重要方法，用于查找对应 index 位置的节点。如果 index 在链表前一半，则从 first 一个个向下遍历找出节点；否则从 last 一个个向前找出节点。

```java
/**
 * 返回指定元素索引处的（非空）节点。
 */
Node<E> node(int index) {
    if (index < (size >> 1)) {
        Node<E> x = first;
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

### 添加元素

#### add(E e), add(int index, E element), addFirst(E e), addLast(E e)

`add`方法是 List 接口的方法，`addFirst`和`addLast`是 Deque 接口的方法。

代码都非常简单，链接到表头或末尾时，检查相邻元素，若为 null 则此元素既是 first 又是 last。

```java
/**
 * 将指定的元素追加到此列表的末尾。和 addLast 效果相同。
 *
 * @param e 要添加到此列表的元素
 * @return true
 */
public boolean add(E e) {
    linkLast(e);
    return true;
}

public void add(int index, E element) {
    checkPositionIndex(index);

    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}

/**
 * 将指定的元素插入此列表的开头。
 *
 * @param e 要添加到此列表的元素
 */
public void addFirst(E e) {
    linkFirst(e);
}

/**
 * 将指定的元素插入此列表的末尾。
 *
 * @param e 要添加到此列表的元素
 */
public void addLast(E e) {
    linkLast(e);
}

/**
 * 将e链接为第一个元素。
 */
private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    if (f == null)
        last = newNode;
    else
        f.prev = newNode;
    size++;
    modCount++;
}

/**
 * 将e链接为最后一个元素。
 */
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}

/**
 * 将元素e链接到非空节点succ前.
 */
void linkBefore(E e, Node<E> succ) {
    final Node<E> pred = succ.prev;
    final Node<E> newNode = new Node<>(pred, e, succ);
    succ.prev = newNode;
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}
```

#### addAll(Collection<? extends E> c), addAll(int index, Collection<? extends E> c)

添加集合所有元素到列表的两个重载方法。

```java
public boolean addAll(Collection<? extends E> c) {
    return addAll(size, c);
}

public boolean addAll(int index, Collection<? extends E> c) {
    checkPositionIndex(index);

    Object[] a = c.toArray();
    int numNew = a.length;
    if (numNew == 0)
        return false;

    Node<E> pred, succ;
    if (index == size) {
        succ = null;
        pred = last;
    } else {
        succ = node(index);
        pred = succ.prev;
    }

    for (Object o : a) {
        @SuppressWarnings("unchecked") E e = (E) o;
        Node<E> newNode = new Node<>(pred, e, null);
        if (pred == null)
            first = newNode;
        else
            pred.next = newNode;
        pred = newNode;
    }

    if (succ == null) {
        last = pred;
    } else {
        pred.next = succ;
        succ.prev = pred;
    }

    size += numNew;
    modCount++;
    return true;
}

private void checkPositionIndex(int index) {
    if (!isPositionIndex(index))
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}

private boolean isPositionIndex(int index) {
    return index >= 0 && index <= size;
}
```

重点看第二个重载方法，该方法大致可以分为以下几步：

1. 检查插入位置 index 是否合法，不合法则抛出 IndexOutOfBoundsException
2. 将集合转为数组，如果数组长度为 0 则不需要添加，返回 false
3. 定义两个变量`pred`(Predecessor, 前任),`succ`(Successor，后任)，如果是插入到末尾，succ 为 null，pred 为 last；否则调用`node(index)`找到第 index 个节点赋值给 succ，succ 的前一个节点赋值给 pred
4. 遍历 Array 中每一个元素链接到链表里
5. 如果 succ 为 null，把 pred 赋值给 last；否则把 succ 赋值给 pred.next, pred 赋值给 succ.prev
6. size 添加集合长度，modCount 自增，返回 true

### 删除元素

#### remove(int index)

根据索引删除元素

```java
public E remove(int index) {
    checkElementIndex(index);
    return unlink(node(index));
}

private void checkElementIndex(int index) {
    if (!isElementIndex(index))
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}

private boolean isElementIndex(int index) {
    return index >= 0 && index < size;
}

/**
 * 取消链接非空节点x。
 */
E unlink(Node<E> x) {
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;

    if (prev == null) {
        first = next;
    } else {
        prev.next = next;
        x.prev = null;
    }

    if (next == null) {
        last = prev;
    } else {
        next.prev = prev;
        x.next = null;
    }

    x.item = null;
    size--;
    modCount++;
    return element;
}
```

该方法也非常简单，检查 index 是否合法，然后找出对应索引节点，取消前后节点链接并把其前后重新链接起来。

#### remove(Object o)

删除指定元素

```java
public boolean remove(Object o) {
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```

如果 o 为 null，从 first 一个个向下遍历，找到节点为 null 的节点，并调用`unlink`方法；否则从 first 一个个向下遍历，找到对应元素调用`unlink`方法。

#### removeFirst(), removeLast()

这两个方法都非常简单，直接看源码：

```java
public E removeFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return unlinkFirst(f);
}

public E removeLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return unlinkLast(l);
}

private E unlinkFirst(Node<E> f) {
    final E element = f.item;
    final Node<E> next = f.next;
    f.item = null;
    f.next = null; // help GC
    first = next;
    if (next == null)
        last = null;
    else
        next.prev = null;
    size--;
    modCount++;
    return element;
}

private E unlinkLast(Node<E> l) {
    final E element = l.item;
    final Node<E> prev = l.prev;
    l.item = null;
    l.prev = null; // help GC
    last = prev;
    if (prev == null)
        first = null;
    else
        prev.next = null;
    size--;
    modCount++;
    return element;
}
```

#### clear()

```java
public void clear() {
    for (Node<E> x = first; x != null; ) {
        Node<E> next = x.next;
        x.item = null;
        x.next = null;
        x.prev = null;
        x = next;
    }
    first = last = null;
    size = 0;
    modCount++;
}
```

遍历解除链表节点本身和前后引用。

#### 其它删除方法

都是类似的，不再赘述。

### 查询元素

#### getFirst(), getLast()

这两个操作都很高效，因为链表直接保存了第一个和最后一个节点的引用。

```java
public E getFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return f.item;
}

public E getLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return l.item;
}
```

#### get(int index)

随机查询效率较低，调用 node 方法进行一次二分，然后从第一个元素向后或从最后一个元素向前查找元素。

```java
public E get(int index) {
    checkElementIndex(index);
    return node(index).item;
}
```

#### peek(), peekFirst(), peekLast()

不删除的返回列表第一个(或最后一个)元素。

```java
public E peek() {
    final Node<E> f = first;
    return (f == null) ? null : f.item;
}

public E peekFirst() {
    final Node<E> f = first;
    return (f == null) ? null : f.item;
}

public E peekLast() {
    final Node<E> l = last;
    return (l == null) ? null : l.item;
}
```

#### poll(), pollFirst(), pollLast()

删除并返回列表第一个(或最后一个元素)

```java
public E poll() {
    final Node<E> f = first;
    return (f == null) ? null : unlinkFirst(f);
}

public E pollFirst() {
    final Node<E> f = first;
    return (f == null) ? null : unlinkFirst(f);
}

public E pollLast() {
    final Node<E> l = last;
    return (l == null) ? null : unlinkLast(l);
}
```

### push(E e), pop()

这两个方法其实就是调用了`addFirst`和`removeFirst`。

```java
public void push(E e) {
    addFirst(e);
}

public E pop() {
    return removeFirst();
}
```

### 修改元素

#### set(int index, E element)

查询出对应 index 的节点，将节点元素替换。

```java
public E set(int index, E element) {
    checkElementIndex(index);
    Node<E> x = node(index);
    E oldVal = x.item;
    x.item = element;
    return oldVal;
}
```

### 判断

contains, indexOf,isEmpty这几个都非常简单，直接看源码，不分析了。

```java
public boolean contains(Object o) {
    return indexOf(o) != -1;
}

public int indexOf(Object o) {
    int index = 0;
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null)
                return index;
            index++;
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item))
                return index;
            index++;
        }
    }
    return -1;
}

public boolean isEmpty() {
    return size() == 0;
}
```

### 迭代

```java
public ListIterator<E> listIterator(int index) {
    checkPositionIndex(index);
    return new ListItr(index);
}

private class ListItr implements ListIterator<E> {
    private Node<E> lastReturned;
    private Node<E> next;
    private int nextIndex;
    private int expectedModCount = modCount;

    ListItr(int index) {
        // assert isPositionIndex(index);
        next = (index == size) ? null : node(index);
        nextIndex = index;
    }

    public boolean hasNext() {
        return nextIndex < size;
    }

    public E next() {
        checkForComodification();
        if (!hasNext())
            throw new NoSuchElementException();

        lastReturned = next;
        next = next.next;
        nextIndex++;
        return lastReturned.item;
    }

    public boolean hasPrevious() {
        return nextIndex > 0;
    }

    public E previous() {
        checkForComodification();
        if (!hasPrevious())
            throw new NoSuchElementException();

        lastReturned = next = (next == null) ? last : next.prev;
        nextIndex--;
        return lastReturned.item;
    }

    public int nextIndex() {
        return nextIndex;
    }

    public int previousIndex() {
        return nextIndex - 1;
    }

    public void remove() {
        checkForComodification();
        if (lastReturned == null)
            throw new IllegalStateException();

        Node<E> lastNext = lastReturned.next;
        unlink(lastReturned);
        if (next == lastReturned)
            next = lastNext;
        else
            nextIndex--;
        lastReturned = null;
        expectedModCount++;
    }

    public void set(E e) {
        if (lastReturned == null)
            throw new IllegalStateException();
        checkForComodification();
        lastReturned.item = e;
    }

    public void add(E e) {
        checkForComodification();
        lastReturned = null;
        if (next == null)
            linkLast(e);
        else
            linkBefore(e, next);
        nextIndex++;
        expectedModCount++;
    }

    public void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (modCount == expectedModCount && nextIndex < size) {
            action.accept(next.item);
            lastReturned = next;
            next = next.next;
            nextIndex++;
        }
        checkForComodification();
    }

    final void checkForComodification() {
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
    }
}
```

迭代器的实现也不复杂，不再赘述。

## 总结

通读了一遍 LinkedList 的源码之后不难发现与 ArrayList 相比其增删效率更高，但查找效率稍差。

LinkedList 增删元素时不需要扩容和移动数据，只需要将前后节点的引用重新链接；但查找元素时无法通过下标直接获取，而需要一个个查找，效率相比 ArrayList 自然较慢。