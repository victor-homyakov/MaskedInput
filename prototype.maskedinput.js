/*global $, $$, $A, Class, Element, Event, Prototype */
/*
 Masked Input plugin for prototype ported from jQuery
 Bjarte K. Vebjørnsen <bjartekv at gmail dot com>
 Victor Homyakov <vkhomyackov at gmail dot com>
 Note that the onchange event for masked inputs won't fire unless event.simulate.js is available.
 Requires: Prototype >= 1.6.1
 Optional: event.simulate.js from http://github.com/kangax/protolicious to trigger native change event.
 Tested on:
 Windows - IE6-9, Firefox 3.6, Opera 9.64, Chrome 10, Safari 5;
 Linux - Opera 10, Chrome 11-17, Firefox 3.5-10.
 Masked Input plugin for jQuery
 Copyright (c) 2007-2011 Josh Bush (digitalbush.com)
 Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
 Version: 1.3
 */
(function() {
  if (typeof(window.Prototype) == "undefined") {
    throw "Masked Input requires Prototype 1.6.1 or above to be loaded.";
  }

  var pasteEventName = (Prototype.Browser.IE ? 'paste' : 'input'), iPhone = !!window.orientation, storageKey = "mask_data";

  /**
   * Helper Function for Caret positioning.
   * @param {Element} element
   * @param {Number} begin
   * @param {Number} end (optional, by default end = begin)
   */
  function caret(element, begin, end) {
    element = $(element);
    var range;
    if (typeof begin == 'number') {
      end = (typeof end == 'number') ? end : begin;
      if (element.setSelectionRange) {
        try {
          element.focus();
          element.setSelectionRange(begin, end);
        } catch (e) {
          // ignore
          //console.warn(e);
        }
      } else if (element.createTextRange) {
        range = element.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', begin);
        range.select();
      }
    } else {
      if (element.setSelectionRange) {
        begin = element.selectionStart;
        end = element.selectionEnd;
      } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        begin = 0 - range.duplicate().moveStart('character', -100000);
        end = begin + range.text.length;
      }
    }
    return {
      begin: begin,
      end: end
    };
  }


  /**
   * Remove mask from element.
   * @param {Element} element
   */
  function unmask(element) {
    element = $(element);
    element.fire("mask:unmask");
    return element;
  }


  function getMask(element) {
    element = $(element);
    var mi = element.retrieve(storageKey);
    if (mi) {
      // FIXME call here checkVal() to update buffer!!!
      return $A(mi.buffer).map(function(c, i) {
        //return tests[i] ? c : null;
        return mi.tests[i] && c != mi.settings.placeholder ? c : null;
      }).join('');
    }
  }


  function fireChangeEvent(element) {
    var oEvent;
    if (document.createEvent /* && document.dispatchEvent */) {
      oEvent = document.createEvent('HTMLEvents');
      oEvent.initEvent('change', true, true);
      element.dispatchEvent(oEvent);
    } else if (document.createEventObject /* && document.fireEvent */) {
      oEvent = Object.extend(document.createEventObject(), {
        //button: 0,
        //ctrlKey: false, altKey: false, shiftKey: false, metaKey: false,
        //keyCode: 0, charCode: 0,
        bubbles: true,
        cancelable: true,
        //detail: 0,
        //pointerX: 0, pointerY: 0, screenX: 0, screenY: 0, clientX: 0, clientY: 0,
        relatedTarget: element
      });
      element.fireEvent('onchange', oEvent);
    }
  }

  function simulateChangeEvent(element) {
    // since the native change event doesn't fire we have to fire it ourselves
    // since Event.fire doesn't support native events we're using Event.simulate if available
    if (element.simulate) {
      element.simulate('change');
    }
  }


  var moveCaretTimer = -1;

  function setMask(element, mask, settings) {
    if (!mask) {
      return getMask(element);
    }

    element = $(element);
    settings = Object.extend({
      placeholder: "_",
      completed: null
    }, settings || {});

    var tests = [], defs = setMask.definitions, firstNonMaskPos = null, partialPosition = mask.length;

    mask.split("").each(function(c, i) {
      if (c == '?') {
        partialPosition = i;
      } else if (defs[c]) {
        tests.push(new RegExp(defs[c]));
        if (firstNonMaskPos === null) {
          firstNonMaskPos = tests.length - 1;
        }
      } else {
        tests.push(null);
      }
    });

    unmask(element);

    (function(element) {
      var input = element, focusText = input.getValue(), vkKeyCode;
      // var ignore = false; // Variable for ignoring control keys
      var buffer = mask.replace(/\?/g, '').split('').map(function(c, i) {
        //if (c != '?') {
        return defs[c] ? settings.placeholder : c;
        //}
      });
      // TODO .split('').map() -> replace(..., fn(){}).split('') ?

      input.store(storageKey, {
        buffer: buffer,
        tests: tests,
        settings: settings
      });

      function seekNext(pos) {
        var len = tests.length;
        while (++pos < len && !tests[pos]) {
        }
        return pos;
      }

      function seekPrev(pos) {
        while (--pos >= 0 && !tests[pos]) {
        }
        return pos;
      }

      function clearBuffer(start, end) {
        for (var i = start, len = tests.length; i < end && i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
          }
        }
      }

      function writeBuffer() {
        input.setValue(buffer.join(''));
      }

      function checkVal(allow) {
        // try to place characters where they belong
        var test = input.getValue(), lastMatch = -1, c;
        for (var i = 0, pos = 0, len = tests.length; i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
            while (pos++ < test.length) {
              c = test.charAt(pos - 1);
              if (tests[i].test(c)) {
                buffer[i] = c;
                lastMatch = i;
                break;
              }
            }
            if (pos > test.length) {
              break;
            }
          } else if (buffer[i] == test.charAt(pos) && i != partialPosition) {
            pos++;
            lastMatch = i;
          }
        }

        if (allow) {
          writeBuffer();
        } else if (lastMatch + 1 < partialPosition) {
          input.setValue('');
          clearBuffer(0, len);
        } else {
          input.setValue(buffer.join('').substring(0, lastMatch + 1));
        }

        return (partialPosition ? i : firstNonMaskPos);
      }

      function shiftL(begin, end) {
        if (begin < 0) {
          return;
        }
        for (var i = begin, j = seekNext(end), len = tests.length; i < len; i++) {
          if (tests[i]) {
            if (j < len && tests[i].test(buffer[j])) {
              buffer[i] = buffer[j];
              buffer[j] = settings.placeholder;
            } else {
              break;
            }
            j = seekNext(j);
          }
        }
        writeBuffer();
        caret(input, Math.max(firstNonMaskPos, begin));
      }

      function shiftR(pos) {
        for (var i = pos, len = tests.length, c = settings.placeholder; i < len; i++) {
          if (tests[i]) {
            var j = seekNext(i), t = buffer[i];
            buffer[i] = c;
            if (j < len && tests[j].test(t)) {
              c = t;
            } else {
              break;
            }
          }
        }
      }

      function keydownEvent(e) {
        e = e || window.event;
        var k = e.keyCode;
        vkKeyCode = k;
        //ignore = (k < 16 || (k > 16 && k < 32) || (k > 32 && k < 41));
        // backspace, delete, and escape get special treatment
        if (k == Event.KEY_BACKSPACE || k == 46 || (iPhone && k == 127)) { // backspace/delete
          var pos = caret(input), begin = pos.begin, end = pos.end;
          if (end - begin === 0) {
            if (k == 46) {
              begin = seekNext(begin - 1);
              end = seekNext(begin);
            } else {
              begin = seekPrev(begin);
            }
          }
          clearBuffer(begin, end);
          shiftL(begin, end - 1);
          Event.stop(e);
        } else if (k == Event.KEY_ESC) { // escape
          input.setValue(focusText);
          caret(input, 0, checkVal());
          Event.stop(e);
        }
      }

      /**
       * Handler for keypress event.
       * IE 6-8: typeable keys only, charCode===undefined
       * Opera 9-10: all keys, charCode===undefined
       * WebKit: typeable keys only, keyCode===charCode
       * FF 3.X: all keys, charCode===0 for non-typeable, keyCode===0 for typeable
       * @param {Event} e
       */
      function keypressEvent(e) {
        /*if (ignore) {
         ignore = false;
         //Fixes Mac FF bug on backspace
         return (e.keyCode == 8) ? false : null;
         }*/
        e = e || window.event;
        var k = e.charCode || e.keyCode;
        // e.charCode === 0 for non-character keys in Firefox
        if (e.ctrlKey || e.altKey || e.metaKey || e.charCode === 0 /*k < 32*/) { // ignore
        } else if (Prototype.Browser.Opera && vkKeyCode < 48 && vkKeyCode !== 32 /*k == 8*/) {
          // non-character keys in Opera
          if (k == Event.KEY_BACKSPACE || k == 46) { // backspace/delete was processed in keydownEvent
            Event.stop(e);
          }
        } else if (k >= 32) {
          //} else if (k) {
          //} else if ((k >= 32 && k <= 125) || k > 186) // typeable characters
          var pos = caret(input), begin = pos.begin, end = pos.end;
          if (end - begin !== 0) {
            clearBuffer(begin, end);
            shiftL(begin, end - 1);
          }

          var p = seekNext(begin - 1), c, next, len = tests.length;
          if (p < len) {
            c = String.fromCharCode(k);
            if (tests[p].test(c)) {
              shiftR(p);
              buffer[p] = c;
              writeBuffer();
              next = seekNext(p);
              caret(input, next);
              if (settings.completed && next >= len) {
                settings.completed.call(input);
              }
            }
          }
          Event.stop(e);
        }
      }

      function blurEvent() {
        checkVal();
        if (input.getValue() != focusText) {
          simulateChangeEvent(input);
        }
      }

      function focusEvent() {
        focusText = input.getValue();
        var pos = checkVal();
        writeBuffer();

        var moveCaret = function() {
          caret(input, pos == mask.length ? 0 : pos, pos);
        };
        if (Prototype.Browser.IE) {
          moveCaret();
        } else {
          clearTimeout(moveCaretTimer);
          moveCaretTimer = setTimeout(moveCaret, 0);
        }
      }

      function maskShowEvent() {
        focusEvent();
      }

      function pasteEvent() {
        setTimeout(function() {
          caret(input, checkVal(true));
        }, 0);
      }

      if (!input.readAttribute("readonly")) {
        input.observe("mask:unmask", function() {
          input.store(storageKey, undefined).stopObserving("mask:unmask").stopObserving("mask:show").stopObserving("focus", focusEvent).stopObserving("blur", blurEvent).stopObserving("keydown", keydownEvent).stopObserving("keypress", keypressEvent).stopObserving(pasteEventName, pasteEvent);
        }).observe("mask:show", maskShowEvent).observe("focus", focusEvent).observe("blur", blurEvent).observe("keydown", keydownEvent).observe("keypress", keypressEvent).observe(pasteEventName, pasteEvent);
      }

      checkVal(); // Perform initial check for existing values
    })(element);
    return element;
  }


  Element.addMethods({
    caret: caret,
    mask: setMask,
    unmask: unmask
  });


  // Predefined character definitions
  setMask.definitions = {
    '9': "[0-9]",
    'a': "[A-Za-z]",
    '*': "[A-Za-z0-9\u0410-\u044F]"
  };
  setMask.storageKey = storageKey;
})();

// element.fire("mask:show"); element.fire("mask:unmask");
