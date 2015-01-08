application.controller('productController', function ($scope, $state, productService, categoryService) {
	
	$scope.products = null;
	$scope.saving = false;

	$scope.selectedCategory = null;

	var getProducts = function(){
		
		productService.getProducts().success(function (data, status, headers, config) {
			if ( data && data.length > 0 ){
				for ( var i = 0; i < data.length; i++ ){
					var product = data[i];
					product.title = product.name;
				}
			}

			$scope.products = data;
			
			$scope.products.unshift({title: "Create New Product"});
		}).error(function (data, status, headers, config) {
		});
	};

	var getCategories = function(){
		$scope.categories = [];
		categoryService.getCategories().success(function (data, status, headers, config) {

			if ( data && data.length > 0 ){
				for ( var i = 0; i < data.length; i++ ){
					var category = data[i];
					category.title = category.name;
				}
				$scope.categories = data;
				$scope.selectedCategory = data[0];
			}
		}).error(function (data, status, headers, config) {
		});
	};

	var init = function(){
		$scope.products = new Array();
		$scope.products.push({name:"Loading..."});
		getProducts();
		getCategories();
	}();

	$scope.productClicked = function(product){
		$scope.selectedProduct = product;
		// also, update the selected category
		if ( product.category && $scope.categories && $scope.categories.length > 0 ){
			for ( var i = 0; i < $scope.categories.length; i++ ){
				if ( $scope.categories[i]._id == product.category ){
					$scope.selectedCategory = $scope.categories[i];
					break;
				}
			}
		}
	};

	$scope.saveProduct = function(product){
		$scope.saving = true;
		if ( !$scope.selectedCategory ){
			alert("A Product requires a catagory");
		}
		else{
			product.categoryId = $scope.selectedCategory._id;
			productService.saveProduct(product).success(function (data, status, headers, config) {
				$scope.selectedProduct = null;
				getProducts();
				$scope.saving = false;
			}).
			error(function (data, status, headers, config) {
				$scope.saving = false;
				alert(data.errorMessage);
			});
		}
	};

	$scope.deleteProduct = function(product){
		productService.deleteProduct(product._id).success(function (data, status, headers, config) {
			$scope.selectedProduct = null;
			getProducts();
		}).
		error(function (data, status, headers, config) {
			alert(data.errorMessage);
		});
	};
});