---
layout: post
title: CodeIgniter 3 之 Session 机制详解
category: [CodeIgniter, PHP]
tags: [Session]
description: >
    CI3的 Session 类库设计理念是更加接近原生的函数和方法，同时为了保持向后兼容性，原来的方法也尽量保留了下来。与此同时，原来的 flash data 理念做了新的设计，加入了 temp data 的概念。
excerpt: >
    CI3的 Session 类库设计理念是更加接近原生的函数和方法，同时为了保持向后兼容性，原来的方法也尽量保留了下来。与此同时，原来的 flash data 理念做了新的设计，加入了 temp data 的概念。 
---

CodeIgniter 3（以下简称 CI 3）的 Session 的重大改变就是**默认使用了原生的Session**，这符合 Session 类库本来的意思，似乎更加合理一些。总体来说，虽然设计理念不同，但为了保证向后兼容性，CI 3 的 Session 类库的使用方法与 CI 2 的差别不是很大。许多在 CI 2 里面关于 Session 的操作方法，在 CI 3 中仍然可用。

CI框架里面，关于 Session 一般的使用过程是这样的：

## 写数据

```php
// 直接加载默认的files驱动器
$this->load->library('session');

// 写单个数据
$this->session->set_userdata('some_name', 'some_value');

// 数组，适合一次保存多个数据的情形。
$newdata = array(
    'username'  => 'johndoe',
    'email'     => 'johndoe@some-site.com',
    'logged_in' => TRUE
);
$this->session->set_userdata($newdata);
```

这跟CI2.0几乎没有区别。接下来看读取Session数据的方法：

## 读数据

```php
// 直接使用PHP原生方式读取session，似乎是官方推荐的方法
$name = $_SESSION['name'];

// 使用魔术方法，session的名称name变成了session对象的一个属性
$name = $this->session->name ;

// 与CI2的使用方法一样，这是为保持向后兼容性的一种用法
$name = $this->session->userdata('name');
```

另外一点需要注意，CI3开始，如果返回的数据是空，以前都会置为 FALSE，现在则会 NULL。 所以以前的写法：

```php
$name = $this->session->userdata('name');
if ($name === FALSE) {
    // ...
}
```

需要换成如下方式：

```php
$name = $this->session->userdata('name');
if ($name === NULL) {
    // ...
}
```

可以使用以下方法判断是否含有某个名称的session：

```php
// 使用 session 类提供的 has_userdata() 方法
if ($this->session->has_userdata('some_name')) {
    // ...
}

// 或者直接判断超全局变量 $_SESSION 数组是否存在相应的key
if (isset($_SESSION['some_name'])) {
    // ...
}
```

## 删除数据

删除的话则和以前类似：

```php
// 直接 unset 超全局变量 $_SESSION 的key
unset($_SESSION['some_name']);
//或者批量删除
unset(
    $_SESSION['some_name'],
    $_SESSION['another_name']
);

// 或者，使用 session 类提供的 unset_userdata() 方法进行删除
$this->session->unset_userdata('some_name'); 
//或者批量删除
$array_items = array('username', 'email');
$this->session->unset_userdata($array_items);
```

总体上看，CI3的 Session 类库设计理念是更加接近原生的函数和方法，同时为了保持向后兼容性，原来的方法也尽量保留了下来。与此同时，原来的 flash data 理念做了新的设计，加入了 temp data 的概念，那么这两个 data 有什么区别呢？

## flash data、temp data 与 user data 的区别

这三种 session 数据的名字是CI约定俗成的，指代的内容是不一样的，并不存在包含关系。不要错误地认为 user data 包含 flash data 或者 temp data。在CI的api设计中，分别应用不同场景：

### 1、flash data

flash data 的主要特征是：保存的数据是一次性数据，在下次请求中用过一次就没了。

本质上讲，flash data 跟普通的 session 数据无异，**CI不过是对该类data的名称做出了特殊标记**，保证了它们拥有了只能用一次的特征，所以，你可以使用以下方法将普通的 user data 标记为 flash data：

```php
// 先有一个session
$_SESSION['item'] = 'value';

// 标记成flash data，item是session的名称（单个操作）
$this->session->mark_as_flash('item');

// 标记成flash data，item是session的名称（批量操作）
$this->session->mark_as_flash(array('item', 'item2'));

// 或者一次性的标记，不再是先有session，再标记成flash data的过程
$this->session->set_flashdata('item', 'value');
```

flash data的适用场景是：将操作结果返回到下一次请求的页面上。比如有个保存操作，提交后会跳转到一个新的页面，你可以使用 flash data 保存一句话“保存已成功”，该句话只在跳转的页面显示一次，再次刷新跳转页面，就不会显示了。

### 2、temp data

temp data 的主要特征是：保存的数据在规定的时间内有效，它的生命期由方法 `$this->session->set_tempdata('item', 'value', 300)` 设置，其中的 `300` 意思是：**该 session 数据的有效期为5分钟**，超过规定时间（即便是session还没过期）就会失效，它的时效性介于 flash data 和 user data 之间。它和 flash data 在本质上是类似的，也可以从普通的session转化过来：

```php
// 先创建一个session
$_SESSION['item'] = 'value';

//标记 item 的生命期只有300s
$this->session->mark_as_temp('item', 300);
//批量将 session 生命期标记为300s
$this->session->mark_as_temp(array('item', 'item2'), 300);

//分别标记成不同的生命期
$this->session->mark_as_temp(array(
    'item'  => 300,
    'item2' => 240
));

// 直接设置一个temp data，常用方法
$this->session->set_tempdata('item', 'value', 300);
```

temp data 的适用场景是：保存一些更加细粒度的、更加隐私的 session 数据。比如某些令牌 token，比较重要，为了安全让它的生命期更短一些，可以保证安全。temp data 的设计从某种方面保证了 session 拥有不同生命期的数据。

### 3、user data

user data 的主要特征是：保存的数据在 session 有效期内均有效，它的生命期由 `sess_expiration` 设置，一般默认是7200s，而且它也是生命期最长的。

## flash data、temp data 与 user data 的读取

CI Session 类中的 flash data、temp data 与 user data，都能以 `$_SESSION['item']` 的方式获取到。同时，它们又可以使用各自的方法获取到：

```php
// 使用PHP原生方法：三种类型的数据都能得到
echo $_SESSION['item'];

// 获取flash data
$this->session->flashdata('item');
// 获取全部flash data
$this->session->flashdata();

// 获取temp data
$this->session->tempdata('item');
// 获取全部temp data
$this->session->tempdata();

// 获取user data
$this->session->userdata('item');
// 获取全部user data
$this->session->userdata();
```

但是要注意：这几种数据是分割开来的，不能使用 `$this->session->userdata('item')`，去访问一个设为 flash data 的数据：

```php
$this->session->set_tempdata('item', 'value', 300);
// 不能使用 userdata() 方法来获取 temp data，这将会返回null
$this->session->userdata('item');

$this->session->set_flashdata('item2', 'value');
// 不能使用 userdata() 方法来获取 flash data，这将会返回null
$this->session->userdata('item2');
```

## Session数据的删除与销毁

session数据的删除可以理解为细粒度的删除某个session数据，可以使用：

```php
// 删除名为 item 的 user data
$this->session->unset_userdata('item');
// 删除名为 item 的 temp data
$this->session->unset_tempdata('item');

// 使用PHP原生方法删除session；对 flash、temp、user 三种 data 都有效，推荐的方式
unset($_SESSION['item']);
```

session销毁，则会使所有数据类型失效，包括 flash data 和 temp data：

```php
// PHP原生销毁session的方法，推荐的方式
session_destroy();

// 或者调用 session 类的 sess_destroy() 方法来销毁 session
$this->session->sess_destroy();
```

## 扩展内容：flash、temp 及 user data 的设计思路

首先，三种类型的数据必定存在于 `$_SESSION` 超全局变量中，也就是说，使用 `set_tempdata()` 和 `set_flashdata()` 方法，都会把对应的名称加入到 `$_SESSION` 超全局变量中。不过这还没完，**CI会用一个叫 `__ci_vars` 的 session 数据来区分 flash、temp 与 user data 的不同**。

```php
$_SESSION['__ci_vars'] = array();
```

使用 `set_flashdata('item', 'value')` 时，除了 `$_SESSION['item'] = 'value'` 以外，同时会有：

```php
// 还是首先会被保存到超级变量中
$_SESSION['item'] = 'value';

// 然后保存到一个名为 __ci_vars 的 session 中
// session 值 'new' 是CI自己定义的，没特殊含义，可以看成是 flash data 的标记
$_SESSION['__ci_vars']['item'] = 'new'; 
```

而使用 `set_tempdata('item2', 'value', 300)` 时，也是类似，不过略有区别：

```php
// 还是首先会被保存到超级变量中
$_SESSION['item2'] = 'value';

// 然后保存到一个名为 __ci_vars 的 session 中
// 13789020340 等于当前时间戳加上300s，即：time() + 300;
// 300来自于过期时间设置，可以在方法中传入
$_SESSION['__ci_vars']['item2'] = 13789020340; 
```

当使用这些不同类型的数据时，CI首先看 `$_SESSION` 数组里面是否含有这个 key，然后会根据 `$_SESSION['__ci_vars']` 数据包中 key 对应的值来判断该 session 是 flash data 还是 temp data。简单地说，**就是看对应的值是不是int类型**。如果是，就认为是 temp data；如果不是，则认为是 flash data。所以，你可以使用 `$_SESSION()` 方法获得所有类型的数据，也可以使用 `unset` 方法，删除掉所有类型的数据。

设置完 flash data 和 temp data 的下次请求时，构造函数都会判断 `$_SESSION['__ci_vars']` 中的特定数据，如果值为 **new** 的，则置为 **old**；如果值是数字，则跟当前的时间戳比较，小于的话，则会删除该 key 下的数据。

当再次请求时，flash data 中置为 **old** 的数据自动被删除，无法再次读取；而 temp data 中的 key 已经过期删除，取值为NULL。

> 本文来自 iFixedBug.com，作者为 **Zigzag**，感谢他的分享，让我对 CI 3 的 session 有了更深的认识和理解。原文链接：[http://www.ifixedbug.com/posts/how-to-use-codeigniter3-session-2](http://www.ifixedbug.com/posts/how-to-use-codeigniter3-session-2)