'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _deepDiff = require('./deepDiff');

var defaultNotifier = function defaultNotifier(groupByComponent, collapseComponentGroups, displayName, diffs) {
  if (groupByComponent && collapseComponentGroups) {
    console.groupCollapsed && console.groupCollapsed(displayName);
  } else if (groupByComponent) {
    console.group && console.group(displayName);
  }

  diffs.forEach(notifyDiff);

  if (groupByComponent) {
    console.groupEnd && console.groupEnd();
  }
};

exports.defaultNotifier = defaultNotifier;
var notifyDiff = function notifyDiff(_ref) {
  var name = _ref.name;
  var prev = _ref.prev;
  var next = _ref.next;
  var type = _ref.type;

  switch (type) {
    case _deepDiff.DIFF_TYPES.SAME:
      console.warn(name + ': Value is the same (equal by reference). Avoidable re-render!');
      console.log('Value:', prev);
      break;
    case _deepDiff.DIFF_TYPES.EQUAL:
      console.warn(name + ': Value did not change. Avoidable re-render!');
      console.log('Before:', prev);
      console.log('After:', next);

      for (const [name, value] of Object.entries(prev)) {
        if (value !== next[name]) {
          console.log('"' + name + '" property is not equal by reference');
        }
      }
      break;
    case _deepDiff.DIFF_TYPES.FUNCTIONS:
      console.warn(name + ': Changes are in functions only. Possibly avoidable re-render?');
      console.log('Functions before:', prev);
      console.log('Functions after:', next);
      break;
  }
};
