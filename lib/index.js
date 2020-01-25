'use strict';

exports.__esModule = true;
exports.whyDidYouUpdate = undefined;

var _deepDiff = require('./deepDiff');

var _getDisplayName = require('./getDisplayName');

var _normalizeOptions = require('./normalizeOptions');

var _shouldInclude = require('./shouldInclude');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var memoized = function memoized(map, key, fn) {
  // key already in the memoizer
  if (map.has(key)) {
    return map.get(key);
  }
  // key not in memoizer,
  // evaluate the function to get the value
  // to store in our memoizer.
  var ret = fn();
  map.set(key, ret);
  return ret;
};

function createComponentDidUpdate(displayName, opts) {
  return function componentDidUpdate(prevProps, prevState) {
    var propsDiff = (0, _deepDiff.classifyDiff)(prevProps, this.props, displayName + '.props');
    if (propsDiff.type === _deepDiff.DIFF_TYPES.UNAVOIDABLE) {
      return;
    }

    var stateDiff = (0, _deepDiff.classifyDiff)(prevState, this.state, displayName + '.state');
    if (stateDiff.type === _deepDiff.DIFF_TYPES.UNAVOIDABLE) {
      return;
    }
    opts.notifier(opts.groupByComponent, opts.collapseComponentGroups, displayName, [propsDiff, stateDiff]);
  };
}

// Creates a wrapper for a React class component
var createClassComponent = function createClassComponent(ctor, displayName, opts) {
  var cdu = createComponentDidUpdate(displayName, opts);

  // the wrapper class extends the original class,
  // and overwrites its `componentDidUpdate` method,
  // to allow why-did-you-update to listen for updates.
  // If the component had its own `componentDidUpdate`,
  // we call it afterwards.`
  var WDYUClassComponent = function (_ctor) {
    _inherits(WDYUClassComponent, _ctor);

    function WDYUClassComponent() {
      _classCallCheck(this, WDYUClassComponent);

      return _possibleConstructorReturn(this, _ctor.apply(this, arguments));
    }

    WDYUClassComponent.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState, snapshot) {
      cdu.call(this, prevProps, prevState);
      if (typeof ctor.prototype.componentDidUpdate === 'function') {
        ctor.prototype.componentDidUpdate.call(this, prevProps, prevState, snapshot);
      }
    };

    return WDYUClassComponent;
  }(ctor);
  // our wrapper component needs an explicit display name
  // based on the original constructor.
  var descriptor = Object.getOwnPropertyDescriptor(WDYUClassComponent, 'displayName');
  if (!WDYUClassComponent.displayName || descriptor && descriptor.writable) {
    WDYUClassComponent.displayName = displayName;
  }

  return WDYUClassComponent;
};

// Creates a wrapper for a React functional component
var createFunctionalComponent = function createFunctionalComponent(ctor, displayName, opts) {
  var cdu = createComponentDidUpdate(displayName, opts);

  var previousProps = {};
  var state = {};
  var WDYUFunctionalComponent = function WDYUFunctionalComponent(props, context) {
    cdu.call({ props: props, state: state }, previousProps, state);
    previousProps = props;
    return ctor(props, context);
  };

  WDYUFunctionalComponent.displayName = displayName;
  WDYUFunctionalComponent.contextTypes = ctor.contextTypes;

  return WDYUFunctionalComponent;
};

var whyDidYouUpdate = exports.whyDidYouUpdate = function whyDidYouUpdate(React) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  opts = (0, _normalizeOptions.normalizeOptions)(opts);

  // Store the original `React.createElement`,
  // which we're going to reference in our own implementation
  // and which we put back when we remove `whyDidYouUpdate` from React.
  var _createReactElement = React.createElement;

  // The memoizer is a JavaScript map that allows us to return
  // the same WrappedComponent for the same original constructor.
  // This ensure that by wrapping the constructor, we don't break
  // React's reconciliation process.
  var memo = new Map();

  // Our new implementation of `React.createElement` works by
  // replacing the element constructor with a class that wraps it.
  React.createElement = function (type) {
    var ctor = type;

    var displayName = (0, _getDisplayName.getDisplayName)(ctor);
    // the element is a class component or a functional component
    if (typeof ctor === 'function' && (0, _shouldInclude.shouldInclude)(displayName, opts)) {
      if (ctor.prototype && typeof ctor.prototype.render === 'function') {
        // If the constructor has a `render` method in its prototype,
        // we're dealing with a class component
        ctor = memoized(memo, ctor, function () {
          return createClassComponent(ctor, displayName, opts);
        });
      } else {
        // If the constructor function has no `render`,
        // it must be a simple functioanl component.
        ctor = memoized(memo, ctor, function () {
          return createFunctionalComponent(ctor, displayName, opts);
        });
      }
    }

    // Call the old `React.createElement,
    // but with our overwritten constructor

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _createReactElement.apply(React, [ctor].concat(rest));
  };

  React.__WHY_DID_YOU_UPDATE_RESTORE_FN__ = function () {
    React.createElement = _createReactElement;
    delete React.__WHY_DID_YOU_UPDATE_RESTORE_FN__;
  };

  return React;
};

exports.default = whyDidYouUpdate;