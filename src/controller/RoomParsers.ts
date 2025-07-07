// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { parse } from "parse5";
import { findAllNodes, getAttribute, getText, hasClass } from "../utils/htmlHelpers";

export interface BuildingEntry {
	code: string;
	fullName: string;
	address: string;
	buildingPath: string;
}

export interface RoomEntry {
	roomNumber: string;
	seats: number;
	furniture: string;
	type: string;
	href: string;
}

export function parseIndex(indexHtml: string): BuildingEntry[] {
	const doc = parse(indexHtml);
	const tables = findAllNodes(doc, "table");

	const buildingTable = tables.find((table) => {
		const tds = findAllNodes(table, "td");
		return tds.some(
			(td) => hasClass(td, "views-field-title") && getAttribute(findAllNodes(td, "a")[0], "href") !== undefined
		);
	});

	if (!buildingTable) {
		throw new Error("No valid building table found in index.htm");
	}

	const buildingRows = findAllNodes(buildingTable, "tr");
	const buildings: BuildingEntry[] = [];

	for (const row of buildingRows) {
		const cells = findAllNodes(row, "td");
		if (cells.length === 0) continue;

		const titleCell = cells.find((td) => hasClass(td, "views-field-title"));

		if (!titleCell) continue;

		const { href, fullName, code, address } = getBuildingDetails(titleCell, cells);

		if (href && fullName && code && address) {
			buildings.push({
				code: code.trim(),
				fullName: fullName.trim(),
				address: address.trim(),
				buildingPath: href,
			});
		}
	}

	if (buildings.length === 0) {
		throw new Error("No valid buildings found in index.htm");
	}

	return buildings;
}

export function parseBuilding(buildingHtml: string): RoomEntry[] {
	const doc = parse(buildingHtml);
	const tables = findAllNodes(doc, "table");

	// find the correct room table
	const roomTable = tables.find((table) => {
		const tds = findAllNodes(table, "td");
		return tds.some((td) => hasClass(td, "views-field-field-room-number"));
	});

	if (!roomTable) {
		return [];
	}

	const roomRows = findAllNodes(roomTable, "tr");
	const rooms: RoomEntry[] = [];

	for (const row of roomRows) {
		const cells = findAllNodes(row, "td");
		if (cells.length === 0) continue;
		const { numberCell, seatsCell, furnitureCell, typeCell, infoCell } = getRoomDetails(cells);

		let linkNode: any;

		if (infoCell) {
			linkNode = findAllNodes(infoCell, "a")[0];
		}

		if (numberCell && seatsCell && furnitureCell && typeCell) {
			rooms.push({
				roomNumber: getText(numberCell),
				seats: Number(getText(seatsCell)),
				furniture: getText(furnitureCell),
				type: getText(typeCell),
				href: String(getAttribute(linkNode, "href")),
			});
		}
	}

	if (rooms.length === 0) {
		throw new Error("No valid rooms found in building file");
	}

	return rooms;
}

const getBuildingDetails = (
	titleCell: any,
	cells: any[]
): {
	href: string | undefined;
	fullName: string;
	code: string;
	address: string;
} => {
	const linkNode = findAllNodes(titleCell, "a")[0];
	const href = getAttribute(linkNode, "href");
	const fullName = getText(linkNode);

	const codeCell = cells.find((td) => hasClass(td, "views-field-field-building-code"));
	const code = codeCell ? getText(codeCell) : "";

	const addressCell = cells.find((td) => hasClass(td, "views-field-field-building-address"));
	const address = addressCell ? getText(addressCell) : "";

	return { href, fullName, code, address };
};

const getRoomDetails = (
	cells: any[]
): { numberCell: any; seatsCell: any; furnitureCell: any; typeCell: any; infoCell: any } => {
	const numberCell = cells.find((td) => hasClass(td, "views-field-field-room-number"));
	const seatsCell = cells.find((td) => hasClass(td, "views-field-field-room-capacity"));
	const furnitureCell = cells.find((td) => hasClass(td, "views-field-field-room-furniture"));
	const typeCell = cells.find((td) => hasClass(td, "views-field-field-room-type"));
	const infoCell = cells.find((td) => hasClass(td, "views-field-nothing"));
	return { numberCell, seatsCell, furnitureCell, typeCell, infoCell };
};
