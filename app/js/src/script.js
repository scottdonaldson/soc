(function() {

    function init() {

        S.dataRef.onAuth(S.checkForLogin);
        S.renderTemplates();

    }

    document.addEventListener('DOMContentLoaded', init);

})();
