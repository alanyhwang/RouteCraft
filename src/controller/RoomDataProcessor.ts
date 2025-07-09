// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import JSZip from "jszip";
import { DatasetProcessor } from "./DataProcessor";
import { BuildingEntry, parseBuilding, parseIndex, RoomEntry } from "./RoomParsers";
import { GEO_ENDPOINT } from "../../config";

export interface Room {
	fullname: string;
	shortname: string;
	number: string;
	name: string;
	address: string;
	lat: number;
	lon: number;
	seats: number;
	type: string;
	furniture: string;
	href: string;
}

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class RoomDatasetProcessor extends DatasetProcessor {
	public async processDataset(id: string, base64Content: string): Promise<Room[]> {
		const zip = await JSZip.loadAsync(base64Content, { base64: true });

		// find index.htm
		const indexFile = Object.keys(zip.files).find((name) => name.endsWith("index.htm"));

		if (!indexFile) {
			throw new InsightError("Missing index.htm in rooms dataset");
		}

		// read text content of indexfile
		const indexHtml = await zip.files[indexFile].async("text");

		const buildingEntries = parseIndex(indexHtml);

		// go through all buildings and find associated room entries
		const buildingPromises = buildingEntries.map(async (building) => {
			// cause index.htm contains links like "./campus/discover/buildings-and-classrooms/ALRD.htm"
			// but zip file contains tree where file would be found without the ./ in beginning
			const buildingPath = building.buildingPath.replace("./", "");

			// so getting the file of the particular building (ie BIOL.htm) and turning into jszipobject
			const buildingFile = zip.files[buildingPath];

			if (!buildingFile) return [];

			// reading text in jszipobject
			const buildingHtml = await buildingFile.async("text");

			// get all valid room entries from each building
			const roomEntries = parseBuilding(buildingHtml);

			const geoUrl = `${GEO_ENDPOINT}${encodeURIComponent(building.address)}`;

			let geo;

			try {
				const geoResp = await fetch(geoUrl);
				geo = await geoResp.json();
			} catch {
				return []; // skip on geo failure
			}

			if (geo.error || geo.lat === undefined || geo.lon === undefined) {
				return [];
			}

			return this.buildRoomObjects(building, geo, roomEntries);
		});

		const allRooms = await this.resolveAndFlatten<Room>(buildingPromises, "No valid rooms found");

		this.storeDataset(id, allRooms);

		await this.saveToDisk(id, allRooms, this.datasetKind());

		return allRooms;
	}

	private buildRoomObjects(building: BuildingEntry, geo: GeoResponse, roomEntries: RoomEntry[]): Room[] {
		return roomEntries.map((room) => ({
			fullname: building.fullName,
			shortname: building.code,
			number: room.roomNumber,
			name: `${building.code}_${room.roomNumber}`,
			address: building.address,
			lat: geo.lat!,
			lon: geo.lon!,
			seats: room.seats,
			type: room.type,
			furniture: room.furniture,
			href: room.href,
		}));
	}

	protected datasetKind(): InsightDatasetKind {
		return InsightDatasetKind.Rooms;
	}
}
