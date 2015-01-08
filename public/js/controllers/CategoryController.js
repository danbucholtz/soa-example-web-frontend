application.controller('categoryController', function ($scope, $state, categoryService) {
	
	$scope.categories = null;
	$scope.saving = false;

	var getCategories = function(){
		$scope.categories = [];
		categoryService.getCategories().success(function (data, status, headers, config) {

			if ( data && data.length > 0 ){
				for ( var i = 0; i < data.length; i++ ){
					var category = data[i];
					category.title = category.name;
				}
				$scope.categories = data;
			}
			
			$scope.categories.unshift({title: "Create New Category"});
		}).
		error(function (data, status, headers, config) {
		});
	};

	var init = function(){
		$scope.categories = new Array();
		$scope.categories.push({name:"Loading..."});
		getCategories();
	}();

	$scope.categoryClicked = function(category){
		$scope.selectedCategory = category;
	};

	$scope.saveCategory = function(category){
		$scope.saving = true;
		categoryService.saveCategory(category).success(function (data, status, headers, config) {
			$scope.selectedCategory = null;
			getCategories();
			$scope.saving = false;
		}).
		error(function (data, status, headers, config) {
			$scope.saving = false;
			alert(data.errorMessage);
		});
	};

	$scope.deleteCategory = function(category){
		categoryService.deleteCategory(category._id).success(function (data, status, headers, config) {
			$scope.selectedCategory = null;
			getCategories();
		}).
		error(function (data, status, headers, config) {
			alert(data.errorMessage);
		});
	};
});