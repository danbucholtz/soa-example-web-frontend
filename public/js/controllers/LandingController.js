application.controller('landingController', function ($scope, $state) {
	
	$scope.categories = function(){
		$state.go('categories');
	}

	$scope.products = function(){
		$state.go('products');
	}
});