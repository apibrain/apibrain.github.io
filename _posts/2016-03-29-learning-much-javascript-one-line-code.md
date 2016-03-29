---
layout: post
title: 通过一行代码学习Javascript
category: 前端开发
---

在javascript无处不在的今天，我们每天都能很容易地学习到新的东西。一旦你掌握了这门语言的基本知识，就可以随处找到蕴含着丰富知识的代码。[Bookmarklets](https://www.squarefree.com/bookmarklets/) 是一个完美的多种功能组合起来的工具，每当我发现一个有用的功能，我都会开心地去学习其源码，从中探索出怎么实现这样强大的功能。另外，如Google Analytics Code，或是Facebook Likebox的一些调用外部服务的小代码段，能教给我们的比一些书还多。

今天我想逐条跟大家分析Addy Osmani 几天前分享的一个单行代码 。这行代码可以帮你debug你的各层CSS。为了方便观看，我将其分为三行显示：

```javascript
[].forEach.call($$("*"), function(a){
    a.style.outline="1px solid #"+(~~(Math.random()*(1<<24))).toString(16)
});
```

将它放在你的浏览器控制台中运行，页面中各层的HTML就会被不同的颜色标记出来。很酷对不对？基本上，这行代码**获取了页面中所有元素，然后给它们加上1px，颜色随机的边框**。虽然它的原理很简单，但是想要自己写出这样的代码，你得熟练掌握Web开发的方方面面。下面让我们一起学习它们。

##选取一个页面上所有的元素

首先需要做的是选取所有的元素，Addy用了只能在浏览器控制台中使用的$$。你可以在自己的浏览器的javascript控制台中输入 `$$('a')`，然后你会得到一个含有当前页面所有锚元素的列表。

$$函数是现代浏览器命令行的API的一部分，它等同于使用 `document.querySelectorAll` 方法。你可以将一个CSS选择器作为参数传入 `document.querySelectorAll` 去选取当前页面的元素。所以如果你想在浏览器的控制台以外使用那个单行代码，你可以用 `document.querySelectorAll('*')`来替代 `$$('*')`。点击这个[stackoverflow](http://stackoverflow.com/questions/8981211/what-is-the-source-of-the-double-dollar-sign-selector-query-function-in-chrome-f#answer-10308917)问答可以进一步了解**$$**。

非常好！对于我来说，能从这行代码中学习到$$函数就已经很满足了。然而在一个页面上选取所有元素的方法还有很多。如果你有看过gist上面的评论，你会发现有人在讨论这个话题。其中一个人就是Mathias Bynens（那里有很多大神！），他告诉我们可以用document.all去实现这个功能，并且能在所有的浏览器上运行。

##遍历元素

于是我们得到了存储所有的元素的NodeList，然后想给它们一个一个加上彩色的边框。不过等等，我们的代码里到底是怎么写的呢？

```javascript
[].forEach.call($$('*'), function(element) { /* And the modification code here */ });
[].forEach.call($$('*'), function(element) { /* 对元素作出改变的代码 */ });
```

NodeList看起来像Array，你可以使用方括号去访问它的节点，还可以访问length属性去了解它包含了多少元素，但是它并没有实现Array的所有接口，因此 `$$('*').forEach` 会失效。在Javascript里，有很多看起来像但不是数组的对象，例如函数里的arguments变量。我们有一个很好用的方法去处理这些对象：通过 `call` 和 `apply` 去实现像NodeList一样的非array对象有机会去调用array的函数。我几个月前谈过这些函数，它们调用另外一个函数，并将第一个参数作为该函数里面的this对象。

```javascript
function say(name) {
    console.log(this + ' ' + name);
}

say.call('hola', 'Mike'); // Prints out 'hola Mike' in the console
say.call('hola', 'Mike'); // 在console中输出'hola Mike'

// Also you can use it on the arguments object
//你也可以在arguments对象上使用它
function example(arg1, arg2, arg3) {
    return Array.prototype.slice.call(arguments, 1); // Returns [arg2, arg3]
}
```

单行代码用 `[].forEach.call` 来替代 `Array.prototype.forEach.call`。通过Array对象[]去调用Array的函数这样的方式（哈，又是一个给力的小技巧），节省了一些字节。这相当于在 `$$('*').forEach` 中，把 `$$('*')` 当成一个Array来使用。

如果你再去看看评论区，你会发现有些人为了让代码更短些而使用 `for(i=0;A=$$('*');)`。这确实可行，但是它会泄漏全局变量，所以如果你想要在控制台以外的地方使用这种方法，你最好在一个干净的环境中使用。

```javascript
for(var i=0,B=document.querySelectorAll('*');A=B[i++];){ /* your code here */ }
```

如果你在浏览器的控制台中使用就无所谓了，从你在里面定义它们开始，i和A变量将会一直在里面。

> 未完待续！