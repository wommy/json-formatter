;(function () {
  'use strict'
  var jfContent, pre, jfStyleEl, slowAnalysisTimeout
  const port = chrome.extension.connect({ name: 'jf' })
  port.onMessage.addListener(function (msg) {
    switch (msg[0]) {
      case 'NOT JSON':
        pre.hidden = false
        document.body.removeChild(jfContent)
        break
      case 'FORMATTING':
        try {
          let meta = document.querySelector('meta[name="color-scheme"]')
          if (!meta) {
            meta = document.createElement('meta')
            meta.setAttribute('name', 'color-scheme')
            document.head.appendChild(meta)
          }
          meta.setAttribute('content', 'only light')
        } catch (error) {
          console.warn('Failed to force light color scheme', error)
        }
        jfStyleEl = document.createElement('style')
        jfStyleEl.id = 'jfStyleEl'
        document.head.appendChild(jfStyleEl)
        jfStyleEl.insertAdjacentHTML(
          'beforeend',
          'body{-webkit-user-select:text;overflow-y:scroll !important;margin:0;position:relative}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px}#buttonFormatted,#buttonPlain{-webkit-border-radius:2px;-webkit-box-shadow:0px 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0px;min-width:4em;padding:3px 0;position:relative;z-index:10;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#buttonFormatted{margin-left:0;border-top-left-radius:0;border-bottom-left-radius:0}#buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}#buttonFormatted:hover,#buttonPlain:hover{-webkit-box-shadow:0px 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);border-color:#999;color:#222}#buttonFormatted:active,#buttonPlain:active{-webkit-box-shadow:inset 0px 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);color:#333}#buttonFormatted.selected,#buttonPlain.selected{-webkit-box-shadow:inset 0px 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);color:#333}#buttonFormatted:focus,#buttonPlain:focus{outline:0}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:#000;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}pre{padding:36px 5px 5px 5px}.kvov{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ell:after{content:"…";font-weight:bold}.collapsed>.ell{margin:0 4px;color:#888}.collapsed .kvov{display:inline}.e{width:20px;height:18px;display:block;position:absolute;left:-2px;top:1px;z-index:5;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD1JREFUeNpiYGBgOADE%2F3Hgw0DM4IRHgSsDFOzFInmMAQnY49ONzZRjDFiADT7dMLALiE8y4AGW6LoBAgwAuIkf%2F%2FB7O9sAAAAASUVORK5CYII%3D");background-repeat:no-repeat;background-position:center center;display:block;opacity:0.15}.collapsed>.e{-webkit-transform:rotate(-90deg);width:18px;height:20px;left:0px;top:0px}.e:hover{opacity:0.35}.e:active{opacity:0.5}.collapsed .kvov .e{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0B7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1A01CC}.k{color:#000}#formattingMsg{font:13px "Lucida Grande","Segoe UI","Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg>svg{margin:0 7px;position:relative;top:1px}[hidden]{display:none !important}span{white-space:pre-wrap}@-webkit-keyframes spin{from{-webkit-transform:rotate(0deg)}to{-webkit-transform:rotate(360deg)}}#spinner{-webkit-animation:spin 2s 0 infinite}*{-webkit-font-smoothing:antialiased}',
        )
        jfContent.innerHTML =
          '<p id="formattingMsg"><svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1"><path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path></svg> Formatting...</p>'
        var formattingMsg = document.getElementById('formattingMsg')
        formattingMsg.hidden = true
        setTimeout(function () {
          formattingMsg.hidden = false
        }, 250)
        var optionBar = document.createElement('div')
        optionBar.id = 'optionBar'
        var buttonPlain = document.createElement('button'),
          buttonFormatted = document.createElement('button')
        buttonPlain.id = 'buttonPlain'
        buttonPlain.innerText = 'Raw'
        buttonFormatted.id = 'buttonFormatted'
        buttonFormatted.innerText = 'Parsed'
        buttonFormatted.classList.add('selected')
        var plainOn = false
        buttonPlain.addEventListener(
          'click',
          function () {
            if (!plainOn) {
              plainOn = true
              pre.hidden = false
              jfContent.hidden = true
              buttonFormatted.classList.remove('selected')
              buttonPlain.classList.add('selected')
            }
          },
          false,
        )
        buttonFormatted.addEventListener(
          'click',
          function () {
            if (plainOn) {
              plainOn = false
              pre.hidden = true
              jfContent.hidden = false
              buttonFormatted.classList.add('selected')
              buttonPlain.classList.remove('selected')
            }
          },
          false,
        )
        optionBar.appendChild(buttonPlain)
        optionBar.appendChild(buttonFormatted)
        document.addEventListener('click', generalClick, false)
        document.body.insertBefore(optionBar, pre)
        break
      case 'FORMATTED':
        jfContent.innerHTML = msg[1]
        setTimeout(function () {
          var script = document.createElement('script')
          script.innerHTML = 'window.json = ' + msg[2] + ';'
          document.head.appendChild(script)
          console.log('JSON Formatter: Type "json" to inspect.')
        }, 100)
        break
      default:
        throw new Error('Message not understood: ' + msg[0])
    }
  })
  function ready() {
    var bodyChildren = document.body.childNodes
    pre = bodyChildren[0]
    var jsonLength = ((pre && pre.innerText) || '').length
    if (
      bodyChildren.length !== 1 ||
      pre.tagName !== 'PRE' ||
      jsonLength > 3000000
    ) {
      port.disconnect()
    } else {
      pre.hidden = true
      slowAnalysisTimeout = setTimeout(function () {
        pre.hidden = false
      }, 1000)
      jfContent = document.createElement('div')
      jfContent.id = 'jfContent'
      document.body.appendChild(jfContent)
      port.postMessage({
        type: 'SENDING TEXT',
        text: pre.innerText,
        length: jsonLength,
      })
    }
    document.addEventListener('keyup', function (e) {
      if (e.keyCode === 37 && typeof buttonPlain !== 'undefined') {
        buttonPlain.click()
      } else if (e.keyCode === 39 && typeof buttonFormatted !== 'undefined') {
        buttonFormatted.click()
      }
    })
  }
  document.addEventListener('DOMContentLoaded', ready, false)
  var lastKvovIdGiven = 0
  function collapse(elements) {
    var el, i, blockInner, count
    for (i = elements.length - 1; i >= 0; i--) {
      el = elements[i]
      el.classList.add('collapsed')
      if (!el.id) {
        el.id = 'kvov' + ++lastKvovIdGiven
        blockInner = el.firstElementChild
        while (blockInner && !blockInner.classList.contains('blockInner')) {
          blockInner = blockInner.nextElementSibling
        }
        if (!blockInner) continue
        count = blockInner.children.length
        var comment = count + (count === 1 ? ' item' : ' items')
        jfStyleEl.insertAdjacentHTML(
          'beforeend',
          '\n#kvov' +
            lastKvovIdGiven +
            '.collapsed:after{color: #aaa; content:" // ' +
            comment +
            '"}',
        )
      }
    }
  }
  function expand(elements) {
    for (var i = elements.length - 1; i >= 0; i--)
      elements[i].classList.remove('collapsed')
  }

  let modKey
  if (navigator.platform.indexOf('Mac') !== -1) modKey = ev => ev.metaKey
  else modKey = ev => ev.metaKey

  function generalClick(ev) {
    if (ev.which === 1) {
      var elem = ev.target
      if (elem.className === 'e') {
        ev.preventDefault()
        var parent = elem.parentNode,
          div = jfContent,
          prevBodyHeight = document.body.offsetHeight,
          scrollTop = document.body.scrollTop,
          parentSiblings
        if (parent.classList.contains('collapsed')) {
          if (modKey(ev)) expand(parent.parentNode.children)
          else expand([parent])
        } else {
          if (modKey(ev)) collapse(parent.parentNode.children)
          else collapse([parent])
        }
        div.style.marginBottom = 0
        if (document.body.offsetHeight < window.innerHeight) {
          return
        }
        if (document.body.scrollTop === scrollTop) {
          return
        }
        var difference = scrollTop - document.body.scrollTop + 8
        div.style.marginBottom = difference + 'px'
        document.body.scrollTop = scrollTop
        return
      }
    }
  }
})()
