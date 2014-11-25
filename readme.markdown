jQuery.formJSON
===================

Apparently indentation is all fucked up at the moment, but using this should be something like

* Get the JSON object of the form: `$('.element').formJSON("get");` 
* Set the form values like this: `$('.element').formJSON("set", { field : 'value' });`

Notice that `.element` can be anything containing input elements, not necessary `form`.

Check out the tests.html for further examples and data-types and stuff. Consider all other API's with caution, they may change.