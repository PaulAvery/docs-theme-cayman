/* Dependencies */
const fs = require('fs');
const hbs = require('handlebars');
const path = require('path');
const slug = require('slug');

/* Map a treelevel to a url */
exports.mapUrl = level => {
	let url = '';

	/* Redirect to next level down if we are empty */
	if (level.content === '' && level.children.length > 0) {
		return exports.mapUrl(level.children[0]);
	}

	/* Create slugified path */
	let current = level;
	while(current.parent) {
		url = slug(current.name).toLowerCase() + '/' + url;
		current = current.parent;
	}

	/* If we have no children, add the html extension */
	if(level.children.length === 0 && level.parent) {
		url = url.substr(0, url.length - 1) + '.html';
	}

	return url;
};

/* Map a treelevel to a target file */
exports.mapFile = level => {
	let pth = exports.mapUrl(level);

	if(level.children.length > 0 || !level.parent) {
		pth += 'index.html';
	}

	return pth;
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

/*
 * Build the menu structure from a level
 */
function buildSubmenu(level) {
	let menu = [];

	/* Move up to second level */
	let current = level;
	while(current.parent && current.parent.parent) {
		current = current.parent;
	}

	if(current.content === '') {
		/* Add children if toplevel is empty */
		menu.push(...current.children);
	} else {
		/* Add toplevel if not */
		menu.push(current);
	}

	/* Return an empty menu if we have only a single entry without children or are toplevel*/
	return (!current.parent || (menu.length === 1 && menu[0].children.length === 0)) ? [] : menu;
}

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
			submenu: buildSubmenu(tree),
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

