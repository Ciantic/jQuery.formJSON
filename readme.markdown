jQuery.formJSON
###

Apparently indentation is all fucked up at the moment, but using this should be something like

`$('.element').formJSON("get");` and `$('.element').formJSON("set", { field : 'value' });

Check out the tests.html for further examples and data-types and stuff. Consider all other API's with caution, they may change.