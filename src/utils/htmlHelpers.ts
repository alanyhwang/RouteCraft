// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

export function findAllNodes(node: any, tagName: string): any[] {
	const results: any[] = [];
	if (node.nodeName === tagName) {
		results.push(node);
	}
	if (node.childNodes) {
		for (const child of node.childNodes) {
			results.push(...findAllNodes(child, tagName));
		}
	}
	return results;
}

export function getAttribute(node: any, attrName: string): string | undefined {
	if (!node.attrs) return undefined;
	return node.attrs.find((a: any) => a.name === attrName)?.value;
}

export function getText(node: any): string {
	if (node.nodeName === "#text") {
		return node.value.trim();
	}
	let text = "";
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
	return classAttr.split(/\s+/).includes(className);
}
