(function() {

    window.S = {};

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
                console.log("Authenticated successfully with payload:", authData);
                S.state.removeState('loggedOut').addState('loggedIn');
              } else {
                  console.log("Login Failed!", error);
              }
            });
        }
    };

    S.templates.loggedIn = {
        logout: function() {
            S.state.removeState('loggedIn').addState('loggedOut');
            S.dataRef.unauth();
        }
    };

    // ----- Event handlers

    S.events = ['click', 'mouseover', 'mouseout'];

    S.addEventHandlersToTemplates = function(templates, events) {

        S.utils.forEach(templates, function() {

            var template = this, // node
                slug = template.getAttribute('data-template');

            events.forEach(function(ev) {

                // nodeList of elements to add handlers to
                var eventMatches = template.querySelectorAll('[data-' + ev + ']');

                S.utils.forEach(
                    eventMatches,
                    function() {
                        this.addEventListener(
                            ev,
                            S.templates[slug][this.getAttribute('data-' + ev)],
                            false
                        );
                    }
                );
            });
        });
    };

    S.renderTemplates = function() {

        var slug,
            method,
            toRender = {},
            templates;

        if ( arguments.length ) {
            S.utils.forEach(arguments, function() {
                toRender[this] = S.templates[this];
            });
        } else {
            toRender = S.templates;
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

    // ----- Logged in/out

    S.checkForLogin = function(authData) {
        if ( authData ) {
            S.state.addState('loggedIn');
            S.state.removeState('loggedOut');
        } else {
            S.state.addState('loggedOut');
            S.state.removeState('loggedIn');
        }
    };

})();
