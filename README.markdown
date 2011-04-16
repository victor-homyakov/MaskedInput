MaskedInput Prototype
=============

A port of the jQuery Masked Input Plugin 1.3 to Prototype.
The plugin breaks the native change event in the browser. It won't fire unless event.simulate.js is available.

Requires: Prototype >= 1.6.1
Optional: event.simulate.js from http://github.com/kangax/protolicious to trigger native change event.
Tested on:
    Windows - IE6, IE7, IE8, IE9pre, Opera 9.6, Chrome 10, Firefox 3.6, Safari 5;
    Linux - Opera 10, Chrome 11 beta, Firefox 3.5.

### Example code

    <input id="test" type="text" size="10" />
    <input id="test2" type="text" size="10" />

    $$("input").invoke("mask", "99.99.9999");
    // or
    // $("test", "test2").each(function (e) {e.mask("99.99.9999");});

Placeholder character can be changed and an event can be called when the mask is completed

    function finished() {
      // note 'this' points to input element
      alert("Completed " + this.inspect() + " with value " + $F(this));
    }
    $("test").mask("99.99.9999", {placeholder: "+", completed: finished});

If you need to unmask an element, use the unmask method :)

    // apply mask
    var element = $('test').mask('99.99.9999');
    ...
    // change mask - useless example
    // because unmask() is called internally from mask() anyway
    element.unmask().mask('99.99.99');
    ...
    // unmask all inputs
    $$("input").invoke("unmask");

The mask definitions can be changed

    Element.mask.definitions['a'] = '[A-Z]';

Or new ones can be added

    <input id="time1" type="text" class="time" size="5" />
    <input id="time2" type="text" class="time" size="5" />

    // 1st digit of hours in 24-hours format
    Element.mask.definitions['H'] = '[012]';
    // 1st digit of minutes
    Element.mask.definitions['M'] = '[0-5]';
    // mask all time input fields
    $$(".time").invoke("mask", "H9:M9");

Find the original jQuery code including supported masks at http://digitalbush.com/projects/masked-input-plugin/
