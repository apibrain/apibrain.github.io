---
layout: post
title: 通过一行代码学习Javascript
category: [前端开发, JavaScript]
tags: [技巧, 随机颜色, 位运算]
description: >
    通过一条「帮你debug页面各层CSS」的Javascript代码，可以学到很多东西。
excerpt: >
    在javascript无处不在的今天，我们每天都能很容易地学习到新的东西。一旦你掌握了这门语言的基本知识，就可以随处找到蕴含着丰富知识的代码。Bookmarklets 是一个完美的多种功能组合起来的工具，每当我发现一个有用的功能，我都会开心地去学习其源码，从中探索出怎么实现这样强大的功能。另外，如Google Analytics Code，或是Facebook Likebox的一些调用外部服务的小代码段，能教给我们的比一些书还多。
---

在javascript无处不在的今天，我们每天都能很容易地学习到新的东西。一旦你掌握了这门语言的基本知识，就可以随处找到蕴含着丰富知识的代码。[Bookmarklets](https://www.squarefree.com/bookmarklets/) 是一个完美的多种功能组合起来的工具，每当我发现一个有用的功能，我都会开心地去学习其源码，从中探索出怎么实现这样强大的功能。另外，如Google Analytics Code，或是Facebook Likebox的一些调用外部服务的小代码段，能教给我们的比一些书还多。

今天我想逐条跟大家分析Addy Osmani 几天前分享的一个单行代码 。这行代码可以帮你debug你的各层CSS。为了方便观看，我将其分为三行显示：

```javascript
[].forEach.call($$("*"), function(a){
    a.style.outline="1px solid #" + (~~(Math.random() * (1 << 24))).toString(16)
});
```

将它放在你的浏览器控制台中运行，页面中各层的HTML就会被不同的颜色标记出来。很酷对不对？基本上，这行代码**获取了页面中所有元素，然后给它们加上1px，颜色随机的边框**。虽然它的原理很简单，但是想要自己写出这样的代码，你得熟练掌握Web开发的方方面面。下面让我们一起学习它们。

## 选取一个页面上所有的元素

首先需要做的是选取所有的元素，Addy用了只能在浏览器控制台中使用的 `$$`。你可以在自己的浏览器的javascript控制台中输入 `$$('a')`，然后你会得到一个含有当前页面所有锚元素的列表。

`$$` 函数是现代浏览器命令行的API的一部分，它等同于使用 `document.querySelectorAll` 方法。你可以将一个CSS选择器作为参数传入 `document.querySelectorAll` 去选取当前页面的元素。所以如果你想在浏览器的控制台以外使用那个单行代码，你可以用 `document.querySelectorAll('*')`来替代 `$$('*')`。点击这个[stackoverflow](http://stackoverflow.com/questions/8981211/what-is-the-source-of-the-double-dollar-sign-selector-query-function-in-chrome-f#answer-10308917)问答可以进一步了解**$$**。

非常好！对于我来说，能从这行代码中学习到 **$$函数** 就已经很满足了。然而在一个页面上选取所有元素的方法还有很多。如果你有看过gist上面的评论，你会发现有人在讨论这个话题。其中一个人就是Mathias Bynens（那里有很多大神！），他告诉我们可以用document.all去实现这个功能，并且能在所有的浏览器上运行。

## 遍历元素

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

## 给元素上色

为了使这些元素都有漂亮的边框，代码使用了CSS的outline属性。如果你还不知道的话，显示的边框是在CSS区块模型外的，它并不对元素本身在布局中的大小和位置产生任何影响，因此该属性非常适合用来实现我们的需求。 它的语法就像border的一样，所以理解下面的部分应该不难：

```javascript
a.style.outline="1px solid #" + color
```

有意思的是这里定义颜色的方式：

```javascript
(~~(Math.random() * (1 << 24))).toString(16)
```

被吓到了吗？当然，我不是一个位操作的专家，因此这是我最喜欢的部分，因为我从中学到了很多新东西。

我们想得到的是十六进制表示的颜色，如白色 `#FFFFFF`， 或是蓝色 `#0000FF`，亦或是...谁知道呢... `#37f9ac` 吧。像我一样的普通人都习惯了使用十进制数字，而我们心爱的代码对十六进制非常地了解。

首先我们可以从中学到用 `toString` 方法把十进制整数转换成十六进制整数。该方法以接收的参数作为其进制基数，将一个数转换为一个字符串表示的数。如果没有传入参数，将会默认进行十进制转换，但其实你可以使用其他基数。

```javascript
(30).toString(); // "30"
(30).toString(10); // "30"
(30).toString(16); // "1e" Hexadecimal
(30).toString(2); // "11110" Binary
(30).toString(36); // "u" 36 is the maximum base allowed
 
(30).toString(); // "30"
(30).toString(10); // "30"
(30).toString(16); // "1e" 十六进制
(30).toString(2); // "11110" 二进制
(30).toString(36); // "u" 36 是所允许的最大基数
```

反过来，你可以使用 `parseInt` 方法的第二个参数将十六进制数的字符串形式转换为十进制数。

```javascript
parseInt("30"); // "30"
parseInt("30", 10); // "30"
parseInt("1e", 16); // "30"
parseInt("11110", 2); // "30"
parseInt("u", 36); // "30"
```

我们需要一个介于0和十六进制数 ffffff之间的随机数，那么就是 `parseInt("ffffff", 16) == 16777215`。16777215正好是2^24 - 1。

你喜欢二进制算术吗？不喜欢的话，你只需要知道 `1 << 24 == 16777216` 就好了（建议在控制台里试试）。

如果喜欢二进制算术，你得知道每次你在1的右侧加一个0，就相当于做了一次2^n操作，其中n为你加0的次数。

```javascript
1 // 1 == 2^0
100 // 4 == 2^2
10000 // 16 == 2^4
1000000000000000000000000 // 16777216 == 2^24
```

左移运算 `x << n` 是向x的二进制表示加入n个0，因此 `1 << 24` 是16777216的简写版，进而通过 `Math.random() * (1 << 4)` 我们可以得到一个介于0和16777216之间的随机数。

这还没完，因为 `Math.random` 返回的值是浮点数，而我们只需要整数部分。我们这里使用了波浪符号（~）去实现。波浪符号用于对一个变量按位取反。如果你不明白我在说什么，这里有个很好的[Javascript波浪符号讲解](http://www.bubuko.com/infodetail-407132.html)。

但是这些代码重点不在于按位取反，而在于利用位操作符会丢弃浮点数中的小数部分的特性，因此连续两次按位取反是一个替代 `parseInt` 的便捷方法：

```javascript
var a = 12.34, // ~~a = 12
b = -1231.8754, // ~~b = -1231
c = 3213.000001; // ~~c = 3213
 
~~a == parseInt(a, 10); // true
~~b == parseInt(b, 10); // true
~~c == parseInt(c, 10); // true
```

再提醒大家一遍，如果你去gist中看看评论区，你会发现大家在用更简短的代码去获取 `parseInt` 的结果。使用 `OR` 位操作符你可以去掉我们随机数中的小数部分。

```javascript
~~a == 0 | a == parseInt(a, 10)
~~b == 0 | b == parseInt(b, 10)
~~c == 0 | c == parseInt(c, 10)
```

`OR` 操作符的优先级在最后，所以使用时可以省掉括号。这里是Javascript操作符的优先级介绍，感兴趣的话可以看看。

终于我们有了介于0和16777216之间的随机数，即我们的随机颜色。为了使用它，我们现在只需要用 `toString(16)` 将其转换成字符串形式的十六进制数即可。

## 一些感想

当一名程序员并不容易。我们疯狂地写代码，有时却没有意识到我们需要多少知识去做我们做的事情。而消化掉所有我们在工作中用到的概念，需要很长的时间。

我想突出强调的是我们工作的复杂度，因为我知道程序员通常都会被低估（尤其在我的国家，西班牙）。在大部分公司里我们扮演着重要角色，并且我们的工作非常有价值——能经常这样说，是一件很好的事情。

如果你第一眼看到这单行代码，你就能理解它，你可以为你感到骄傲。

如果不能，但是你还是把文章看到这里，不要担心，你很快就有能力写出这样的代码，因为你是一个学习者！

> 本文由 伯乐在线 - 鸭梨山大 翻译，戴仓薯 校稿，原文链接：[http://web.jobbole.com/82204/](http://web.jobbole.com/82204/)