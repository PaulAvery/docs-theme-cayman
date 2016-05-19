module.exports = (a, b, options) => {
	return (a.startsWith(b)) ? options.fn(options.data.root) : '';
};
