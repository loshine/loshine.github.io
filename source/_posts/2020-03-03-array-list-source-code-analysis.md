---
title: ArrayList 源码解析
date: 2020-03-03 19:35:00
category: [技术]
tags: [Java]
toc: true
thumbnail: https://i.loli.net/2020/06/03/CA64z3IDXgpPKWc.png
---

ArrayList 是最常见的 List 实现，本文分析其源码和实现原理。

<!-- more -->

## 定义

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
```

ArrayList 实际上是一个动态数组，容量可以动态的增长，其继承了 AbstractList，实现了 List, RandomAccess, Cloneable, java.io.Serializable 这些接口。

RandomAccess 接口，被 List 实现之后，表明 List 提供了随机访问功能，也就是通过下标获取元素对象的功能。

相比较 LinkedList 未实现 RandomAccess 接口，所以无法使用下标获取元素，遍历时最好使用迭代器而不是循环遍历。

## 初始化

要使用一个 ArrayList，首先我们要初始化它。

查看源码发现 ArrayList 有三个构造方法：

```java
/**
 * 默认初始容量。
 */
private static final int DEFAULT_CAPACITY = 10;

/**
 * 用于空实例的共享空数组实例。
 */
private static final Object[] EMPTY_ELEMENTDATA = {};

/**
 * 共享的空数组实例，用于默认大小的空实例。
 * 我们将此与EMPTY_ELEMENTDATA区别开来，以知晓添加第一个元素时需要扩容多少。
 */
private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

/**
 * 存储ArrayList的元素的数组缓冲区。 ArrayList的容量是此数组缓冲区的长度。 
 * 添加第一个元素时，任何具有elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA
 * 的空ArrayList都将扩展为DEFAULT_CAPACITY。
 */
transient Object[] elementData;

/**
 * ArrayList的大小（它包含的元素数）。
 */
private int size;

/**
 * 构造一个具有指定初始容量的空列表。
 *
 * @param  initialCapacity  列表的初始容量
 * @throws IllegalArgumentException 如果指定的初始容量为负
 */
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        this.elementData = EMPTY_ELEMENTDATA;
    } else {
        throw new IllegalArgumentException("Illegal Capacity: "+
                                           initialCapacity);
    }
}

/**
 * 构造一个初始容量为10的空列表。
 */
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

/**
 * 构造一个包含指定集合元素的列表，其顺序由集合的迭代器返回。
 *
 * @param c 放入此列表的元素的集合
 * @throws NullPointerException 如果指定的集合为null
 */
public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        this.elementData = EMPTY_ELEMENTDATA;
    }
}
```

观察其构造方法和相关的常量、变量，可以发现初始化方法都很简单，是对 elementData 进行了初始化。

## 常用方法解析

### 添加元素

#### add(E e)

```java
/**
 * 将指定的元素追加到此列表的末尾。
 *
 * @param e 要添加到此列表的元素
 * @return true
 */
public boolean add(E e) {
    ensureCapacityInternal(size + 1);
    elementData[size++] = e;
    return true;
}
```

观察源码可以发现调用了`ensureCapacityInternal(size + 1)`方法，然后使 size 自增并把元素插入了 elementData 末尾。

```java
private static int calculateCapacity(Object[] elementData, int minCapacity) {
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        return Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    return minCapacity;
}

private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}

private void ensureExplicitCapacity(int minCapacity) {
    modCount++;

    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}

/**
 * 要分配的最大数组大小。
 */
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

/**
 * 增加容量以确保它至少可以容纳最小容量参数指定的元素数量。
 *
 * @param minCapacity 所需的最小容量
 */
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    elementData = Arrays.copyOf(elementData, newCapacity);
}

private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    return (minCapacity > MAX_ARRAY_SIZE) ?
        Integer.MAX_VALUE :
        MAX_ARRAY_SIZE;
}
```

modCount 是一个防止遍历的时候更改列表的属性，调用更改列表的方法的时候都会导致其增加。

`calculateCapacity`方法计算容量，如果是一个默认容量空列表，那么返回 10 和 size+1 里更大的那个数；否则直接返回 size+1。

`ensureExplicitCapacity`方法计算是否需要扩容，如果满足扩容条件`size+1-elementData.length`则调用`grow`方法开始扩容。

`grow`方法是扩容方法，首先计算一个扩容后新容量，计算出的新容量默认是老容量扩容一半。然后检查传入的最小容量是否在扩容区间内，如果不在则把传入的最小容量作为扩容容量。之后检查新容量是否达到最大容量阈值，如果达到就扩容到最大容量。最后调用`Arrays.copyOf`方法拷贝数组。

#### add(int index, E element)

```java
/**
 * 将指定的元素插入此列表中的指定位置。
 * 将当前在该位置的元素（如果有）和任何后续元素右移（将其索引加一）。
 *
 * @param index 指定元素要插入的索引
 * @param element 要插入的元素
 * @throws IndexOutOfBoundsException
 */
public void add(int index, E element) {
    rangeCheckForAdd(index);

    ensureCapacityInternal(size + 1);  // Increments modCount!!
    System.arraycopy(elementData, index, elementData, index + 1,
                     size - index);
    elementData[index] = element;
    size++;
}


private void rangeCheckForAdd(int index) {
    if (index > size || index < 0)
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}
```

首先检查插入位置索引是否合法，然后检查是否需要扩容，再将插入位置的元素统一后移一个位置，再赋值插入位置的元素，最后 size 自增。

#### addAll 系列

addAll 方法是以上两个方法的多元素版，源码类似不再赘述。

### 删除元素

#### remove(int index)

根据索引删除元素

```java
/**
 * 删除此列表中指定位置的元素。将所有后续元素向左移动（从其索引中减去一个）。
 *
 * @param index 要删除的元素的索引
 * @return 从列表中删除的元素
 * @throws IndexOutOfBoundsException
 */
public E remove(int index) {
    rangeCheck(index);

    modCount++;
    E oldValue = elementData(index);

    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,
                         numMoved);
    elementData[--size] = null; // clear to let GC do its work

    return oldValue;
}
```

检查索引是否合法，取出对应索引元素，将 elementData 索引位置之后的所有元素向前移动一个位置，最后返回索引元素。

#### remove(Object o)

删除指定元素

```java
/**
 * 从此列表中删除第一次出现的指定元素，如果不存在该元素就不改变列表. 
 *
 * @param o 要从此列表中删除的元素
 * @return 如果列表里有该元素则返回 true
 */
public boolean remove(Object o) {
    if (o == null) {
        for (int index = 0; index < size; index++)
            if (elementData[index] == null) {
                fastRemove(index);
                return true;
            }
    } else {
        for (int index = 0; index < size; index++)
            if (o.equals(elementData[index])) {
                fastRemove(index);
                return true;
            }
    }
    return false;
}

private void fastRemove(int index) {
    modCount++;
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,
                         numMoved);
    elementData[--size] = null; // clear to let GC do its work
}
```

找出 elementData 里对应元素的位置，如果存在就将后面所有元素往前移动一个位置，并将最后一个位置设置为 null。

#### removeAll(Collection<?> c)

```java
public boolean removeAll(Collection<?> c) {
    Objects.requireNonNull(c);
    return batchRemove(c, false);
}

private boolean batchRemove(Collection<?> c, boolean complement) {
    final Object[] elementData = this.elementData;
    int r = 0, w = 0;
    boolean modified = false;
    try {
        for (; r < size; r++)
            if (c.contains(elementData[r]) == complement)
                elementData[w++] = elementData[r];
    } finally {
        // Preserve behavioral compatibility with AbstractCollection,
        // even if c.contains() throws.
        if (r != size) {
            System.arraycopy(elementData, r,
                             elementData, w,
                             size - r);
            w += size - r;
        }
        if (w != size) {
            // clear to let GC do its work
            for (int i = w; i < size; i++)
                elementData[i] = null;
            modCount += size - w;
            size = w;
            modified = true;
        }
    }
    return modified;
}
```

检查 c 不为 null，就开始调用`batchRemove`移除元素。

`batchRemove`第二个参数用于标记是否删除补集，此处传入`false`表示删除交集。原理非常简单，遍历 elementData，如果集合不包含 elementData 中的元素则将此元素放到前面的位置。finally 块中对异常进行特殊处理，然后将后面的角标位置元素置空。

#### retainAll

删除非并集的元素。

```java
public boolean retainAll(Collection<?> c) {
    Objects.requireNonNull(c);
    return batchRemove(c, true);
}
```

#### clear()

```java
/**
 * 从此列表中删除所有元素。
 */
public void clear() {
    modCount++;

    // clear to let GC do its work
    for (int i = 0; i < size; i++)
        elementData[i] = null;

    size = 0;
}
```

索引每一个位置设置为 null。

### 查询元素

```java
public E get(int index) {
    rangeCheck(index);

    return elementData(index);
}
```

### 修改元素

```java
public E set(int index, E element) {
    rangeCheck(index);

    E oldValue = elementData(index);
    elementData[index] = element;
    return oldValue;
}
```

### 判断

`contains`, `indexOf`,`isEmpty`这几个都非常简单，直接看源码，不分析了。

```java
public boolean contains(Object o) {
    return indexOf(o) >= 0;
}

public int indexOf(Object o) {
    if (o == null) {
        for (int i = 0; i < size; i++)
            if (elementData[i]==null)
                return i;
    } else {
        for (int i = 0; i < size; i++)
            if (o.equals(elementData[i]))
                return i;
    }
    return -1;
}

public boolean isEmpty() {
    return size == 0;
}
```

### 迭代

```java
public Iterator<E> iterator() {
    return new Itr();
}

private class Itr implements Iterator<E> {
    int cursor;       // index of next element to return
    int lastRet = -1; // index of last element returned; -1 if no such
    int expectedModCount = modCount;

    Itr() {}

    public boolean hasNext() {
        return cursor != size;
    }

    @SuppressWarnings("unchecked")
    public E next() {
        checkForComodification();
        int i = cursor;
        if (i >= size)
            throw new NoSuchElementException();
        Object[] elementData = ArrayList.this.elementData;
        if (i >= elementData.length)
            throw new ConcurrentModificationException();
        cursor = i + 1;
        return (E) elementData[lastRet = i];
    }

    public void remove() {
        if (lastRet < 0)
            throw new IllegalStateException();
        checkForComodification();

        try {
            ArrayList.this.remove(lastRet);
            cursor = lastRet;
            lastRet = -1;
            expectedModCount = modCount;
        } catch (IndexOutOfBoundsException ex) {
            throw new ConcurrentModificationException();
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public void forEachRemaining(Consumer<? super E> consumer) {
        Objects.requireNonNull(consumer);
        final int size = ArrayList.this.size;
        int i = cursor;
        if (i >= size) {
            return;
        }
        final Object[] elementData = ArrayList.this.elementData;
        if (i >= elementData.length) {
            throw new ConcurrentModificationException();
        }
        while (i != size && modCount == expectedModCount) {
            consumer.accept((E) elementData[i++]);
        }
        // update once at end of iteration to reduce heap write traffic
        cursor = i;
        lastRet = i - 1;
        checkForComodification();
    }

    final void checkForComodification() {
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
    }
}
```

迭代器代码非常简单，不作赘述。

## 总结

* 增删改查中，增导致扩容，则会修改 modCount，删一定会修改。改和查一定不会修改 modCount。
* 扩容操作会导致数组复制；批量删除需要找出两个集合的交集，然后触发数组复制操作。因此，增、删都相对低效。而改、查都是很高效的操作。