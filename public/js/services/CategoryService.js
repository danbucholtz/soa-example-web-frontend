application.factory('categoryService', function ($http) {
	return {
		getCategories: function () {
			return $http.get("/api/categories?" + new Date().getTime());
		},
		getCategoryById: function (id) {
			return $http.get("/api/categories/" + id + "?" + new Date().getTime());
		},
		saveCategory: function(category){
			return $http.post("/api/categories", category);
		},
		deleteCategory:function(categoryId){
			return $http.post("/api/categories/delete", {id:categoryId});
		}
	};
});