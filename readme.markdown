jQuery.formJSON
===================

Apparently indentation is all fucked up at the moment, but using this should be something like

* Get the JSON object of the form: `$('.element').formJSON("get");` 
* Set the form values like this: `$('.element').formJSON("set", { field : 'value' });`

Notice that `.element` can be anything containing input elements, not necessary `form`.

Input elements can be named using dot notation or the PHP's angle brackets: `<input name="first.second" value="5" />` is equivalent to `<input name="first[second]" value="5" />`, both should return `{ first : { second : 5 } }`

Check out the tests.html for further examples and data-types and stuff. Consider all other API's with caution, they may change.