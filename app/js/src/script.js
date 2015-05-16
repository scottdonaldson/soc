(function() {

    function init() {

        S.dataRef.onAuth(S.checkForLogin);
        S.router.init();
        S.renderTemplates();

    }

    document.addEventListener('DOMContentLoaded', init);

})();
