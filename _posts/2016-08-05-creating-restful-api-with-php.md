---
layout: post
title: Creating a RESTful API with PHP
category: [后端开发, PHP]
tags: [RESTful, API]
description: >
    REST, or in the full form, Representational State Transfer has become the standard design architecture for developing web APIs
excerpt: >
    What is REST? REST, or in the full form, Representational State Transfer has become the standard design architecture for developing web APIs. At its heart REST is a stateless client-server relationship; this means that unlike many other approaches there is no client context being stored server side (no Sessions). To counteract that, each request contains all the information necessary for the server to authenticate the user, and any session state data that must be sent as well.
---

## First, Some Background

### What is REST?

REST, or in the full form, Representational State Transfer has become the standard design architecture for developing web APIs. At its heart REST is a stateless client-server relationship; this means that unlike many other approaches there is no client context being stored server side (no Sessions). To counteract that, each request contains all the information necessary for the server to authenticate the user, and any session state data that must be sent as well.

REST takes advantage of the HTTP request methods to layer itself into the existing HTTP architecture. These operations consist of the following:

- **GET** - Used for basic read requests to the server
- **PUT** - Used to modify an existing object on the server
- **POST** - Used to create a new object on the server
- **DELETE** - Used to remove an object on the server

By creating URI endpoints that utilize these operations, a **RESTful API** is quickly assembled.

### What is an API

In this sense an **API** - which stands for Application Programming Interface - allows for publicly exposed methods of an application to be accessed and manipulated outside of the program itself. A common usage of an API is when you wish to obtain data from a application (such as a cake recipe) without having to actually visit the application itself (checking GreatRecipies.com). To allow this action to take place, the application has published an API that specifically allows for foreign applications to make calls to its data and return said data to the user from inside of the external application. On the web, this is often done through the use of RESTful URIs. In our cake example the API could contain the URI of

> greatrecipies.com/api/v1/recipe/cake

The above is a **RESTful endpoint**. If you were to send a `GET` request to that URI the response might be a listing of the most recent cake recipes that the application has, a PUT request could add a new recipe to the database. If instead you were to request `/cake/141` you would probably receive a detailed recipe for a unique cake. These are both examples of sensible endpoints that create a predictable way of interacting with the application.

## Making Our Own RESTful API

The API that we're going to construct here will consist of two classes. One Abstract class that will handle the parsing of the URI and returning the response, and one concrete class that will consist of just the endpoints for our API. By separating things like this, we get a reusable Abstract class that can become the basis of any other RESTful API and have isolated all the unique code for the application itself into a single location.

However, before we can write either of those classes there's a third part of this that must be taken care of.

### Writing a .htaccess File

A `.htaccess` file provides directory level configuration on how a web server will handle requests to resources in the directory the .htaccess file itself lives in. Since we do not wish to have to create new PHP files for every endpoint that our API will contain (for several reasons one of which being that it creates issues with maintainability); instead we wish to have all requests that come to our API be routed to the controller which will then determine where the request intended to go, and forward it on to the code to handle that specific endpoint. With that in mind, let's create a `.htacccess` file:

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule api/v1/(.*)$ api/v1/api.php?request=$1 [QSA,NC,L]
</IfModule>
```
