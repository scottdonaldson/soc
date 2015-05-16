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

// ----- Templates

S.var('templates', {});

S.templates.loggedOut = {
    login: function() {
        S.dataRef.authWithOAuthPopup('google', function(error, authData) {
            if ( !error ) {
                S.logInUser(authData.google.id, authData.google.displayName);
                S.state.removeState('loggedOut').addState('loggedIn');
            }
        });
    }
};

S.templates.loggedIn = {
    logout: function() {
        S.state.removeState('loggedIn').addState('loggedOut');
        S.currentUser = null;
        S.dataRef.unauth();
    },
    listGames: function(user) {

        var _this = this;

        // remove any existing content
        this.innerHTML = '';

        if ( user.games.length === 0 ) this.innerHTML = '<div>No games yet.</div>';

        S.utils.forEach(user.games, function() {

            var div = document.createElement('div'),
                link = document.createElement('a');

            link.href = '/#/game/' + this.id;
            link.innerHTML = 'Started ' + moment(this.startedAt).format('MMMM Do, YYYY');
            link.innerHTML += ' at ';
            link.innerHTML += moment(this.startedAt).format('h:mm:ss a');

            div.appendChild(link);
            _this.appendChild(div);
        });
    },
    newGame: function() {
        var time = new Date().getTime();
        S.dataRef.child('games').push({
            startedAt: time,
            id: S.utils.randomGameId(time),
            users: [ S.currentUser.id ]
        });
    }
};

(function() {

    S = window.S || {};

    S.dataRef = new Firebase('https://settlers-oc.firebaseio.com');

    // ----- State

    S.var('state', []);

    S.state.addState = function(which) {
        if ( !S.state.hasState(which) ) {
            S.state.push(which);
        }
        S.renderTemplates(which);
        return S.state;
    };

    S.state.removeState = function(which) {
        if ( S.state.hasState(which) ) {
            S.state.forEach(function(st) {
                if ( st === which ) S.state.splice(S.state.indexOf(st), 1);
            });
        }
        S.renderTemplates(which);
        return S.state;
    };

    S.state.hasState = function(which) {
        return S.state.indexOf(which) > -1;
    };

    // ----- Event handlers and observers

    S.var('events', ['click', 'mouseover', 'mouseout']);
    S.var('observers', []);

    S.addEventHandlersToTemplates = function(templates, events) {

        S.utils.forEach(templates, function() {

            var template = this, // node
                slug = template.getAttribute('data-template'),
                context = S.templates[slug];

            events.forEach(function(ev) {

                // nodeList of elements to add handlers to
                var eventMatches = template.querySelectorAll('[data-' + ev + ']');

                S.utils.forEach(
                    eventMatches,
                    function() {

                        var func = this.getAttribute('data-' + ev);

                        // we can also call a function from the context of another template
                        if ( func.split('.').length === 2 ) {
                            context = S.templates[func.split('.')[0]];
                            func = func.split('.')[1];
                        }

                        this.addEventListener(
                            ev,
                            context[func],
                            false
                        );
                    }
                );
            });

            // anything we're supposed to be watching for changes on
            var observers = template.querySelectorAll('[data-observe]');

            S.utils.forEach(
                observers,
                function() {
                    var target = this.getAttribute('data-observe');
                    S.observers.push({
                        observer: this,
                        target: target,
                        func: context[this.getAttribute('data-do')]
                    });
                }
            );
        });
    };

    S.renderTemplates = function() {

        var slug,
            method,
            toRender = S.templates,
            templates;

        // if there are arguments, only render the templates indicated
        if ( arguments.length ) {
            S.utils.forEach(arguments, function() {
                toRender[this] = S.templates[this];
            });
        }

        for ( slug in toRender ) {

            templates = document.querySelectorAll('[data-template="' + slug + '"]');

            // show or hide
            method = S.state.hasState(slug) ? 'show' : 'hide';
            S.utils.forEach( templates, S.utils[method] );

            // add event handlers
            S.addEventHandlersToTemplates( templates, S.events );
        }
    };

    // ----- Routing

    S.var('router', {});

    S.router.init = function() {
        S.router.route();
        window.onhashchange = S.router.route;
    };

    S.router.route = function() {
        var route = location.hash.replace('#/', '');
        route = route.split('/');
        S.router.parse(route);
    };

    S.router.parse = function(route) {

        var states = {
            '': 'home',
            'game': 'game'
        },
        state;

        if ( route[0] in states ) {

            state = states[route[0]];
            console.log('adding', state);
            S.state.addState(state);

            // delete, loop through and remove
            delete states[route[0]];
            for ( state in states ) {
                S.state.removeState(state);
            }
        }
    };

    // ----- Logged in/out and
    // ----- User stuff

    S.User = function(id, name) {

        // config
        this.id = id;
        this.name = name;
        this.games = [];

        return this;
    };

    S.User.prototype.addGame = function(game) {
        var games = this.games,
            push = true;
        // don't allow duplicates
        S.utils.forEach(games, function(){
            if ( this.id === game.id ) push = false;
        });
        if ( push ) this.prop(games, games.push(game));
    };

    S.User.prototype.loadUserData = function() {

        var _this = this;

        S.dataRef.child('games').on('value', function(data) {

            var key, game;

            for ( key in data.val() ) {

                game = data.val()[key];

                if ( game.users && game.users.indexOf(_this.id) > -1 ) {

                    S.currentUser.addGame(game);
                }
            }
        });
    };

    S.checkForLogin = function(authData) {

        var toAdd, toRemove;

        if ( !authData ) {
            toAdd = 'loggedOut';
            toRemove = 'loggedIn';
        } else {
            toAdd = 'loggedIn';
            toRemove = 'loggedOut';
            S.logInUser(authData.google.id, authData.google.displayName);
        }

        S.state.addState(toAdd).removeState(toRemove);
    };

    S.logInUser = function(id, name) {
        S.dataRef.child('users/' + id).transaction(function(data) {
            if ( !data ) return { name: name };
        }, function() {
            S.var('currentUser', new S.User(id, name)).loadUserData();
        });
    };

    // ----- Games



})();

(function() {

    function init() {

        S.dataRef.onAuth(S.checkForLogin);
        S.router.init();
        S.renderTemplates();

    }

    document.addEventListener('DOMContentLoaded', init);

})();
