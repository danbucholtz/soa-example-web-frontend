var categoryService = require("soa-example-category-service-api");

var getCategories = function(req, res){
	var accessToken = req.user.accessToken;
	categoryService.getCategories(accessToken).then(function(categories){
		res.send(categories);
	});
};

var getCategoryById = function(req, res){
	var accessToken = req.user.accessToken;
	var id = req.params.id;

	categoryService.getCategoryById(accessToken, id).then(function(category){
		res.send(category);
	});
};

var createCategory = function(req, res){
	var accessToken = req.user.accessToken;
	var categoryName = req.body.name;

	categoryService.createCategory(accessToken, categoryName).then(function(response){
		res.send(response);
	});
};

var deleteCategory = function(req, res){
	var accessToken = req.user.accessToken;
	var categoryId = req.body.id;

	categoryService.deleteCategory(accessToken, categoryId).then(function(response){
		if ( !response.success ){
			res.statusCode = 500;
		}
		res.send(response);
	});
};

module.exports = {
	createCategory: createCategory,
	getCategoryById: getCategoryById,
	getCategories: getCategories,
	deleteCategory: deleteCategory
};