;(function () {
  'use strict'
  var TYPE_STRING = 1,
    TYPE_NUMBER = 2,
    TYPE_OBJECT = 3,
    TYPE_ARRAY = 4,
    TYPE_BOOL = 5,
    TYPE_NULL = 6
  function removeComments(str) {
    str = ('__' + str + '__').split('')
    var mode = {
      singleQuote: false,
      doubleQuote: false,
      regex: false,
      blockComment: false,
      lineComment: false,
      condComp: false,
    }
    for (var i = 0, l = str.length; i < l; i++) {
      if (mode.regex) {
        if (str[i] === '/' && str[i - 1] !== '\\') {
          mode.regex = false
        }
        continue
      }
      if (mode.singleQuote) {
        if (str[i] === "'" && str[i - 1] !== '\\') {
          mode.singleQuote = false
        }
        continue
      }
      if (mode.doubleQuote) {
        if (str[i] === '"' && str[i - 1] !== '\\') {
          mode.doubleQuote = false
        }
        continue
      }
      if (mode.blockComment) {
        if (str[i] === '*' && str[i + 1] === '/') {
          str[i + 1] = ''
          mode.blockComment = false
        }
        str[i] = ''
        continue
      }
      if (mode.lineComment) {
        if (str[i + 1] === '\n' || str[i + 1] === '\r') {
          mode.lineComment = false
        }
        str[i] = ''
        continue
      }
      if (mode.condComp) {
        if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
          mode.condComp = false
        }
        continue
      }
      mode.doubleQuote = str[i] === '"'
      mode.singleQuote = str[i] === "'"
      if (str[i] === '/') {
        if (str[i + 1] === '*' && str[i + 2] === '@') {
          mode.condComp = true
          continue
        }
        if (str[i + 1] === '*') {
          str[i] = ''
          mode.blockComment = true
          continue
        }
        if (str[i + 1] === '/') {
          str[i] = ''
          mode.lineComment = true
          continue
        }
        mode.regex = true
      }
    }
    return str.join('').slice(2, -2)
  }
  function firstJSONCharIndex(s) {
    var arrayIdx = s.indexOf('['),
      objIdx = s.indexOf('{'),
      idx = 0
    if (arrayIdx !== -1) idx = arrayIdx
    if (objIdx !== -1) {
      if (arrayIdx === -1) idx = objIdx
      else idx = Math.min(objIdx, arrayIdx)
    }
    return idx
  }

  const getSpanBoth = (className, innerText) => document.createElement('span')
    .className = className
    .innerText = innerText

  var templates = {
    t_kvov: getSpanBoth('kvov'),
    t_exp: getSpanBoth('e'),
    t_key: getSpanBoth('k'),
    t_string: getSpanBoth('s'),
    t_number: getSpanBoth('n'),
    t_null: getSpanBoth('null', 'nl'),
    t_true: getSpanBoth('true', 'bl'),
    t_false: getSpanBoth('false', 'bl'),
    t_oBrace: getSpanBoth('{', 'b'),
    t_cBrace: getSpanBoth('}', 'b'),
    t_oBracket: getSpanBoth('[', 'b'),
    t_cBracket: getSpanBoth(']', 'b'),
    t_ellipsis: getSpanBoth('ell'),
    t_blockInner: getSpanBoth('blockInner'),
    t_colonAndSpace: document.createTextNode(':\u00A0'),
    t_commaText: document.createTextNode(','),
    t_dblqText: document.createTextNode('"'),
  }

  function getKvovDOM(value, keyName) {
    let type
    if (typeof value === 'string') type = TYPE_STRING
    else if (typeof value === 'number') type = TYPE_NUMBER
    else if (value === false || value === true) type = TYPE_BOOL
    else if (value === null) type = TYPE_NULL
    else if (value instanceof Array) type = TYPE_ARRAY
    else type = TYPE_OBJECT

    let kvov = templates.t_kvov.cloneNode()
    if (type === TYPE_OBJECT || type === TYPE_ARRAY) {
      let nonZeroSize = false
      for (let objKey in value) {
        if (value.hasOwnProperty(objKey)) {
          nonZeroSize = true
          break
        }
      }
      if (nonZeroSize) kvov.appendChild(templates.t_exp.cloneNode())
    }
    if (keyName !== false) {
      kvov.classList.add('objProp')
      let keySpan = templates.t_key.cloneNode()
      keySpan.textContent = JSON.stringify(keyName).slice(1, -1)
      kvov.appendChild(templates.t_dblqText.cloneNode())
      kvov.appendChild(keySpan)
      kvov.appendChild(templates.t_dblqText.cloneNode())
      kvov.appendChild(templates.t_colonAndSpace.cloneNode())
    } else {
      kvov.classList.add('arrElem')
    }

    let blockInner, childKvov
    switch (type) {
      case TYPE_STRING:
        var innerStringEl = document.createElement('span')
          escapedString = JSON.stringify(value)
        escapedString = escapedString.substring(1, escapedString.length - 1)
        if (value[0] === 'h' && value.substring(0, 4) === 'http') {
          var innerStringA = document.createElement('a')
            .href = value
            .innerText = escapedString
            .appendChild(innerStringA)
        } else {
          innerStringEl.innerText = escapedString
        }
        kvov.appendChild(
          templates.t_string.cloneNode()
            .appendChild(templates.t_dblqText.cloneNode())
            .appendChild(innerStringEl)
            .appendChild(templates.t_dblqText.cloneNode())
        )
        break
      case TYPE_NUMBER:
        kvov.appendChild(
          templates.t_number.cloneNode()
            .innerText = value
        )
        break
      case TYPE_OBJECT:
        kvov.appendChild(templates.t_oBrace.cloneNode(true))
        if (nonZeroSize) {
          kvov.appendChild(templates.t_ellipsis.cloneNode())
          blockInner = templates.t_blockInner.cloneNode()

          var count = 0, comma
          for (let k in value) {
            if (value.hasOwnProperty(k)) {
              count++
              childKvov = getKvovDOM(value[k], k)
              comma = templates.t_commaText.cloneNode()
              childKvov.appendChild(comma)
              blockInner.appendChild(childKvov)
            }
          }
          childKvov.removeChild(comma)
          kvov.appendChild(blockInner)
        }
        kvov.appendChild(templates.t_cBrace.cloneNode(true))
        break
      case TYPE_ARRAY:
        kvov.appendChild(templates.t_oBracket.cloneNode(true))
        if (nonZeroSize) {
          kvov.appendChild(templates.t_ellipsis.cloneNode())
          blockInner = templates.t_blockInner.cloneNode()
          for (
            var i = 0, length = value.length, lastIndex = length - 1;
            i < length;
            i++
          ) {
            childKvov = getKvovDOM(value[i], )
            if (i < lastIndex)
              childKvov.appendChild(templates.t_commaText.cloneNode())
            blockInner.appendChild(childKvov)
          }
          kvov.appendChild(blockInner)
        }
        kvov.appendChild(templates.t_cBracket.cloneNode(true))
        break
      case TYPE_BOOL:
        if (value) kvov.appendChild(templates.t_true.cloneNode(true))
        else kvov.appendChild(templates.t_false.cloneNode(true))
        break
      case TYPE_NULL:
        kvov.appendChild(templates.t_null.cloneNode(true))
        break
    }
    return kvov
  }

  function jsonObjToHTML(obj, jsonpFunctionName) {
    var rootKvov = getKvovDOM(obj, false)
      .classList.add('rootKvov')
    var divFormattedJson = document.createElement('DIV')
      .id = 'formattedJson'
      .appendChild(rootKvov)
    if (jsonpFunctionName !== null) return `
      <div id="jsonpOpener">
        ${jsonpFunctionName} ( 
          </div>
          ${divFormattedJson.outerHTML}
          <div id="jsonpCloser">
        )
      </div>
    `
  }
  chrome.extension.onConnect.addListener(function (port) {
    if (port.name !== 'jf') {
      console.log('JSON Formatter error - unknown port name ' + port.name, port)
      return
    }

    port.onMessage.addListener(function ({ type, text }) {
      var jsonpFunctionName = null,
        validJsonText
      if (type === 'SENDING TEXT') {
        var obj
        var strippedText = text.substring(firstJSONCharIndex(text))
        try {
          obj = JSON.parse(strippedText)
          validJsonText = strippedText
        } catch (e) {
          text = text.trim()

          let indexOfParen = text.indexOf('(')
          if ( !indexOfParen ) {
            port.postMessage(['NOT JSON', 'no opening parenthesis'])
            port.disconnect()
            return
          }

          var firstBit = removeComments(text.substring(0, indexOfParen)).trim()
          if (!firstBit.match(/^[a-zA-Z_$][\.\[\]'"0-9a-zA-Z_$]*$/)) {
            port.postMessage([
              'NOT JSON',
              'first bit not a valid function name',
            ])
            port.disconnect()
            return
          }

          var indexOfLastParen = text.lastIndexOf(')')
          if ( !indexOfLastParen ) {
            port.postMessage(['NOT JSON', 'no closing paren'])
            port.disconnect()
            return
          }

          var lastBit = removeComments(
            text.substring(indexOfLastParen + 1),
          ).trim()
          if (lastBit !== '' && lastBit !== ';') {
            port.postMessage([
              'NOT JSON',
              'last closing paren followed by invalid characters',
            ])
            port.disconnect()
            return
          }

          text = text.substring(indexOfParen + 1, indexOfLastParen)
          try {
            obj = JSON.parse(text)
            validJsonText = text
          } catch (e2) {
            port.postMessage([
              'NOT JSON',
              'looks like a function call, but the parameter is not valid JSON',
            ])
            return
          }

          jsonpFunctionName = firstBit
        }

        if (typeof obj !== 'object' && typeof obj !== 'array') {
          port.postMessage([
            'NOT JSON',
            'technically JSON but not an object or array',
          ])
          port.disconnect()
          return
        }

        port.postMessage(['FORMATTING'])
        port.postMessage([
          'FORMATTED', 
          jsonObjToHTML(obj, jsonpFunctionName), 
          validJsonText
        ])
        port.disconnect()
      }
    })
  })
})()
