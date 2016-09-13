---
layout: post
title: Javascript 设计模式之 Module 设计模式
category: [JavaScript, 设计模式]
tags: [模块化, 闭包, 匿名函数]
description: >
    CI3的 Session 类库设计理念是更加接近原生的函数和方法，同时为了保持向后兼容性，原来的方法也尽量保留了下来。与此同时，原来的 flash data 理念做了新的设计，加入了 temp data 的概念。
excerpt: >
    CI3的 Session 类库设计理念是更加接近原生的函数和方法，同时为了保持向后兼容性，原来的方法也尽量保留了下来。与此同时，原来的 flash data 理念做了新的设计，加入了 temp data 的概念。 
---

## 基本用法

先看一下最简单的一个实现，代码如下：

```javascript
// 定义一个计算器类
var Calculator = function() {
    // 这里可以声明私有成员
    var eqCtrl = document.getElement(eq);
    return {
        // 暴露公开的成员
        add: function(x,  y) {
            var val = x + y;
            eqCtrl.innerHtml = val;
        }
    }
}
```

我们可以通过如下的方式来调用：

```javascript
var calculator = new Calculator('eq');
calculator.add(2, 2);
```

大家可能看到了，每次用的时候都要 `new` 一下，也就是说每个实例在内存里都是一份copy，如果你不需要传参数或者没有一些特殊苛刻的要求的话，我们可以在最后一个 `}` 后面加上一个括号，来达到自执行的目的，这样该实例在内存中只会存在一份copy。不过在展示他的优点之前，我们还是先来看看这个模式的基本使用方法吧。

## 匿名闭包

**匿名闭包** 是让一切成为可能的基础，而这也是 **JavaScript** 最好的特性。我们来创建一个最简单的闭包函数，函数内部的代码一直存在于闭包内，在整个运行周期内，该闭包都保证了内部的代码处于私有状态。

```javascript
(function() {
    // 所有的变量和 function 都在这里声明，并且作用域也只能在这里的匿名闭包里
    // code ...

    // 但这里的代码仍然可以访问外部全局对象
    // code ...
})();
```

注意，匿名函数后面的括号 `()`，这是 JavaScript 语言所要求的，因为如果你不声明的话，JavaScript 解释器默认是声明一个 **function函数**；有括号，就是创建一个函数表达式，也就是自执行，用的时候不用和上面那样在 `new` 了，当然你也可以这样来声明：

```javascript
(function () { /* 内部代码 */ })();
```

不过我们推荐使用第一种方式，关于函数自执行，我后面会有专门一篇文章进行详解，这里就不多说了。

## 引用全局变量

JavaScript 有一个特性叫做**隐式全局变量**：不管一个变量有没有用过，JavaScript 解释器反向遍历作用域链来查找整个变量的 `var` 声明，如果没有找到 `var`，解释器则假定该变量是全局变量；如果该变量用于了赋值操作的话，之前如果不存在的话，解释器则会自动创建它。这就是说，在匿名闭包里使用或创建全局变量非常容易，不过比较困难的是，代码比较难管理，尤其是阅读代码的人看着很多区分哪些变量是全局的，哪些是局部的。

不过，好在匿名函数里我们可以提供一个比较简单的替代方案，我们可以将全局变量当成一个参数传入到匿名函数，然后使用；相比隐式全局变量，它又清晰又快，我们来看一个例子：

```javascript
(function($, YAHOO) {
    // 在这里，我们的代码就可以使用全局的 jQuery 对象了；YAHOO 也是一样
}(jQuery, YAHOO));
```

现在很多类库里都有这种使用方式，比如jQuery源码。

不过，有时候可能不仅仅要使用全局变量，而是也想声明全局变量，如何做呢？我们可以通过匿名函数的返回值来返回这个全局变量，这也就是一个基本的**Module模式**，来看一个完整的代码：

```javascript
var blogModule = (function() {
    var my = {}, privateName = '博客园'；
    function privateAddTopic(data) {
        // 这是内部处理代码
    }

    my.Name = privateName ;
    my.AddTopic = function(data) {
         privateAddTopic(data)
    };

    return my;
}());
```

上面的代码声明了一个全局变量 `blogModule`，并且带有2个可访问的属性：`blogModule.AddTopic` 和 `blogModule.Name`。除此之外，其它代码都在匿名函数的闭包里保持着私有状态。同时根据上面传入全局变量的例子，我们也可以很方便地传入其它的全局变量。

## 高级用法

Module 模式的一个限制就是所有的代码都要写在一个文件，但是在一些大型项目里，将一个功能分离成多个文件是非常重要的，因为可以多人合作易于开发。再回头看看上面的全局参数导入例子，我们能否把 `blogModule` 自身传进去呢？答案是肯定的，我们先将 `blogModule` 传进去，添加一个函数属性，然后再返回就达到了我们所说的目的，上代码：

```javascript
var blogModule = (function(my) {
    my.AddPhoto = function() {
        // 添加内部代码
    };

    return my;
}(blogModule));
```

这段代码，看起来是不是有C#里扩展方法的感觉？有点类似，但本质不一样哦。同时尽管 `var` 不是必须的，但为了确保一致，我们再次使用了它，代码执行以后，`blogModule` 下的 `AddPhoto` 就可以使用了，同时，匿名函数内部的代码也依然保证了私密性和内部状态。

### 松耦合扩展

上面的代码尽管可以执行，但是必须先声明blogModule，然后再执行上面的扩展代码，也就是说步骤不能乱，怎么解决这个问题呢？我们来回想一下，我们平时声明变量都是这样的：

```javascript
var cnblogs = cnblogs  || {};
```

这是确保 `cnblogs` 对象，当它存在的时候直接使用；当它不存在的时候赋值为 `{}`。我们来看看如何利用这个特性来实现 Module 模式的任意加载顺序：

```javascript
var blogModule = (function(my) {
    // 添加一些功能
    return my;
}(blogModule || {}));
```

通过这样的代码，每个单独分离的文件都保证这个结构，那么，我们就可以实现任意顺序的加载。所以，这个时候的 `var` 就是必须要声明的，因为如果不声明，其它文件读取不到。

### 紧耦合扩展

虽然松耦合扩展很牛叉了，但是可能也会存在一些限制。比如你没办法重写你的一些属性或者函数，也不能在初始化的时候就是用 Module 的属性。紧耦合扩展限制了加载顺序，但是提供了我们重载的机会，看如下例子：

```javascript
var blogModule = (function(my) {
    var oldAddPhotoMethod = my.AddPhoto;
    my.AddPhoto = function() {
        // 重载方法，仍然可以通过 oldAddPhotoMethod 调用旧的方法
    }
    return my;
}(blogModule))
```

通过这种方式，我们达到了重载的目的，当然如果你想在继续在内部使用原有的属性，你可以调用 `oldAddPhotoMethod` 来用。

### 克隆与继承

```javascript
var blogModule = (function (old) {
    var my = {},
        key;

    for (key in old) {
        if (old.hasOwnProperty(key)) {
            my[key] = old[key];
        }
    }

    var oldAddPhotoMethod = old.AddPhoto;
    my.AddPhoto = function () {
        // 克隆以后，进行了重写，当然也可以继续调用 oldAddPhotoMethod
    };

    return my;
}(blogModule));
```

这种方式灵活是灵活，但是也需要花费灵活的代价。其实**该对象的属性或 function 根本没有被复制，只是对同一个对象多了一种引用而已**。所以，如果旧对象去改变它，那克隆以后的对象所拥有的属性或 function 函数也会被改变。要解决这个问题，我们就得用递归。但递归对 function 函数的赋值也不好用，所以我们在递归的时候 `eval` 相应的 function。不管怎么样，我还是把这一个方式放在这个帖子里了，大家使用的时候注意一下就行了。

全文完！

> 本文来自博客园，作者为 **秋天的风，夏天的雨**。原文链接：[http://www.cnblogs.com/beyond-succeed/archive/2016/09/12/5865099.html](http://www.cnblogs.com/beyond-succeed/archive/2016/09/12/5865099.html)