/**
 * $.formJSON plugin
 * 
 * Set/get form element values as objects.
 **/
(function ($) {
	/**
	 * Return all matches as array. 
	 * 
	 * Checks for inifinite loops.
	 * 
	 * @param s string Subject from which matches are to be searched
	 * @param regexp regexp Remember to include "g" modifier in your regexp.
	 */
	function match_all(s, regexp) {
		var m, i = -1,
			matches = [];
		while (m = regexp.exec(s)) {
		   if (i === m.index) // Infinite loop
			   break;
		   matches.push(m);
		   i = m.index;
		}
		return matches;
	}
	
	$.formJSON = {
		"getterSetters" : {
				"int" : {
					get : function (el) { return parseInt($(el).val()); },
					set : function (el, v) { return $(el).val("" + v); }
				},
				"float" : {
					get : function (el) { return parseFloat($(el).val()); },
					set : function (el, v) { return $(el).val("" + v); }
				},
				"boolean" : {
					get : function (el) { return $(el).val() === "true" || $(el).val() === "1"; },
					set : function (el, v) { return $(el).val(v ? "true" : "false"); }
				}
			}
	};
	
	/**
	 * Get elements JSON value
	 */
	$.fn.valJSON = function (newValue) {
		var getterSetter = $(this).data('json-type');
		
		if (typeof getterSetter == "string")
			getterSetter = $.formJSON.getterSetters[getterSetter];
		
		if (!getterSetter || (!getterSetter.get || !getterSetter.set))
			return (typeof newValue == "undefined") ? 
					$(this).val() : $(this).val(newValue);
		
		return (typeof newValue == "undefined") ? 
				getterSetter.get(this) : getterSetter.set(this, newValue);
	};
	
	var rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset)$/i,
		checkableTypes = /^(?:radio|checkbox)$/i,
		radioType = /^radio$/i,
		isArrayName = /\[\]$/,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;	
	
	/**
	 * Serialize form elements as array
	 */
	$.fn.serializeArrayJSON = function() {
		var values = {},
			valuesNames = [];
		
		this.map(function() {
				// Get elements if this is a form element from the property
				var elements = $.prop(this, "elements");
				if (elements) {
				    return $.makeArray(elements);
				};
				
				// If this *is* input element, use it
				var $t = $(this);
				if ($t.is(":input")) {
				    return this;
				}
				
				// Finally try to find input elements inside
				return $.makeArray($t.find(":input"));
			})
			.filter(function() {
				return this.name && !$(this).is(":disabled") &&
					rsubmittable.test(this.nodeName) && 
					!rsubmitterTypes.test(this.type);
			})
			.each(function(i, el){
				var name = el.name.toLowerCase(),
					type = el.type,
					val = $(el).valJSON();
				
				// TODO: Get val from el.data('json').get()
				
				// Allocate array
				if (!values[name] && (isArrayName.test(name) || $.isArray(val))) {
					values[name] = [];
				}
				
				if (isArrayName.test(name) && val != null && !$.isArray(val)) {
					val = [val];					
				}

				if (checkableTypes.test(type)) {
					if (!$.isArray(val)) {
						if (radioType.test(type) && values[name])
							return;
						
						values[name] = this.checked ? val : (radioType.test(type) ? null : false);
						return;
					} else if ($.isArray(val) && !this.checked) {
						return;
					}
				}
				
				if ($.isArray(val)) {
					$.merge(values[name], val);
					return;
				}
				
				if (val == null)
					return;
				
				values[name] = val;
			});
		
		$.each(values, function (k,v) {
	    	if ($.isArray(v)) {
	    		if (!v.length)
	    			valuesNames.push({
	    				name: k,
	    				value: undefined
	    			});
	    		
	    		$.each(v, function (i, val) {
	    			valuesNames.push({
	    				name: k,
	    				value: val
	    			});
	    		});
	    		return;
	    	}
	    	valuesNames.push({
	    		name: k,
	    		value: v
	    	});
	    });
		
		return valuesNames;
	};
	
	/**
	 * 
	 */
	function FormJSON() {
		/**
		 * Get the object
		 */
		this.get = function (el) {
		    var values = el.serializeArrayJSON();
		    			
			// Contents of this function below is modified from
			// Paul Macek's (MIT Licensed) jQuery-to-json repository see:
			// https://github.com/macek/jquery-to-json
			var json = {},
		        push_counters = {},
		        patterns = {
		            "key":      /[^\[\]\.]+|\[\]/g,
		            "push":     /^\[\]$/,
		            "fixed":    /^\d+$/,
		            "named":    /^[^\[\]\.]+$/
		        },
		        build = function(base, key, value){
			        base[key] = value;
			        return base;
			    },
			    push_counter = function(key){
			        if(push_counters[key] === undefined){
			            push_counters[key] = 0;
			        }
			        return push_counters[key]++;
			    };
			
		    $.each(values, function() {
		        var m, k,
		            matches = match_all(this.name, patterns.key),
		            merge = this.value;
	
	        	while (m = matches.pop()) {
		        	k = m[0];
		            
		            // push
		            if (k.match(patterns.push)) {
		                merge = build([], push_counter(this.name.substr(0, m.index)), merge);
		            
		            // fixed
		            } else if(k.match(patterns.fixed)) {
		            	merge = build([], k, merge);
		                
		            // named
		            } else if(k.match(patterns.named)){
		                merge = build({}, k, merge);
		            }
		        }
	
		        jQuery.extend(true, json, merge);
		    });
		    
		    return json;
		};
		
		/**
		 * Set
		 */
		this.set = function (el, values) {
			var valuesNames = [],
				inputs = el.find("input,textarea,select"),
				inputsByName = {},
				hit,
				setter = function (prefix, o, isObject, isArray) {
					$.each(o, function (k,v) {
						var kk = k;
						if (isObject)
							kk = "." + k;
						else if (isArray)
							kk = "[" + k + "]";
						
						var fk = prefix + kk;
						
						if ($.isPlainObject(v)) {
							setter(fk, v, true);
							return;
						} else if ($.isArray(v)) {
							// Checkboxes/Selects ending []
							if (inputsByName[fk + "[]"]) {								
								valuesNames.push({
									name: fk + "[]",
									value: v
								});
								return;
							}
							setter(fk, v, false, true);
							return;
						} 
						
						valuesNames.push({
							name: fk,
							value: v
						});
					});
				};
			
			// Create map of inputs (Converts names to dot notation format)
			var counter = {};
			$.each(inputs, function () {
				if (!$(this).attr('name'))
					return;
				
				var parts = $.map($(this).attr('name').split("[]"), function (s) { 
						return s
							.replace(/\[(.+?)\]/gi, ".$1")
							.replace(/\.(\d+)([\[\.])/, "[$1]$2")
							.replace(/\.(\d+)$/, "[$1]"); 
					}),
					n = parts.join("[]"),
					empties = parts.slice(0, -1);
				
				
				// If the element is checkbox or select, then [] has a special
				// meaning and it should not be converted to number.
				if (n.substr(-2) == "[]" && $(this).is("select,[type=checkbox]")) {
					empties = empties.slice(0, -1);
				}
				
				// Convert [] -> [0],[1],...
				if (empties.length > 0) {
					n = "";
					var prefix = "";
					$.each(empties, function () {
						prefix += this + "[]";
						if (typeof counter[prefix] == "undefined")
							counter[prefix] = 0;
						else
							counter[prefix]++;
						
						n += this + "[" + counter[prefix] + "]";
					});
				}
				
				if (!inputsByName[n])
					inputsByName[n] = [];
				
				inputsByName[n].push(this);
			});
			
			
			setter("", values);
			$.each(valuesNames, function () {
				var n = this.name,
					v = this.value;
				
				if (!(hit = $(inputsByName[n])))
					return;
				
				switch (hit.attr('type')) {
					case "checkbox":
					case "radio":
						if ($.isArray(v)) {
							hit.valJSON(v).change();
							return;
						}
						
						if (v === false || v === null) {
							hit.prop('checked', false).change();
							return;
						} else {
	                        hit = hit.filter(function (i, el) {
	                            return $(el).val() == v;
	                        });
	                        
							hit.prop('checked', true).change();
							return;
						}
						return;
				}
				var a = hit.valJSON(v);
				if (a && a.change)
					a.change();			
			});

		};

		/**
		 * Set defaults
		 */
		this.setDefaults = function (el, values) {
			
		};
		
		/**
		 * Reset the form (with new default values)
		 * 
		 * @param el Element
		 * @param values object New values (optional)
		 */
		this.reset = function (el, values) {
		    var rawel = el.get(0);
		    if (rawel.reset) {
		        rawel.reset();
		    }
			if (typeof values != "undefined") {
				this.setDefaults(el, values);
			}
		};
		
	}
	
	$.fn.formJSON = function (act, value) {
		// Initialize if not initialized
		var self = this,
			formJSON;

		// Persist the value in data
		if (!(formJSON = this.data("formJSON"))) {
			this.data("formJSON", formJSON = new FormJSON());
		}
		
		// Get the form values
		if (act === "get") {
			return formJSON.get(self);
			
		// Set the form values (and trigger changed)
		} else if (act === "set") {
			formJSON.set(self, value);
			
		// Set the form values (without triggering changed)
		} else if (act === "setDefaults") {
			formJSON.setDefaults(self, value);
			
		// Reset the form values (without triggering changed)
		} else if (act === "reset") {
			formJSON.reset(self, value);
					
		// Remove the formObject
		} else if (act === "destroy") {
			el.removeData("formJSON");
		}
		
		return self;
	};
})(jQuery);