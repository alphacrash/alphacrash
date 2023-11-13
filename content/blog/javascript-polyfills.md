---
title: 'JavaScript - Polyfills'
excerpt: 'Polyfills for common JavaScript functions'
date: '2023-11-13'
coverImage: '/assets/blog/hello-world/cover.jpg'
---
---
# JavaScript - Polyfills

## forEach

The `forEach` method is used to iterate over elements in an array and execute a provided function once for each array element. It does not create a new array and, by default, returns undefined. It is often used when you want to perform some operation on each element of an array.

```javascript
const names = ["John", "Jane", "Doe"];
names.forEach(x => console.log(x));
```

### Console
```console
"John"
"Jane"
"Doe"
```

### Polyfill
```javascript
Array.prototype.forEachX = function (callback) {
  for (let i = 0; i < this.length; i++) {
    callback(this[i]);
  }
}

const names = ["John", "Jane", "Doe"]
names.forEachX(x => console.log(x));
```

## map

The `map` method is used to create a new array by applying a provided function to each element in the original array. It returns a new array containing the results of applying the function to each element. It's particularly useful when you want to transform each element in an array and create a new array with the transformed values.

```javascript
const users = [1, 2, 3];
const newUsers = users.map(x => x + x);
console.log(newUsers);
```

### Console
```console
[2, 4, 6]
```

### Polyfill
```javascript
Array.prototype.mapX = function (callback) {
  const newArray = [];
  for (let i = 0; i < this.length; i++) {
    newArray.push(callback(this[i]));
  }
  return newArray;
};

const users = [1, 2, 3];
const newUsers = users.mapX(x => x + x);
console.log(newUsers);
```

## filter

`filter` method is used on arrays to create a new array with elements that satisfy a specified condition.

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evenNumbers = numbers.filter(number => number % 2 === 0);
console.log(evenNumbers);
```

### Console
```console
[2, 4, 6, 8, 10]
```

### Polyfill
```javascript
Array.prototype.filterX = function (callback) {
  const newArray = [];
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i])) {
      newArray.push(this[i]);
    }
  }
  return newArray;
}

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evenNumbers = numbers.filterX(number => number % 2 === 0);
console.log(evenNumbers);
```

## Reduce
The `reduce` method is used to accumulate or reduce the elements of an array into a single value. 

```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce(function (accumulator, currentValue) {
  return accumulator + currentValue;
}, 0);
console.log(sum);
```

### Console
```console
15
```

### Polyfill
```javascript
Array.prototype.reduceX = function (callback, initialValue) {
  let accumulator = initialValue !== undefined ? initialValue : this[0];
  const startIndex = initialValue !== undefined ? 0 : 1;
  
  for (let i = startIndex; i < this.length; i++) {
    accumulator = callback(accumulator, this[i], i, this);
  }
  
  return accumulator;
}

const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduceX(function (accumulator, currentValue) {
  return accumulator + currentValue;
}, 0);
console.log(sum);
```

### Explanation of callback
The reduce method in JavaScript allows flexibility by providing four parameters to the `callback` function. Each parameter serves a specific purpose, enabling you to customize how the reduction operation is performed. Here's a breakdown of the four parameters:

1. `accumulator`: The accumulator is the accumulated result of the previous iterations. It starts with the initial value if one is provided or the first element of the array if an initial value is not provided. The accumulator is updated in each iteration based on the return value of the callback function.

2. `currentValue`: This parameter represents the current element being processed in the array. For each iteration, the callback function receives the current element (this[i]) and can use its value in the reduction operation.

3. `currentIndex`: The currentIndex parameter is the index of the current element in the array (i). It provides information about the position of the current element within the array, allowing you to use or consider the index in your callback logic.

4. `array`: The array parameter is a reference to the array on which the reduce method is called (this). It allows the callback function to access the entire array, providing context and additional information for the reduction.

The reason for providing these four parameters is to give developers flexibility and control over how the reduction operation is performed. It allows you to create versatile and customizable callback functions that can consider the previous accumulated value, the current element, its index, and the entire array when determining the next accumulated result.

## concat
Concatenation is the process of combining two or more strings, arrays, or other data structures into a single, larger entity. 

```javascript
const array1 = [1, 2, 3];
const array2 = [4, 5, 6];
const concatenatedArray = array1.concat(array2);

console.log(concatenatedArray);
```

### Console
```console
[1, 2, 3, 4, 5, 6]
```

### Polyfill
```javascript
Array.prototype.concatX = function () {
  const newArray = [...this];
  for (let i = 0; i < arguments.length; i++) {
    if (Array.isArray(arguments[i])) {
      newArray.push(...arguments[i]);
    } else {
      newArray.push(arguments[i]);
    }
  }
  return newArray;
}

const array1 = [1, 2, 3];
const array2 = [4, 5, 6];
const concatenatedArray = array1.concatX(array2);

console.log(concatenatedArray);
```


## find

The `Array.prototype.find()` method in JavaScript is used to retrieve the first element in an array that satisfies a given condition.

```javascript
const numbers = [1, 2, 3, 4, 5];
const foundNumber = numbers.find(function(element) {
  return element > 2;
});

console.log(foundNumber);
```

### Console
```console
3
```

### Polyfill
```javascript
Array.prototype.findX = function(callback, thisArg) {
    for (let i = 0; i < this.length; i++) {
      if (callback.call(thisArg, this[i], i, this)) {
        return this[i];
      }
    }
    return undefined;
};

const numbers = [1, 2, 3, 4, 5];
const foundNumber = numbers.findX(function(element) {
  return element > 2;
});

console.log(foundNumber);
```

## flat

The `Array.prototype.flat()` method in JavaScript is used to flatten nested arrays. If this method is not supported in your environment, you can create a polyfill to add this functionality.

```javascript
const nestedArray = [1, [2, [3, 4], 5]];
const flatArray = nestedArray.flat(2);

console.log(flatArray);
```

### Console
```console
[1, 2, 3, 4, 5]
```

### Polyfill
```javascript
Array.prototype.flatX = function(depth = 1) {
    const flattenedArray = [];

    function flatten(arr, currentDepth) {
      for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i]) && currentDepth < depth) {
          flatten(arr[i], currentDepth + 1);
        } else {
          flattenedArray.push(arr[i]);
        }
      }
    }

    flatten(this, 0);
    return flattenedArray;
};

const nestedArray = [1, [2, [3, 4], 5]];
const flatArray = nestedArray.flatX(2);

console.log(flatArray);
```

## flatMap

The `Array.prototype.flatMap()` method in JavaScript is used to first map each element using a mapping function, then flatten the result into a new array. 

```javascript
const array = [1, 2, 3];
const result = array.flatMap(function (value) {
  return [value * 2, value * 3];
});

console.log(result);
```

### Console
```console
[2, 3, 4, 6, 6, 9]
```

### Polyfill
```javascript
Array.prototype.flatMapX = function(callback, thisArg) {
    return this.reduce(function(flatArray, currentElement, currentIndex, array) {
      const mappedValue = callback.call(thisArg, currentElement, currentIndex, array);
      
      if (Array.isArray(mappedValue)) {
        flatArray.push(...mappedValue);
      } else {
        flatArray.push(mappedValue);
      }

      return flatArray;
    }, []);
};

const array = [1, 2, 3];
const result = array.flatMapX(function (value) {
  return [value * 2, value * 3];
});

console.log(result);
```

## slice

The `splice()` method of Array instances changes the contents of an array by removing or replacing existing elements and/or adding new elements in place.

```javascript
const originalArray = [1, 2, 3, 4, 5];
const slicedArray = originalArray.slice(1, 4);

console.log(slicedArray);
```

### Console
```console
[2, 3, 4]
```

### Polyfill
```javascript
Array.prototype.slice = function(start, end) {
    start = typeof start !== 'undefined' ? start : 0;
    end = typeof end !== 'undefined' ? end : this.length;

    const slicedArray = [];
    for (let i = start; i < end; i++) {
      slicedArray.push(this[i]);
    }

    return slicedArray;
};
const originalArray = [1, 2, 3, 4, 5];
const slicedArray = originalArray.slice(1, 4);

console.log(slicedArray);
```
