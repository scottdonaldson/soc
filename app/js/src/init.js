(function() {

    // create a variable on the S object
    S = function(name, value) {

        S[name] = value;

        // will keep observers on this object
        value._observers = [];

        // loop through observers, update them with this object
        S.utils.forEach(S.observers, function(){
            if ( name === this.target ) this.func.call(this.observer, value);

            // add observers to this object
            value._observers.push(this);
        });
    };

    // prototype for S-created objects
    S.Core = function() { };

    S.Core.prototype.prop = function(k, v) {
        this[k] = v;
        var _this = this;
        // publish changes
        this._observers.forEach(function(ob) {
            ob.func.call(ob.observer, _this);
        });
    };

    S.dataRef = new Firebase('https://settlers-oc.firebaseio.com');

    // ----- State

    S.state = [];

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

    // ----- Templates

    S.templates = {};

    S.templates.loggedOut = {
        login: function() {
            S.dataRef.authWithOAuthPopup("google", function(error, authData) {
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
            S.dataRef.unauth();
        },
        listGames: function(user) {

            var _this = this;

            // remove any existing content
            // while ( this.firstChild ) { console.log(this.firstChild); }
            this.innerHTML = '';

            S.utils.forEach(user.games, function() {
                var div = document.createElement('div');
                div.innerHTML += this.id;
                _this.appendChild(div);
            });
        },
        addGame: function() {
            S.dataRef.child('games').push({
                startedAt: new Date().getTime(),
                id: Math.round(Math.random() * 1000000),
                users: [ S.currentUser.id ]
            });
        }
    };

    // ----- Event handlers

    S.events = ['click', 'mouseover', 'mouseout'];

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
            S.observers = [];

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

    // ----- Logged in/out and
    // ----- User stuff

    S.User = function(id, name) {

        // config
        this.id = id;
        this.name = name;
        this.games = [];

        return this;
    };

    S.User.prototype = new S.Core();

    S.User.prototype.addGame = function(game) {
        var games = this.games,
            push = true;
        S.utils.forEach(games, function(){
            if ( this.id === game.id ) push = false;
        });
        if ( push ) this.prop(games, games.push(game));
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
            var currentUser = new S.User(id, name);
            S('currentUser', currentUser);
            S.currentUser.loadUserData();
        });
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

})();
