var Collection = require('./collection');
var Feature = require('./feature');

module.exports = Collection.extend({
	model: Feature

});