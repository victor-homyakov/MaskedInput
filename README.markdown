Prototype MaskedInput
=============

A quick port of the jQuery Masked Input Plugin to Prototype.
The plugin breaks the native change event in the browser. It won't fire unless event.simulate.js is available.

Requires: Prototype >= 1.6.1
Optional: event.simulate.js from http://github.com/kangax/protolicious to trigger native change event.
Tested on:
    Windows - IE6, IE7, IE8, IE9pre, Opera 9.6, Chrome 10, Firefox 3.6, Safari 5;
    Linux - Opera 10, Chrome 11 beta, Firefox 3.5.

### Example code

    $$('input').mask('99.99.9999');

    <input id="test" type="text" size="10" />
    <input id="test2" type="text" size="10" />

Or

    $('test').mask('99.99.9999');

Placeholder character can be changed and an event can be called when the mask is completed

    function finished() { alert(this); }
    $('test').mask('99.99.9999', {placeholder: '+', completed: finished});

If you need to unmask an element, use the unmask method

    var element = $('test').mask('99.99.9999');
    ...
    element.unmask().mask('99.99.99');

The mask definitions can be changed (only uppercase allowed)

    Element.mask.definitions['a'] = '[A-Z]';

Or new ones can be added (only 0 and 1 allowed)

    Element.mask.definitions['b'] = '[0-1]'
    Element.mask('test', 'aaa.bb.9999');

Find the original jQuery code including supported masks at http://digitalbush.com/projects/masked-input-plugin/
