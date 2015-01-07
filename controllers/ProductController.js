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

	productService.createProduct(accessToken, productName).then(function(response){
		res.send(response);
	});
};

module.exports = {
	createProduct: createProduct,
	getProductById: getProductById,
	getProducts: getProducts
};