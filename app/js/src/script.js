(function() {

    function init() {

        S.dataRef.onAuth(S.checkForLogin);
        S.router();
        S.renderTemplates();

    }

    document.addEventListener('DOMContentLoaded', init);

})();
