---
title: 'JavaScript - ES6'
excerpt: 'What is new in ES6'
date: '2023-11-12'
coverImage: '/assets/blog/hello-world/cover.jpg'
---
---
# ES6 - What's New?

1. Arrow Functions
2. Template Literals
    ```javascript
    Hello `${name}!`
    ```
3. Destructuring Assignment
    ```javascript
    const [a, b] = [1, 2];
    const { x, y } = { x: 10, y : 20 };
    ```
4. Let and Const
5. Default Parameters
    ```javascript
    function example (param = defaultValue) {
        // function body
    }
    ```
6. Rest Parameters
    ```javascript
    function exampleFunction(...args)
    ```
7. Spread Operator
    ```javascript
    const newArray = [...oldArray];
    const newObj = { ...oldObj };
    ```
8. Classes
    ```javascript
    class MyClass {
        constructor() {

        }
    }
    ```
9. Modules
    ```javascript
    export const myVariable = 42;
    import { myVariable } from "./otherModule";
    ```
10. Promises
    ```javascript
    const myPromise = new Promise((resolve, reject)) => {
        // asynchrounous code
    }
    ```
