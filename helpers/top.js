module.exports = options => {
	let current = options.data.root.page;

	while (current.parent) {
		current = current.parent;
	}

	return options.fn(current);
};
