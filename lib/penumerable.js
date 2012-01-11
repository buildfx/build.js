require('./ember-metal');
require('./ember-runtime');

Ember.PEnumerable = Ember.Mixin.create({
  /**
     Similar to map, but for invoking an asynchronous operation
     on the elements of an enumerable and invoking a callback once
     all async operations and mappings have completed.

     @param operation {Function} the asyncronous function that will
     be called for each item in the enumerable.

     @param mapping {Function} the function that transforms the result
     of 'Operation' into new values. The signature should match that of
     the callback expected by 'Operation'. Addionally, the item from
     the original enumerable is passed as the last argument.

     @param then {Function} the callback that is invoked once all the
     work is done. It takes as argument the new enumerable.

     @returns {Object} the original enumerable.     
  */
  pmap: function(operation, mapping, then) {
    var ret = new Array(this.length);
    var remainingWork = this.length;
    
    this.forEach(function(x, idx, i) {
      operation.call(null, x, function() {
	var extendedArgs = Array.prototype.slice.call(arguments);
	var mappedVal;

	extendedArgs.push(x);

	mappedVal = mapping.apply(null, extendedArgs);
	ret[idx] = mappedVal;
	
	remainingWork = remainingWork - 1;
	if ((remainingWork === 0) && then) then.call(null, ret);
      });
    });

    return this;
  }
});


Ember.PEnumerable.activate = function() {
  Ember.PEnumerable.apply(Array.prototype);
}


Ember.PEnumerable.activate();
