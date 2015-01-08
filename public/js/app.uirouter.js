var application = angular.module('soa', ['ui.router', 'ui.bootstrap']);

application.config(['$provide', function($provide){
    $provide.decorator('$rootScope', ['$delegate', function($delegate){
    	Object.defineProperty($delegate.constructor.prototype, '$onRootScope', {
    		value: function(name, listener){
    			var unsubscribe = $delegate.$on(name, listener);
    			this.$on('$destroy', unsubscribe);
    		},
    		enumerable: false
        });
    	return $delegate;
    }]);
}]);