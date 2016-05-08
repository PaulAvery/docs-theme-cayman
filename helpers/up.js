module.exports = options => {
	let depth = 0;
	let current = options.data.root.page;

	if(current.children.length > 0) {
		depth++;
	}

	while(current.parent) {
		depth++;
		current = current.parent;
	}

	return new Array(depth).fill('').join('../');
};
