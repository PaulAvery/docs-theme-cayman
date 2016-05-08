module.exports = (a, b, options) => {
	return (a === b) ? options.fn(options.data.root) : '';
};
