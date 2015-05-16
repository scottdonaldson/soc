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
        S.state.prop();
        return S.state;
    };

    S.state.removeState = function(which) {
        if ( S.state.hasState(which) ) {
            S.state.forEach(function(st) {
                if ( st === which ) S.state.splice(S.state.indexOf(st), 1);
            });
        }
        S.renderTemplates(which);
        S.state.prop();
        return S.state;
    };

    S.state.hasState = function(which) {
        return S.state.indexOf(which) > -1;
    };

    // ----- Event handlers and observers

    S.var('events', ['click', 'mouseover', 'mouseout']);
    S.var('observers', []);

    // add an observer to the list of observers
    S.observers.add = function(observer) {
        if ( S.observers.indexOf(observer) === -1 ) S.observers.push(observer);

        var target = S[observer.target];
        if ( target && target._observers.indexOf(observer) === -1 ) {
            target._observers.push(observer);
        }
    };

    // create a new observer.
    // `target` must be a string that will listen for changes to S[target]
    S.Observer = function(node, target, cb) {
        this.observer = node;
        this.target = target;
        this.func = cb;

        return this;
    };

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

                    var observer = this,
                        target = this.getAttribute('data-observe'),
                        func = context[this.getAttribute('data-do')];

                    var observerObj = new S.Observer(observer, target, func);

                    S.observers.add(observerObj);
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

    // ----- State Observer

    S.StateObserver = new S.Observer(null, 'state', function() {
        console.log('state changed');
        S.utils.forEach(S.StateObserver.stateFunctions, function() {
            console.log('performing state function')
            this();
        });
    });
    S.StateObserver.stateFunctions = [];
    S.observers.add(S.StateObserver);

    // ----- Games

    /* function gameState() {
        if ( S.state.hasState('game') ) {
            console.log('game time')
        }
    }

    S.StateObserver.stateFunctions.push(gameState); */

})();
