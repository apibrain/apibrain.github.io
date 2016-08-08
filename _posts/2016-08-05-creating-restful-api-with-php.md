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

### What Did That Do?

Let's walk through this file. The first thing that we do here is wrap everything in a check for the existence of mod_rewrite.c; if that Apache module is present, we can continue. We then turn the RewriteEngine On and prepare it to work by giving it two rules. These rules say to perform a Rewrite if the requested URI does not match an existing file or directory name.

In the next line declares the actual RewriteRule. This says that any requests to api/v1/ that is not an existing file or directory should instead be sent to `api/v1/index.php`. The `(.*)` marks a named capture, which is sent along to the MyAPI.php script as well in the request variable through the use of the $1 delimiter. At the end of that line are some flags that configure how the rewrite is performed. Firstly, `[QSA]` means that the named capture will be appended to the newly created URI. Second `[NC]` means that our URIs are not case sensitive. Finally, the `[L]` flag indicates that mod_rewrite should not process any additional rules if this rule matches.

### Constructing the Abstract Class

With our `.htaccess` file in place, it is now time to create our Abstract Class. As mentioned earlier, this class will act as a wrapper for all of the custom endpoints that our API will be using. To that extent, it must be able to take in our request, grab the endpoint from the URI string, detect the **HTTP method** (GET, POST, PUT, DELETE) and assemble any additional data provided in the header or in the URI. Once that's done, the abstract class will pass the request information on to a method in the concrete class to actually perform the work. We then return to the abstract class which will handle forming a HTTP response back to the client.

Firstly we're going to declare our class, its properties, and constructor:

```php
abstract class API
{
    /**
     * Property: method
     * The HTTP method this request was made in, either GET, POST, PUT or DELETE
     */
    protected $method = '';

    /**
     * Property: endpoint
     * The Model requested in the URI. eg: /files
     */
    protected $endpoint = '';

    /**
     * Property: verb
     * An optional additional descriptor about the endpoint, used for things that can
     * not be handled by the basic methods. eg: /files/process
     */
    protected $verb = '';

    /**
     * Property: args
     * Any additional URI components after the endpoint and verb have been removed, in our
     * case, an integer ID for the resource. eg: /<endpoint>/<verb>/<arg0>/<arg1>
     * or /<endpoint>/<arg0>
     */
    protected $args = Array();

    /**
     * Property: file
     * Stores the input of the PUT request
     */
    protected $file = Null;

    /**
     * Constructor: __construct
     * Allow for CORS, assemble and pre-process the data
     */
    public function __construct($request) {
        header("Access-Control-Allow-Orgin: *");
        header("Access-Control-Allow-Methods: *");
        header("Content-Type: application/json");

        $this->args = explode('/', rtrim($request, '/'));
        $this->endpoint = array_shift($this->args);
        if (array_key_exists(0, $this->args) && !is_numeric($this->args[0])) {
            $this->verb = array_shift($this->args);
        }

        $this->method = $_SERVER['REQUEST_METHOD'];
        if ($this->method == 'POST' && array_key_exists('HTTP_X_HTTP_METHOD', $_SERVER)) {
            if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'DELETE') {
                $this->method = 'DELETE';
            } else if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'PUT') {
                $this->method = 'PUT';
            } else {
                throw new Exception("Unexpected Header");
            }
        }

        switch ($this->method) {
            case 'DELETE':
            case 'POST':
                $this->request = $this->_cleanInputs($_POST);
                break;
            case 'GET':
                $this->request = $this->_cleanInputs($_GET);
                break;
            case 'PUT':
                $this->request = $this->_cleanInputs($_GET);
                $this->file = file_get_contents("php://input");
                break;
            default:
                $this->_response('Invalid Method', 405);
                break;
        }
    }
}
```
