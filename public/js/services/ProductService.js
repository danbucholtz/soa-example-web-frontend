application.factory('productService', function ($http) {
	return {
		getProducts: function () {
			return $http.get("/api/products?" + new Date().getTime());
		},
		getProductById: function (id) {
			return $http.get("/api/products/" + id + "?" + new Date().getTime());
		},
		saveProduct: function(product){
			return $http.post("/api/products", product);
		},
		deleteProduct:function(productId){
			return $http.post("/api/products/delete", {id:productId});
		}
	};
});