// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

export function findAllNodes(node: any, tagName: string): any[] {
	const results: any[] = [];
	if (node.nodeName === tagName) {
		results.push(node);
	}
	if (node.childNodes) {
		for (const child of node.childNodes) {
			// recursively call findAllNodes on child and flatten results
			results.push(...findAllNodes(child, tagName));
		}
	}
	return results;
}

export function getAttribute(node: any, attrName: string): string | undefined {
	if (!node.attrs) return undefined;

	// attrs array contains things like href,class, title and associated values from html
	// ? is if nothing found, then returned undefined
	return node.attrs.find((a: any) => a.name === attrName)?.value;
}

export function getText(node: any): string {
	// the nodes that contain text (ie) things in side <p> text </p> will have this nodename
	if (node.nodeName === "#text") {
		return node.value.trim();
	}

	let text = "";

	// to collect cases where have something like <p> Hello <strong> world </strong>!</p>
	// where hello is one text node, world is another text node etc
	// <p> is a element node
	if (node.childNodes) {
		for (const child of node.childNodes) {
			text += getText(child);
		}
	}
	return text.trim();
}

export function hasClass(node: any, className: string): boolean {
	const classAttr = getAttribute(node, "class");
	if (!classAttr) return false;

	// cause can have multiple classes in class (views-field-title, views-field)
	return classAttr.split(/\s+/).includes(className);
}
