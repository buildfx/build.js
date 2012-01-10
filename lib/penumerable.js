require('./ember-metal');
require('./ember-runtime');

// exports.Pump = Em.Object.extend({

//   /** Properties **/
//   threshold: 0,

//   /* A queue of items on which 'action' will be performed */
//   queue: [],


//   action: null,
//   transform: null,

//   after: null,

//   thresholdReached: Ember.computed(function() {
//     return this.getPath('queue.length') >= this.get('threshold');
//   }).property('queue.length', 'threshold'),
    

//   queueSizeDidChange: Ember.observer(function() {
//     var s;
//     var after = this.get('after');
//     var thresholdReached = this.get('thresholdReached');
    
//     if (after && thresholdReached) {
//       after();
//     }

//   }, '*queue.length'),


//   /** Methods **/
//   start: function() {
//     var q = this.get('queue');
//     var action = this.get('queueAction');
//   }
// });


Ember.PEnumerable = Ember.Mixin.create({
  /**
     Similar to map, but for invoking an asynchronous operation
     on the elements of an enumerable.

     pmap ensures that the indexes of the mapped values correspond
     to those of the original values;
     
     Operation is a function that takes as first argument the
     enumerated element and as a second argument a callback function
     with the same signature as that provided by Mapping.

     Mapping is the callback function that will be called by Operation.
  */
  pmap: function(operation, mapping, then, target) {
    var ret = new Array(this.length);
    var remainingWork = this.length;
    
    this.forEach(function(x, idx, i) {
      operation.call(target, x, function() {
	var extendedArgs = arguments;
	var mappedVal;
	mappedVal = mapping.apply(target, extendedArgs);
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