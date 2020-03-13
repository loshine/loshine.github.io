---
title: HashMap 源码解析
date: 2020-03-12 21:32:00
category: [技术]
tags: [Java]
toc: true
thumbnail: https://imgur.com/bKHmPbb.png
---

<!--more-->

HashMap 是散列表实现的键值对容器，本文分析其源码和实现原理。

## 定义

```java
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable
```

HashMap 基于**散列表**实现。

## 初始化

HashMap 提供了四个构造方法。

```java
// 默认初始化容量
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
// 最大容量
static final int MAXIMUM_CAPACITY = 1 << 30;
// 默认加载因数
static final float DEFAULT_LOAD_FACTOR = 0.75f;
// 转化为树结构的阈值
static final int TREEIFY_THRESHOLD = 8;
// 转化为链表结构的阈值
static final int UNTREEIFY_THRESHOLD = 6;
// 最小树容量
static final int MIN_TREEIFY_CAPACITY = 64;

// hash 表
transient Node<K,V>[] table;
// map 大小
transient int size;
// 修改次数
transient int modCount;
// 阈值
int threshold;
// 加载因数
final float loadFactor;

public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                            initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                            loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}

public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}

public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
}

public HashMap(Map<? extends K, ? extends V> m) {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
    putMapEntries(m, false);
}
```

HashMap 的构造函数主要初始化了`loadFactor`加载因数和`threshold`扩容阈值。

### tableSizeFor 原理

在构造方法中的`tableSizeFor`方法通过传入的容量计算出大于等于给定参数 initialCapacity 最小的 2 的幂次方的数值。

```java
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

tableSizeFor 方法的实现非常巧妙，使用了位**或**以及**无符号右移**两个操作，其步骤如下：

1. `n = cap - 1`，避免因为 cap 本身就是 2 的幂次方而导致最后得到 cap * 2；
2. `n |= (n >>> 1)`，保证 n 的高 2 位是 1；
3. `n |= (n >>> 2)`，保证 n 的高 4 位是 1；
4. `n |= (n >>> 4)`，保证 n 的高 8 位是 1；
5. `n |= (n >>> 8)`，保证 n 的高 16 位是 1；
6. `n |= (n >>> 16)`，保证 n 的高 32 位是 1；
7. 以上 2~6 步右移会保证 `cap - 1` 的最高 1 位之后全部被 1 填满；
8. `n < 0` 返回 1；`n >= 1 << 30` 返回 `1 << 30`；否则返回 `n + 1`。

无论给定容量是多少，最后一步之前算出的 `n` 的二进制所有位都是`1`，最后再加`1`结果就是大于等于给定参数 initialCapacity 最小的 2 的幂次方的数值。

> 为什么要保持为 2 的幂次方？因为 HashMap 中存储数据的角标是根据数据的键的哈希值决定的，其计算方式为`index = hash % table.length`，如果表的大小保持为 2 的幂次方，那么可以用`index = hash & (table.length - 1)`代替以提升效率。

### Node 结构

HashMap.Node 是其节点类。

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;

    Node(int hash, K key, V value, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }

    public final K getKey()        { return key; }
    public final V getValue()      { return value; }
    public final String toString() { return key + "=" + value; }

    public final int hashCode() {
        return Objects.hashCode(key) ^ Objects.hashCode(value);
    }

    public final V setValue(V newValue) {
        V oldValue = value;
        value = newValue;
        return oldValue;
    }

    public final boolean equals(Object o) {
        if (o == this)
            return true;
        if (o instanceof Map.Entry) {
            Map.Entry<?,?> e = (Map.Entry<?,?>)o;
            if (Objects.equals(key, e.getKey()) &&
                Objects.equals(value, e.getValue()))
                return true;
        }
        return false;
    }
}
```

该类实现了 **Map.Entry**，并保存了下一个节点的引用`next`，该类是很明显的**单向链表节点**。

## 常用方法解析

### hash 方法解析

`hash`方法是 HashMap 中非常重要的方法，它调用了 key 的`hashCode`方法，并对其高 16 位和低 16 位进行**异或**操作生成新的哈希值。

这样做的目的是避免当 table 长度较小时，分配存储的 index 的时候只有低位参与，从而哈希碰撞过于频繁。

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

### put 方法解析

`put`方法是 Map 最常用的方法之一，调用该方法可以添加键值对到 Map 中。

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    else {
        Node<K,V> e; K k;
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        else {
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    break;
                }
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }
        if (e != null) { // existing mapping for key
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            afterNodeAccess(e);
            return oldValue;
        }
    }
    ++modCount;
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}

Node<K,V> newNode(int hash, K key, V value, Node<K,V> next) {
    return new Node<>(hash, key, value, next);
}
```

HashMap 的 put 遵循以下步骤：

1. table 为 null 或长度为 0 则重新计算大小；
2. table 对应 hash 值角标的元素为 null，则构造一个 Node 放进去；
3. 若元素 key 与新 key 相同，重新赋值 value；
4. 若节点是一个 TreeNode，调用`putTreeVal`方法插入红黑树节点；
5. 此时节点是一个链表节点，一个个向下查找对应的 key 是否存在，若存在则替换 value；否则插入新链表节点，并检查是否要转化为红黑树结构。

TreeNode 类，`putTreeVal` 和 `treeifyBin` 方法在这里就不展开了，若有相关问题可以查看[《TreeMap 源码解析》](https://loshine.blog/2020/03/10/tree-map-source-code-analysis)这篇文章中对于红黑树结构的阐述。

由此可以看出，HashMap 是一个以数组作为基本存储，结合了链表和红黑树作为数组里的元素的键值对容器。

### resize 方法

这是一个 table 扩容的方法，初始化 table 或把 table 的大小增加一倍。

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    if (oldCap > 0) {
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                    oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1; // double threshold
    }
    else if (oldThr > 0) // initial capacity was placed in threshold
        newCap = oldThr;
    else {               // zero initial threshold signifies using defaults
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                    (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;
    @SuppressWarnings({"rawtypes","unchecked"})
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                if (e.next == null)
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else { // preserve order
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        else {
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

该方法按以下步骤：

1. table 未初始化则初始化，否则大小增加一倍，并计算下一次扩容阈值；
2. 遍历旧 table，若元素没有 next，则直接放入新 table；
3. 若是 TreeNode，调用 `split` 方法；
4. 若是链表，且其 index 为 j ，遍历将每一个链表节点分配到上下半区链表，上半链表放到 `table[j]`，下半区链表放到 `table[j + oldCap]`。

`resize`方法因为每次扩容都是增加一倍的容量，所以每个节点新的角标会比老角标的 2 进制多一位信息，而这一位信息正好就是 `hash & oldCap`。

若 `hash & oldCap` 为 0，节点角标不变；否则 2 进制高位多个 1，对应的角标就添加了 `oldCap`。于是可以对链表节点进行拆分到 `j` 和 `j + oldCap` 两个角标。

### remove 方法

`remove(Object key)` 和 `remove(Object key, Object value)` 都是通过调用 `removeNode` 来实现删除元素的，`removeNode` 方法根据对应节点的结构（是树还是链表）调用不同删除逻辑。

```java
public V remove(Object key) {
    Node<K,V> e;
    return (e = removeNode(hash(key), key, null, false, true)) == null ?
        null : e.value;
}

@Override
public boolean remove(Object key, Object value) {
    return removeNode(hash(key), key, value, true, true) != null;
}

final Node<K,V> removeNode(int hash, Object key, Object value,
                            boolean matchValue, boolean movable) {
    Node<K,V>[] tab; Node<K,V> p; int n, index;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (p = tab[index = (n - 1) & hash]) != null) {
        Node<K,V> node = null, e; K k; V v;
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            node = p;
        else if ((e = p.next) != null) {
            if (p instanceof TreeNode)
                node = ((TreeNode<K,V>)p).getTreeNode(hash, key);
            else {
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key ||
                            (key != null && key.equals(k)))) {
                        node = e;
                        break;
                    }
                    p = e;
                } while ((e = e.next) != null);
            }
        }
        if (node != null && (!matchValue || (v = node.value) == value ||
                                (value != null && value.equals(v)))) {
            if (node instanceof TreeNode)
                ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
            else if (node == p)
                tab[index] = node.next;
            else
                p.next = node.next;
            ++modCount;
            --size;
            afterNodeRemoval(node);
            return node;
        }
    }
    return null;
}
```

## 总结

HashMap 利用了类似哈希表提升了查找效率，内部使用数组，链表和红黑树保存数据。

每当保存数据超过阈值时触发扩容增加一倍容量，容量总是 2 的幂次方。

操作方法大量使用位操作提升操作效率。