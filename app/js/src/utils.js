(function(){

S = window.S || {};

// ----- Important: create a variable on the S object

S.var = function(name, value) {

    S[name] = value;

    // for variable created with .var(),
    // we'll keep track of observers and notify them with .prop()
    S[name]._observers = [];

    // notify observers when changes are made
    S[name].prop = S.utils.prop;

    // loop through observers, update them with this object
    S.utils.forEach(S.observers, function(){
        if ( name === this.target ) this.func.call(this.observer, value);

        // add observers to this object
        value._observers.push(this);
    });

    return value;
};

// ----- Utility functions

S.utils = {};

S.utils.prop = function(k, v) {
    this[k] = v;
    // publish changes
    this._observers.forEach(function(ob) {
        ob.func.call(ob.observer, this);
    }, this);
};

S.utils.show = function(el) {
    this.style.display = 'block';
};

S.utils.hide = function(el) {
    this.style.display = 'none';
};

S.utils.forEach = function(array, callback) {
    if ( array && callback ) {
        for ( var i = 0; i < array.length; i++ ) {
            callback.call(array[i], i);
        }
    }
};

S.utils.closest = function(el, selector) {
    var parent;
    while ( el !== null ) {
        parent = el.parentNode;
        if ( parent.matches(selector) ) {
            return parent;
        }
        el = parent;
    }
    return null;
};

// return a random character from a string or random element from array
S.utils.randFrom = function(q) {
    return q[Math.floor( Math.random() * q.length )];
};

S.utils.randomGameId = function(time) {
    var randomChars = 'abcdefghijklmnopqrstuvwxyz1234567890',
        timeStamp = time ? time : new Date().getTime().toString(),
        randomString = '',
        i = 0,
        output;

    while ( i < 10 ) {
        randomString += S.utils.randFrom(randomChars);
        i++;
    }

    output = timeStamp + '_' + randomString;
    return output;
};

})();
