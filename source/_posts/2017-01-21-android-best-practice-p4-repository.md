---
title: Android开发最佳实践——4.Repository 层实现
date: 2017-01-21 16:02:11
category: [技术]
tags: [Android]
toc: true
description: 转眼就 2017 年了，原本定的博客计划因为太忙而搁置了两个月，最近终于可以恢复更新了。今天要阐述的是我理解的完美 Repository 层的实现，Repository 层也就是我们的数据层，在这里封装了获取网络数据、缓存数据、数据库数据以及数据转换逻辑
---

转眼就 2017 年了，原本定的博客计划因为太忙而搁置了两个月，最近终于可以恢复更新了。今天要阐述的是我理解的完美 Repository 层的实现，Repository 层也就是我们的数据层，在这里封装了获取网络数据、缓存数据、数据库数据以及数据转换逻辑

<!-- more -->

# DO

## data class

即 **Domain Object**，业务实体类。通常会用一个 **Java Bean** 来描述它，这里我们用 **Kotlin** 的 **data class** 实现：

```kotlin
data class Article(@SerializedName("_id") val id: String,
                   val desc: String,
                   val source: String,
                   val type: String,
                   val url: String,
                   val used: Boolean,
                   val who: String?,
                   val createdAt: Date,
                   val publishedAt: Date)
```

使用了`data class`关键词之后，Kotlin 会自动帮我们生成`getter`(如果属性是使用`var`声明的则还会生成`setter`)、`equals()`、`hashCode()`、`toString()`、`copy()`等常用方法。

而在 Java 中写一个 JavaBean，我们需要一个个声明属性并写出它们对应的`getter`、`setter`以及其它代码，相比之下 Kotlin 的代码量小了一大半。

## Parcelable

很多情况下我们需要 DO 实现`Parcelable`以便我们在 Android 中传输数据，这个时候如果手写大量的代码是非常麻烦的一件事情，我们可以使用[Parceler](https://github.com/johncarl81/parceler)节约开发时间和代码量。

但出于兼容性原因，所有 DO 的属性都要是 Optional 

```kotlin
@Parcel(Parcel.Serialization.BEAN)
data class Content(@SerializedName("_id")
                   val id: String? = null,
                   val createdAt: Date? = null,
                   val desc: String? = null,
                   val publishedAt: Date? = null,
                   val source: String? = null,
                   val type: String? = null,
                   val url: String? = null,
                   val used: Boolean = false,
                   val who: String? = null)
```

然后我们就可以这样传输一个 DO 了：

```kotlin
// 把一个 Content 包装成一个 Parcelable
val parcelable: Parcelable = Parcels.wrap(Content())
// 把一个 Parcelable 解包为一个 Content
val content: Content = Parcel.unwrap(parcenlable)
```

## RealmObject

讲真，我不建议使用 **Realm**，不仅侵入性较强，而且使用 **RxJava** 的时候有线程切换的问题产生。

在严格分层的应用中查询数据要跨线程传输，而此时 Realm 因为查询出来的结果不能跨线程使用必须 copy 对象，所以效率并不比其它数据库高。

# DataStore and Cache

在数据库的选择中因为 **Realm** 的线程切换以及侵入性问题，第一时间就排除掉了。

然后是 SQL 和 NoSQL 的选择，Android 中的 SQL 只有 Sqlite，而基于开发的便利性使用的框架都会对项目造成一定的侵入性。

最后经过思考选择了 **paperdb** 存储数据。使用 NoSQL 还有一个好处就是缓存数据非常方便，而且还可以把以前存在 SharedPreferences 里的一些数据挪到数据库中。

项目中引入 **paperdb**：

```gradle
compile 'io.paperdb:paperdb:2.0'
```

存储和取出数据：

```kotlin
Paper.book().write("city", "Lund") // Primitive
Paper.book().write("task-queue", queue) // LinkedList
Paper.book().write("countries", countryCodeMap) // HashMap

val city: String = Paper.book().read("city")
val queue: LinkedList = Paper.book().read("task-queue")
val countryCodeMap: HashMap = Paper.book().read("countries")
```

Data Cache 可以使用 `paperdb` 存储，Memory Cache 则使用 [LruCache](https://developer.android.com/reference/android/util/LruCache.html)。

这样在 Repository 中我们就可以做到三层缓存了。

> Memory Cache（LruCache） -> DataStore Cache（paperdb） -> Cloud（Web）

# 网络请求

网络请求使用 okhttp + Retrofit + gson + RxJava 实现

如果不使用 Dagger 的话是这样的：

DataManager.kt

```kotlin
object DataManager {

    // OkHttp Constants
    const val RESPONSE_CACHE_FILE = "response_cache"

    const val RESPONSE_CACHE_SIZE = 10 * 1024 * 1024L
    const val HTTP_CONNECT_TIMEOUT = 10L
    const val HTTP_READ_TIMEOUT = 30L
    const val HTTP_WRITE_TIMEOUT = 10L
    const val MAX_MEMORY_CACHE_SIZE = 16

    const val DATE_FORMAT = "yyyy'-'MM'-'dd'T'HH':'mm':'ss'.'SSS'Z'"

    val mGson = GsonBuilder()
            // 2016-12-08T11:42:08.186Z
            .setDateFormat(DATE_FORMAT)
            .create()

    val mCache = LruCache<Any, Any>(MAX_MEMORY_CACHE_SIZE)

    lateinit var gankModel: GankModel
        private set

    fun init(context: Context, mApiHostUrl: String, isDebug: Boolean) {
        val cacheDir = File(context.cacheDir, RESPONSE_CACHE_FILE)
        val cache = Cache(cacheDir, RESPONSE_CACHE_SIZE)
        val client = OkHttpClient.Builder()
                .cache(cache)
                .connectTimeout(HTTP_CONNECT_TIMEOUT, TimeUnit.SECONDS)
                //                .writeTimeout(HTTP_WRITE_TIMEOUT, TimeUnit.SECONDS)
                //                .readTimeout(HTTP_READ_TIMEOUT, TimeUnit.SECONDS)
                .build()

        val retrofit = Retrofit.Builder()
                .baseUrl(mApiHostUrl)
                .addConverterFactory(GsonConverterFactory.create(mGson))
                .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
                .client(client)
                .build()

        createModels(retrofit)
    }

    private fun createModels(retrofit: Retrofit) {
        gankModel = GankRepository(retrofit.create<GankApi>(GankApi::class.java))
    }
}
```

GankApi.kt

```kotlin
interface GankApi {

    @GET("data/Android/{size}/{index}")
    fun getAndroidContent(@Path("index") index: Int, @Path("size") size: Int)
            : Flowable<ApiResult<List<Content>>>
}
```

GankRepository.kt

```kotlin
class GankRepository(private val mGankApi: GankApi) : GankModel {

    // 为了简化，这里就写了一个固定的 key，实际开发中要根据接口来修改 key
    val key = "androidCache"

    @Suppress("UNCHECKED_CAST")
    override fun getAndroidContent(): Flowable<List<Content>> {
        // 从网络获取数据
        return mGankApi.getAndroidContent(1, 10)
                .handleResult()
                .map {
                    DataManager.mCache.put(key, it)
                    Paper.book().write(key, it)
                    it
                }
                // 把内存缓存、磁盘缓存的数据放在数据发射队列的最前面
                .startWith(Flowable.just<List<Content>>(
                        DataManager.mCache.get(key) as List<Content>?
                                ?: Paper.book().read<List<Content>?>(key)
                                ?: ArrayList<Content>()))
                .subscribeOnIO()
    }
}
```

> 通用信息比如 App 版本号，客户端类型，用户ID 等都可以放在请求头中，这个时候应该使用 okhttp 的拦截器实现，这里就不展开了。

# 错误处理

我们的接口中会包含错误类型错误码，于是对应的也会定义对应的异常信息抛给上层处理，这里使用了 kotlin 的扩展方法：

```kotlin
/**
 * 将 ApiResult<T> 拆成 T, 如果有错误返回异常
 */
fun <T> Flowable<ApiResult<T>>.handleResult(): Flowable<T> {
    return flatMap {
        if (it.error) {
            // 此处要根据 errorCode 定义对应的自定义异常，demo为了省事简写了
            Flowable.error<T>(Exception("error"))
        } else {
            Flowable.just(it.results)
        }
    }
}
```

# SharedPreferences

虽然说我们使用了 paperdb，可以替代大多数情况下 SharedPreferences 的使用，但在使用设置界面时还是推荐使用 SharedPreferences，因为系统的 PreferenceFragment 可以为我们节省大量的代码，节约开发时间。

那么这个时候还是没办法避免使用 SharedPreferences 了，这里提供一个使用 Kotlin **委托属性** 实现的 SharedPreferences 委托类：

```kotlin
class Preference<T>(val context: Context, val name: String, val default: T) : ReadWriteProperty<Any?, T> {
    val prefs by lazy { context.getSharedPreferences("default", Context.MODE_PRIVATE) }
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return findPreference(name, default)
    }
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        putPreference(name, value)
    }
    private fun <U> findPreference(name: String, default: U): U = with(prefs) {
        val res: Any = when (default) {
            is Long -> getLong(name, default)
            is String -> getString(name, default)
            is Int -> getInt(name, default)
            is Boolean -> getBoolean(name, default)
            is Float -> getFloat(name, default)
            else -> throw IllegalArgumentException("This type can be saved into Preferences")
        }
        res as U
    }
    private fun <U> putPreference(name: String, value: U) = with(prefs.edit()) {
        when (value) {
            is Long -> putLong(name, value)
            is String -> putString(name, value)
            is Int -> putInt(name, value)
            is Boolean -> putBoolean(name, value)
            is Float -> putFloat(name, value)
            else -> throw IllegalArgumentException("This type can be saved into Preferences")
        }.apply()
    }
}
```

在代码中我们可以如下使用

```kotlin
class WhateverActivity : Activity() {
    var aInt: Int by Preference(this, "aInt", 0)
    fun whatever() {
        println(aInt) // 会从 SharedPreference 取这个数据
        aInt = 9 // 会将这个数据写入 SharedPreference
    }
}
```

# 总结

这就是我心目中完美的 Repository 层（或 Data 层）实现了，也许并不是最优的，但在我看来做到了易用和效率的平衡。

以上。