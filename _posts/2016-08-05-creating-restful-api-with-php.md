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