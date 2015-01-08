var productService = require("soa-example-product-service-api");

var getProducts = function(req, res){
	var accessToken = req.user.accessToken;
	productService.getProducts(accessToken).then(function(products){
		res.send(products);
	});
};

var getProductById = function(req, res){
	var accessToken = req.user.accessToken;
	var id = req.params.id;

	productService.getProductById(accessToken, id).then(function(product){
		res.send(product);
	});
};

var createProduct = function(req, res){
	var accessToken = req.user.accessToken;
	var productName = req.body.name;
	var price = req.body.price;
	var categoryId = req.body.categoryId;
	var description = req.body.description;

	productService.createProduct(accessToken, productName, price, categoryId, description).then(function(response){
		res.send(response);
	});
};

var deleteProduct = function(req, res){
	var accessToken = req.user.accessToken;
	var productId = req.body.id;

	productService.deleteCategory(accessToken, productId).then(function(response){
		res.send(response);
	});
};

module.exports = {
	createProduct: createProduct,
	getProductById: getProductById,
	getProducts: getProducts,
	deleteProduct: deleteProduct
};