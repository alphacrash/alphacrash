---
title: 'CSS - Basics'
excerpt: 'Basics in CSS'
date: '2023-11-09'
coverImage: '/assets/blog/hello-world/cover.jpg'
---
---
# CSS

### Universal Selector

Matches any element type’s name

```css
* {
	color: blue;
}
```

### Ruleset

Used for identification of selectors, which can be attached with other selectors

1. Declaration Block - Contains one or more semicolon separated declarations
2. Selector - Indicates the HTML element needed to be styled

### Elements of CSS Box Model

Defines layout and design of CSS elements.

Elements are content, padding, border, margin.

### Difference between `id` and `class`

- **Class (.)** - Way of using HTML elements for style.
    - Re-usability
    - Modularity
    - Multiple Elements
    - Example - Button
- **ID (#)** - Single element
    - Uniqueness
    - High Specificity
    - Example - Page Header

If an element has both class and id, id will take precedence

# Intermediate

### z-index

Specify stack order of elements that overlap each other.

- Default value is zero. It can take both negative and positive values.
- A higher z-index value is stacked above lower index element

### Target `h3` and `h2` with same styling

Target by separating with a comma

`h2, h3 { color: red; }`

### Control Image Repetition

```css
h3 {
	background-repeat: none;
}
```

### Image Scroll Continuation

Fixed background image example

```css
body {
	background-image: url(`url_of_image`);
}
```

### Font Related CSS attributes

- style
- variant
- weight
- family
- size

### Position

- Fixed
    - Normal flow
- Static (Default)
    - Normal flow
- Absolute
    - Positioned relative to closest ancestor
- Relative
    - Positioned relative to normal position. Use top, left, right and bottom properties to offset them.
- Sticky
    - Initially positioned like relative, but become fixed when a specific scroll position is reached

### Float

I prefer `direction, justifyContent, alignItems` provided by Grid in MUI

### Flex-box

`Grid` is an example by MUI.

- flex-direction
- justify-content
- align-items
- flex-grow

![Untitled](CSS%20-%20Interview%20Questions%20f7881783814a4feeb3a9fba33b30b9f6/Untitled.png)

# Advanced

### Styled Components

- Button
    
    ```jsx
    import styled from 'styled-components';
    
    const StyledButton = styled.button`
      background-color: #3498db;
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    
      &:hover {
        background-color: #2980b9;
      }
    `;
    ```
    
- MUI Button
    
    ```jsx
    import Button from '@mui/material/Button';
    import styled from 'styled-components';
    
    const StyledMuiButton = styled(Button)`
      background-color: #3498db;
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    
      &:hover {
        background-color: #2980b9;
      }
    `;
    ```
