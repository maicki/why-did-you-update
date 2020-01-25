import {equal} from 'assert'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import createReactClass from 'create-react-class';

import whyDidYouUpdate from 'src/'

const createConsoleStore = type => {
  const entries = []
  const fn = global.console[type]

  global.console[type] = (...args) => {
    entries.push(args)
    // uncomment to debug tests
    // fn.call(global.console, ...args)
  }

  return {
    destroy: () => global.console[type] = fn,
    entries
  }
}

class Stub extends React.Component {
  render () {
    return <noscript />
  }
}

describe(`whyDidYouUpdate wrapper`, () => {
  let node
  let groupStore
  let warnStore
  let logStore

  beforeEach(() => {
    node = document.createElement(`div`)
    groupStore = createConsoleStore(`groupCollapsed`)
    warnStore = createConsoleStore(`warn`)
    logStore = createConsoleStore(`log`)
  })

  afterEach(() => {
    React.__WHY_DID_YOU_UPDATE_RESTORE_FN__()
    unmountComponentAtNode(node)
    groupStore.destroy()
    warnStore.destroy()
    logStore.destroy()
  })

  it(`can ignore certain names using a regexp`, () => {
    whyDidYouUpdate(React, {exclude: /Stub/})

    render(<Stub a={1} />, node)
    render(<Stub a={1} />, node)

    equal(warnStore.entries.length, 0)
    equal(groupStore.entries.length, 0)
  })

  it(`can ignore certain names using a string`, () => {
    whyDidYouUpdate(React, {exclude: `Stub`})

    render(<Stub a={1} />, node)
    render(<Stub a={1} />, node)

    equal(warnStore.entries.length, 0)
    equal(groupStore.entries.length, 0)
  })

  it(`can include only certain names using a regexp`, () => {
    whyDidYouUpdate(React, {include: /Foo/})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    const createInstance = () =>
      <div>
        <Stub a={1} />
        <Foo a={1} />
      </div>

    render(createInstance(), node)
    render(createInstance(), node)

    equal(warnStore.entries.length, 2)
    equal(groupStore.entries.length, 1)
    equal(groupStore.entries[0][0], `Foo`)
  })

  it(`can include only certain names using a string`, () => {
    whyDidYouUpdate(React, {include: `Foo`})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    class FooBar extends React.Component {
      render () {
        return <noscript />
      }
    }

    const createInstance = () =>
      <div>
        <Stub a={1} />
        <Foo a={1} />
        <FooBar a={1} />
      </div>

    render(createInstance(), node)
    render(createInstance(), node)

    equal(warnStore.entries.length, 2)
    equal(groupStore.entries.length, 1)
    equal(groupStore.entries[0][0], `Foo`)
  })

  it(`can both include and exclude option`, () => {
    whyDidYouUpdate(React, {include: /Stub/, exclude: /Foo/})

    class StubFoo extends React.Component {
      render () {
        return <noscript />
      }
    }

    class StubBar extends React.Component {
      render () {
        return <noscript />
      }
    }

    const createInstance = () =>
      <div>
        <Stub a={1} />
        <StubFoo a={1} />
        <StubBar a={1} />
      </div>

    render(createInstance(), node)
    render(createInstance(), node)

    equal(warnStore.entries.length, 4)
    equal(groupStore.entries.length, 2)
    equal(groupStore.entries[0][0], `Stub`)
    equal(groupStore.entries[1][0], `StubBar`)
  })

  it(`accepts arrays as args to include/exclude`, () => {
    whyDidYouUpdate(React, {include: [/Stub/], exclude: [/Foo/, `StubBar`]})

    class StubFoo extends React.Component {
      render () {
        return <noscript />
      }
    }

    class StubBar extends React.Component {
      render () {
        return <noscript />
      }
    }

    const createInstance = () =>
      <div>
        <Stub a={1} />
        <StubFoo a={1} />
        <StubBar a={1} />
      </div>

    render(createInstance(), node)
    render(createInstance(), node)

    equal(warnStore.entries.length, 2)
    equal(groupStore.entries.length, 1)
    equal(groupStore.entries[0][0], `Stub`)
  })

  it(`skip wrapping certain names using a regexp`, () => {
    whyDidYouUpdate(React, {exclude: /Stub/})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    equal(React.createElement(Stub).type.name, 'Stub')
    equal(React.createElement(Foo).type.name, 'WDYUClassComponent')
  })

  it(`skip wrapping certain names using a string`, () => {
    whyDidYouUpdate(React, {exclude: 'Stub'})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    equal(React.createElement(Stub).type.name, 'Stub')
    equal(React.createElement(Foo).type.name, 'WDYUClassComponent')
  })

  it(`only wrap certain names using a regexp`, () => {
    whyDidYouUpdate(React, {include: /Stub/})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    equal(React.createElement(Stub).type.name, 'WDYUClassComponent')
    equal(React.createElement(Foo).type.name, 'Foo')
  })

  it(`only wrap certain names using a string`, () => {
    whyDidYouUpdate(React, {include: 'Stub'})

    class Foo extends React.Component {
      render () {
        return <noscript />
      }
    }

    equal(React.createElement(Stub).type.name, 'WDYUClassComponent')
    equal(React.createElement(Foo).type.name, 'Foo')
  })

  it(`still calls the original componentDidUpdate for class component`, done => {
    whyDidYouUpdate(React)

    class Foo extends React.Component {
      componentDidUpdate () {
        done()
      }

      render () {
        return <noscript />
      }
    }

    render(<Foo a={1} />, node)
    render(<Foo a={1} />, node)

    equal(warnStore.entries.length, 1)
    equal(groupStore.entries.length, 0)
  })

  it(`works with functional components`, () => {
    whyDidYouUpdate(React);

    const Foo = () => {
      React.useEffect(() => {}, [])
      
      return <noscript/>
    };

    render(<Foo a={1} />, node)
    render(<Foo a={1} />, node)

    equal(warnStore.entries.length, 2)
    equal(groupStore.entries.length, 1)
    equal(groupStore.entries[0][0], `Foo`)
  })

  it(`works with createClass`, () => {
    whyDidYouUpdate(React)

    const Foo = createReactClass({
      displayName: `Foo`,

      render () {
        return <noscript />
      }
    })

    render(<Foo a={1} />, node)
    render(<Foo a={1} />, node)

    equal(warnStore.entries.length, 2)
    equal(groupStore.entries.length, 1)
    equal(groupStore.entries[0][0], `Foo`)
  })

  it(`still calls the original componentDidUpdate for createClass`, done => {
    whyDidYouUpdate(React)

    const Foo = createReactClass({
      displayName: `Foo`,

      componentDidUpdate () {
        done()
      },

      render () {
        return <noscript />
      }
    })

    render(<Foo a={1} />, node)
    render(<Foo a={1} />, node)

    equal(warnStore.entries.length, 1)
    equal(groupStore.entries.length, 0)
  })

  it(`doesn't swallows original statics of a component`, () => {
    whyDidYouUpdate(React)

    class Foo extends React.Component {
      static someStaticValue = 'someStaticValue'
      render () {
        return <noscript />
      }
    }

    equal(Foo.someStaticValue, 'someStaticValue')
  })

  it(`doesn't swallows original statics of a functional component`, () => {
    whyDidYouUpdate(React)

    const Foo = () => <noscript/>;
    Foo.someStaticValue = 'someStaticValue'
    equal(Foo.someStaticValue, 'someStaticValue')
  })

  it('handler a complicated hierarchy', () => {
    const props = {
      "muiTheme": {
        "appBar": {
          "color": "#141f37",
          "textColor": "#ffffff",
          "height": 64,
          "titleFontWeight": 400,
          "padding": 24
        },
        "avatar": {
          "color": "#ffffff",
          "backgroundColor": "rgb(188, 188, 188)"
        },
        "badge": {
          "color": "#ffffff",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "primaryColor": "#141f37",
          "primaryTextColor": "#ffffff",
          "secondaryColor": "#ef942b",
          "secondaryTextColor": "#ffffff",
          "fontWeight": 500
        },
        "bottomNavigation": {
          "backgroundColor": "#ffffff",
          "unselectedColor": "rgba(0, 0, 0, 0.54)",
          "selectedColor": "#141f37",
          "height": 56,
          "unselectedFontSize": 12,
          "selectedFontSize": 14
        },
        "button": {
          "height": 36,
          "minWidth": 88,
          "iconButtonSize": 48
        },
        "card": {
          "titleColor": "rgba(0, 0, 0, 0.87)",
          "subtitleColor": "rgba(0, 0, 0, 0.54)",
          "fontWeight": 500
        },
        "cardMedia": {
          "color": "rgba(255, 255, 255, 0.87)",
          "overlayContentBackground": "rgba(0, 0, 0, 0.54)",
          "titleColor": "rgba(255, 255, 255, 0.87)",
          "subtitleColor": "rgba(255, 255, 255, 0.54)"
        },
        "cardText": {
          "textColor": "rgba(0, 0, 0, 0.87)"
        },
        "checkbox": {
          "boxColor": "rgba(0, 0, 0, 0.87)",
          "checkedColor": "#141f37",
          "requiredColor": "#141f37",
          "disabledColor": "rgba(0, 0, 0, 0.3)",
          "labelColor": "rgba(0, 0, 0, 0.87)",
          "labelDisabledColor": "rgba(0, 0, 0, 0.3)"
        },
        "chip": {
          "backgroundColor": "rgb(224, 224, 224)",
          "deleteIconColor": "rgba(0, 0, 0, 0.26)",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "fontSize": 14,
          "fontWeight": 400,
          "shadow": "0 1px 6px rgba(0, 0, 0, 0.12),\n        0 1px 4px rgba(0, 0, 0, 0.12)"
        },
        "datePicker": {
          "color": "#141f37",
          "textColor": "#ffffff",
          "calendarTextColor": "rgba(0, 0, 0, 0.87)",
          "selectColor": "#ef942b",
          "selectTextColor": "#ffffff",
          "calendarYearBackgroundColor": "#ffffff"
        },
        "dialog": {
          "titleFontSize": 22,
          "bodyFontSize": 16,
          "bodyColor": "rgba(0, 0, 0, 0.6)"
        },
        "dropDownMenu": {
          "accentColor": "#e0e0e0"
        },
        "enhancedButton": {
          "tapHighlightColor": "rgba(0, 0, 0, 0)"
        },
        "flatButton": {
          "color": "rgba(0, 0, 0, 0)",
          "buttonFilterColor": "#999999",
          "disabledTextColor": "rgba(0, 0, 0, 0.3)",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "primaryTextColor": "#141f37",
          "secondaryTextColor": "#ef942b",
          "fontSize": 14,
          "fontWeight": 500
        },
        "floatingActionButton": {
          "buttonSize": 56,
          "miniSize": 40,
          "color": "#141f37",
          "iconColor": "#ffffff",
          "secondaryColor": "#ef942b",
          "secondaryIconColor": "#ffffff",
          "disabledTextColor": "rgba(0, 0, 0, 0.3)",
          "disabledColor": "rgb(224, 224, 224)"
        },
        "gridTile": {
          "textColor": "#ffffff"
        },
        "icon": {
          "color": "#ffffff",
          "backgroundColor": "#141f37"
        },
        "inkBar": {
          "backgroundColor": "#ef942b"
        },
        "drawer": {
          "width": 256,
          "color": "#ffffff"
        },
        "listItem": {
          "nestedLevelDepth": 18,
          "secondaryTextColor": "rgba(0, 0, 0, 0.54)",
          "leftIconColor": "#757575",
          "rightIconColor": "#757575"
        },
        "menu": {
          "backgroundColor": "#ffffff",
          "containerBackgroundColor": "#ffffff"
        },
        "menuItem": {
          "dataHeight": 32,
          "height": 48,
          "hoverColor": "rgba(0, 0, 0, 0.1)",
          "padding": 24,
          "selectedTextColor": "#ef942b",
          "rightIconDesktopFill": "#757575"
        },
        "menuSubheader": {
          "padding": 24,
          "borderColor": "#e0e0e0",
          "textColor": "#141f37"
        },
        "overlay": {
          "backgroundColor": "rgba(0, 0, 0, 0.54)"
        },
        "paper": {
          "color": "rgba(0, 0, 0, 0.87)",
          "backgroundColor": "#ffffff",
          "zDepthShadows": [
            "0 1px 6px rgba(0, 0, 0, 0.12),\n         0 1px 4px rgba(0, 0, 0, 0.12)",
            "0 3px 10px rgba(0, 0, 0, 0.16),\n         0 3px 10px rgba(0, 0, 0, 0.23)",
            "0 10px 30px rgba(0, 0, 0, 0.19),\n         0 6px 10px rgba(0, 0, 0, 0.23)",
            "0 14px 45px rgba(0, 0, 0, 0.25),\n         0 10px 18px rgba(0, 0, 0, 0.22)",
            "0 19px 60px rgba(0, 0, 0, 0.3),\n         0 15px 20px rgba(0, 0, 0, 0.22)"
          ]
        },
        "radioButton": {
          "borderColor": "rgba(0, 0, 0, 0.87)",
          "backgroundColor": "#ffffff",
          "checkedColor": "#141f37",
          "requiredColor": "#141f37",
          "disabledColor": "rgba(0, 0, 0, 0.3)",
          "size": 24,
          "labelColor": "rgba(0, 0, 0, 0.87)",
          "labelDisabledColor": "rgba(0, 0, 0, 0.3)"
        },
        "raisedButton": {
          "color": "#ffffff",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "primaryColor": "#141f37",
          "primaryTextColor": "#ffffff",
          "secondaryColor": "#ef942b",
          "secondaryTextColor": "#ffffff",
          "disabledColor": "rgb(229, 229, 229)",
          "disabledTextColor": "rgba(0, 0, 0, 0.3)",
          "fontSize": 14,
          "fontWeight": 500
        },
        "refreshIndicator": {
          "strokeColor": "#e0e0e0",
          "loadingStrokeColor": "#141f37"
        },
        "ripple": {
          "color": "rgba(0, 0, 0, 0.87)"
        },
        "slider": {
          "trackSize": 2,
          "trackColor": "#bdbdbd",
          "trackColorSelected": "#9e9e9e",
          "handleSize": 12,
          "handleSizeDisabled": 8,
          "handleSizeActive": 18,
          "handleColorZero": "#bdbdbd",
          "handleFillColor": "#ffffff",
          "selectionColor": "#141f37",
          "rippleColor": "#141f37"
        },
        "snackbar": {
          "textColor": "#ffffff",
          "backgroundColor": "rgba(0, 0, 0, 0.87)",
          "actionColor": "#ef942b"
        },
        "subheader": {
          "color": "rgba(0, 0, 0, 0.54)",
          "fontWeight": 500
        },
        "stepper": {
          "backgroundColor": "transparent",
          "hoverBackgroundColor": "rgba(0, 0, 0, 0.06)",
          "iconColor": "#141f37",
          "hoveredIconColor": "#616161",
          "inactiveIconColor": "#9e9e9e",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "disabledTextColor": "rgba(0, 0, 0, 0.26)",
          "connectorLineColor": "#bdbdbd"
        },
        "svgIcon": {
          "color": "rgba(0, 0, 0, 0.87)"
        },
        "table": {
          "backgroundColor": "#ffffff"
        },
        "tableFooter": {
          "borderColor": "#e0e0e0",
          "textColor": "#9e9e9e"
        },
        "tableHeader": {
          "borderColor": "#e0e0e0"
        },
        "tableHeaderColumn": {
          "textColor": "#9e9e9e",
          "height": 56,
          "spacing": 24
        },
        "tableRow": {
          "hoverColor": "#f5f5f5",
          "stripeColor": "rgba(137, 143, 155, 0.4)",
          "selectedColor": "#e0e0e0",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "borderColor": "#e0e0e0",
          "height": 48
        },
        "tableRowColumn": {
          "height": 48,
          "spacing": 24
        },
        "tabs": {
          "backgroundColor": "#141f37",
          "textColor": "rgba(255, 255, 255, 0.7)",
          "selectedTextColor": "#ffffff"
        },
        "textField": {
          "textColor": "rgba(0, 0, 0, 0.87)",
          "hintColor": "rgba(0, 0, 0, 0.3)",
          "floatingLabelColor": "rgba(0, 0, 0, 0.3)",
          "disabledTextColor": "rgba(0, 0, 0, 0.3)",
          "errorColor": "#f44336",
          "focusColor": "#141f37",
          "backgroundColor": "transparent",
          "borderColor": "#e0e0e0"
        },
        "timePicker": {
          "color": "#ffffff",
          "textColor": "#ffffff",
          "accentColor": "#141f37",
          "clockColor": "rgba(0, 0, 0, 0.87)",
          "clockCircleColor": "rgba(0, 0, 0, 0.07)",
          "headerColor": "#00bcd4",
          "selectColor": "#ef942b",
          "selectTextColor": "#ffffff"
        },
        "toggle": {
          "thumbOnColor": "#141f37",
          "thumbOffColor": "#f5f5f5",
          "thumbDisabledColor": "#e0e0e0",
          "thumbRequiredColor": "#141f37",
          "trackOnColor": "rgba(20, 31, 55, 0.5)",
          "trackOffColor": "#bdbdbd",
          "trackDisabledColor": "#bdbdbd",
          "labelColor": "rgba(0, 0, 0, 0.87)",
          "labelDisabledColor": "rgba(0, 0, 0, 0.3)",
          "trackRequiredColor": "rgba(20, 31, 55, 0.5)"
        },
        "toolbar": {
          "color": "rgba(0, 0, 0, 0.54)",
          "hoverColor": "rgba(0, 0, 0, 0.87)",
          "backgroundColor": "rgb(232, 232, 232)",
          "height": 56,
          "titleFontSize": 20,
          "iconColor": "rgba(0, 0, 0, 0.4)",
          "separatorColor": "rgba(0, 0, 0, 0.175)",
          "menuHoverColor": "rgba(0, 0, 0, 0.1)"
        },
        "tooltip": {
          "color": "#ffffff",
          "rippleBackgroundColor": "#616161"
        },
        "zIndex": {
          "menu": 1000,
          "appBar": 1100,
          "drawerOverlay": 1200,
          "drawer": 1300,
          "dialogOverlay": 1400,
          "dialog": 1500,
          "layer": 2000,
          "popover": 2100,
          "snackbar": 2900,
          "tooltip": 3000
        },
        "isRtl": false,
        "spacing": {
          "iconSize": 24,
          "desktopGutter": 24,
          "desktopGutterMore": 32,
          "desktopGutterLess": 16,
          "desktopGutterMini": 8,
          "desktopKeylineIncrement": 64,
          "desktopDropDownMenuItemHeight": 32,
          "desktopDropDownMenuFontSize": 15,
          "desktopDrawerMenuItemHeight": 48,
          "desktopSubheaderHeight": 48,
          "desktopToolbarHeight": 56
        },
        "fontFamily": "Roboto, sans-serif",
        "borderRadius": 2,
        "palette": {
          "primary1Color": "#141f37",
          "primary2Color": "#ef942b",
          "primary3Color": "#bdbdbd",
          "accent1Color": "#ef942b",
          "accent2Color": "#f5f5f5",
          "accent3Color": "#9e9e9e",
          "textColor": "rgba(0, 0, 0, 0.87)",
          "secondaryTextColor": "rgba(0, 0, 0, 0.54)",
          "alternateTextColor": "#ffffff",
          "canvasColor": "#ffffff",
          "borderColor": "#e0e0e0",
          "disabledColor": "rgba(0, 0, 0, 0.3)",
          "pickerHeaderColor": "#00bcd4",
          "clockCircleColor": "rgba(0, 0, 0, 0.07)",
          "shadowColor": "rgba(0, 0, 0, 1)"
        },
        "baseTheme": {
          "spacing": {
            "iconSize": 24,
            "desktopGutter": 24,
            "desktopGutterMore": 32,
            "desktopGutterLess": 16,
            "desktopGutterMini": 8,
            "desktopKeylineIncrement": 64,
            "desktopDropDownMenuItemHeight": 32,
            "desktopDropDownMenuFontSize": 15,
            "desktopDrawerMenuItemHeight": 48,
            "desktopSubheaderHeight": 48,
            "desktopToolbarHeight": 56
          },
          "fontFamily": "Roboto, sans-serif",
          "palette": {
            "primary1Color": "#141f37",
            "primary2Color": "#ef942b",
            "primary3Color": "#bdbdbd",
            "accent1Color": "#ef942b",
            "accent2Color": "#f5f5f5",
            "accent3Color": "#9e9e9e",
            "textColor": "rgba(0, 0, 0, 0.87)",
            "secondaryTextColor": "rgba(0, 0, 0, 0.54)",
            "alternateTextColor": "#ffffff",
            "canvasColor": "#ffffff",
            "borderColor": "#e0e0e0",
            "disabledColor": "rgba(0, 0, 0, 0.3)",
            "pickerHeaderColor": "#00bcd4",
            "clockCircleColor": "rgba(0, 0, 0, 0.07)",
            "shadowColor": "rgba(0, 0, 0, 1)"
          }
        },
        "rawTheme": {
          "spacing": {
            "iconSize": 24,
            "desktopGutter": 24,
            "desktopGutterMore": 32,
            "desktopGutterLess": 16,
            "desktopGutterMini": 8,
            "desktopKeylineIncrement": 64,
            "desktopDropDownMenuItemHeight": 32,
            "desktopDropDownMenuFontSize": 15,
            "desktopDrawerMenuItemHeight": 48,
            "desktopSubheaderHeight": 48,
            "desktopToolbarHeight": 56
          },
          "fontFamily": "Roboto, sans-serif",
          "palette": {
            "primary1Color": "#141f37",
            "primary2Color": "#ef942b",
            "primary3Color": "#bdbdbd",
            "accent1Color": "#ef942b",
            "accent2Color": "#f5f5f5",
            "accent3Color": "#9e9e9e",
            "textColor": "rgba(0, 0, 0, 0.87)",
            "secondaryTextColor": "rgba(0, 0, 0, 0.54)",
            "alternateTextColor": "#ffffff",
            "canvasColor": "#ffffff",
            "borderColor": "#e0e0e0",
            "disabledColor": "rgba(0, 0, 0, 0.3)",
            "pickerHeaderColor": "#00bcd4",
            "clockCircleColor": "rgba(0, 0, 0, 0.07)",
            "shadowColor": "rgba(0, 0, 0, 1)"
          }
        }
      },
      "id": "cj2h8rzxr36m40194zubn6yat",
      "createdAt": "2017-05-09T07:35:50.000Z",
      "updatedAt": "2017-06-13T13:25:04.000Z",
      "images": [
        "https:\/\/www.example.com\/path\/to\/image.jpg"
      ],
      "isSelected": false
    }

    whyDidYouUpdate(React, {exclude: `Stub`})

    render(<Stub props={props} />, node)
    render(<Stub props={props} />, node)

    equal(warnStore.entries.length, 0)
    equal(groupStore.entries.length, 0)
  })
})
