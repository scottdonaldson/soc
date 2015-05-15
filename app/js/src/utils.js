S.utils = {};

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
