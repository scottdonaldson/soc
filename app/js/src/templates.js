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
