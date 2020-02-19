# Deprecated

why-did-you-update is now deprecated.

Please use [@welldone-software/why-did-you-render](https://www.npmjs.com/package/@welldone-software/why-did-you-render) instead. It supports the latest React, tracks hooks, and does much more to improve performance.

# Why did you update

[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/) [![Build Status](https://travis-ci.org/maicki/why-did-you-update.svg?branch=master)](https://travis-ci.org/maicki/why-did-you-update)
[![npm version](https://badge.fury.io/js/why-did-you-update.svg)](https://badge.fury.io/js/why-did-you-update)

`Why-did-you-update` is a function that monkey patches React and notifies you in the console when **potentially** unnecessary re-renders occur.

![](https://i.imgur.com/NjI4PYt.png)

### Setup
This library is available on npm, install it with: `npm install --save why-did-you-update` or `yarn add why-did-you-update`.

### Sandbox
You can test the library [>> HERE <<](https://codesandbox.io/s/mywnl5xp58?expanddevtools=1) (notice the console).

### Version 1 Update With Breaking Changes

Check out the [releases](https://github.com/maicki/why-did-you-update/releases) page.

We now only support React 16+

To work with older versions of react, install an older version of this library:

`npm install --save why-did-you-update@0.1.1` or `yarn add why-did-you-update@0.1.1`

### Usage
```js
import React from 'react';

if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update');
  whyDidYouUpdate(React);
}
```

#### Options
Optionally you can pass in options as a second parameter. The following options are available:
- `include: [RegExp]`
- `exclude: [RegExp]`
- `groupByComponent: boolean`
- `collapseComponentGroups: boolean`
- `notifier: (groupByComponent: boolean, collapseComponentGroups: boolean, displayName: string, diffs: [Object]) => void`

##### include / exclude
You can include or exclude components by their displayName with the `include` and `exclude` options

```js
whyDidYouUpdate(React, { include: [/^pure/], exclude: [/^Connect/] });
```

##### groupByComponent / collapseComponentGroups
By default, the changes for each component are grouped by component and these groups collapsed. This can be changed with the `groupByComponent` and `collapseComponentGroups` options:

```js
whyDidYouUpdate(React, { groupByComponent: true, collapseComponentGroups: false });
```

##### notifier
A notifier can be provided if the official one does not suit your needs.

```js
const notifier = (groupByComponent, collapseComponentGroups, displayName, diffs) => {
  diffs.forEach(({name, prev, next, type}) => {
    // Use the diff and notify the user somehow
  });
};
whyDidYouUpdate(React, { notifier });
```

### Common Fixing Scenarios

#### Value Did Not Change

If you receive the message:
```
X.[props/state]: Value did not change. Avoidable re-render!`
```
About the props or the state object of component `X`, it means the component was rendered
although the object is the same:
```js
prevProps === props
```
or
```js
prevState === state
```
Usually renders are caused because of the rendering of their father, or state change.
In both cases, at least one of the two would change, at least by reference.

If both the state and the props are the same object, it means the render was
caused by `this.forceUpdate()` or `ReactDom.render()`:
```js
prevProps === props && prevState === state
```

#### Not Equal by Reference

If you receive the message:
```
"X" property is not equal by reference.
```
This means it received a new object with the same value. For example:
```js
const a = {"c": "d"}
const b = {"c": "d"}
a !== b
```
To avoid this warning, make sure to not recreate objects:
```js
const a = {"c": "d"}
const b = a
a === b
```

#### Changes Are in Functions Only

If you receive the message:
```
Changes are in functions only. Possibly avoidable re-render?
```
It's probably because you are creating a function inside render:
```js
render(){
  return <div fn={function something(){...}}/>
}
```
And this triggers a re-render because:
```js
function something(){...} !== function something(){...}
```
You can avoid it by binding this function in advance and then reusing it on all renders
```js
constructor(props){
  super(props)
  this.something = this.something.bind(this)
}
something(){
  ...
}
render(){
  return <div fn={this.something}/>
}
```

### Credit

I originally read about how Benchling created a mixin to do this on a per-component basis ([A deep dive into React perf debugging](http://benchling.engineering/deep-dive-react-perf-debugging/)).
That is really awesome but also tedious AF, so why not just monkey patch React.

### License

why-did-you-update is [MIT licensed](./LICENSE).
