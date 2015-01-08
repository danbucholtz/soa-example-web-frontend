application.config(function($stateProvider, $urlRouterProvider){
	
	$urlRouterProvider.otherwise("/home");

	$stateProvider.state('home', {
        url: "/home",
        templateUrl: "views/landing.html"
    });

    $stateProvider.state('products', {
        url: "/products",
        templateUrl: "views/products.html"
    });

    $stateProvider.state('categories', {
        url: "/categories",
        templateUrl: "views/categories.html"
    });
});