# Why did you update

[![Build Status](https://travis-ci.org/maicki/why-did-you-update.svg?branch=master)](https://travis-ci.org/maicki/why-did-you-update)
[![npm version](https://badge.fury.io/js/why-did-you-update.svg)](https://badge.fury.io/js/why-did-you-update)

Why did you update is a function that monkey patches React and notifies you in the console when **potentially** unnecessary re-renders occur.

![](https://i.imgur.com/NjI4PYt.png)

### Setup
This library is available on npm, install it with: `npm install --save why-did-you-update` or `yarn add why-did-you-update`.

### Usage
```js
import React from 'react'

if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update')
  whyDidYouUpdate(React)
}
```

#### Options
Optionally you can pass in options as a second parameter. The following options are available:
- `include: RegExp`
- `exclude: RegExp`
- `groupByComponent: boolean`
- `collapseComponentGroups: boolean`
- `notifier: (groupByComponent: boolean, collapseComponentGroups: boolean, displayName: string, diffs: [Object]) => void`

##### include / exclude
You can include or exclude components by their displayName with the `include` and `exclude` options

```js
whyDidYouUpdate(React, { include: /^pure/, exclude: /^Connect/ })
```

##### groupByComponent / collapseComponentGroups
By default, the changes for each component are grouped by component and these groups collapsed. This can be changed with the `groupByComponent` and `collapseComponentGroups` options:

```js
whyDidYouUpdate(React, { groupByComponent: true, collapseComponentGroups: false })
```

##### notifier
A notifier can be provided if the official one does not suite your needs.

```js
const notifier = (groupByComponent, collapseComponentGroups, displayName, diffs) => {
  diffs.forEach(({name, prev, next, type}) => {
    // Use the diff and notify the user somehow
  });
}
whyDidYouUpdate(React, { notifier });
```

### Credit

I originally read about how Benchling created a mixin to do this on a per component basis ([A deep dive into React perf debugging](http://benchling.engineering/deep-dive-react-perf-debugging/)).
That is really awesome but also tedious AF, so why not just monkey patch React.

[build-badge]: https://img.shields.io/travis/garbles/why-did-you-update/master.svg?style=flat-square
[build]: https://travis-ci.org/garbles/why-did-you-update
