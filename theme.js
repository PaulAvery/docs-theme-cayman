/* Dependencies */
const fs = require('fs');
const hbs = require('handlebars');
const path = require('path');
const slug = require('slug');

/* Map a treelevel to a url */
exports.mapUrl = level => {
	let url = '';
	let current = level;

	while(current.parent) {
		url = slug(current.name) + '/' + url;
		current = current.parent;
	}

	if(level.children.length === 0) {
		url = url.substr(0, url.length - 1) + '.html';
	}

	return url;
};

/* Map a treelevel to a target file */
exports.mapFile = level => {
	let url = exports.mapUrl(level);

	if(level.children.length > 0) {
		url += 'index.html';
	}

	return url;
};

/*
 * Register syntax highlighters.
 * Can be overriden by other theme.
 */
exports.assignHighlighters = () => {};

/*
 * Register markdown plugins.
 * Can be overriden by other theme.
 */
exports.assignMarkdown = () => {};

/* Compile the parsed tree into a file structure */
exports.compile = (root, from, to) => {
	let assets = from('assets/**/*.*');
	let helpers = from('helpers/*');
	let partials = from('templates/partials/*');
	let template = hbs.compile(fs.readFileSync(from('templates/page.hbs')[0].absolute, 'utf8'));

	/* Copy assets */
	assets.forEach(asset => fs.writeFileSync(to(asset.relative), fs.readFileSync(asset.absolute)));

	/* Register helpers */
	helpers.forEach(({absolute: helper}) => hbs.registerHelper(
		path.basename(helper, '.js'),
		require(helper)
	));

	/* Register partials */
	partials.forEach(({absolute: partial}) => hbs.registerPartial(
		path.basename(partial, '.hbs'),
		fs.readFileSync(partial, 'utf8'),
		{ preventIndent: true }
	));

	/* Render documentation pages */
	(function renderTree(tree) {
		let options = {
			pkg: root.pkg,
			page: tree,
			toplevel: root.tree
		};

		/* Render children */
		tree.children.forEach(renderTree);

		/* Write page content */
		if(tree.content) {
			fs.writeFileSync(to(tree.target), template(options));
		}
	})(root.tree);
};

