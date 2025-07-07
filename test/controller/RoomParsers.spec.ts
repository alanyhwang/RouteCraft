// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { expect } from "chai";
import { parseBuilding, parseIndex } from "../../src/controller/RoomParsers";
import { readFile } from "fs/promises";
import path from "path";
import { HTM_DIR } from "../../config";
import { clearDisk } from "../TestUtil";

describe("parseIndex", () => {
	it("should parse valid index.htm correctly", async () => {
		const html = await readFile(path.join(HTM_DIR, "index.htm"), "utf-8");
		const result = parseIndex(html);

		expect(result).to.be.an("array").that.is.not.empty;

		for (const entry of result) {
			expect(entry).to.have.keys("code", "fullName", "address", "buildingPath");
			expect(entry.buildingPath).to.match(/\.htm$/);
		}
	});

	it("should return empty array if no building table present", () => {
		const fake = "<html><body><h1>No tables</h1></body></html>";

		try {
			parseIndex(fake);
			expect.fail("Should've thrown error bceause not valid index.htm");
		} catch (err) {
			expect(err).to.not.be.undefined;
		}
	});
});

describe("parseBuilding", () => {
	beforeEach(async function () {
		await clearDisk();
	});

	it("should parse valid building file with rooms correctly", async () => {
		const html = await readFile(path.join(HTM_DIR, "BIOL.htm"), "utf-8");
		const rooms = parseBuilding(html);

		expect(rooms).to.be.an("array").that.is.not.empty;

		for (const room of rooms) {
			expect(room).to.have.keys("roomNumber", "seats", "furniture", "type", "href");
			expect(room.roomNumber).to.be.a("string");
			expect(room.seats).to.be.a("number");
		}
	});

	it("should return empty array if no rooms table present", () => {
		const fake = "<html><body><h1>No rooms</h1></body></html>";

		try {
			parseIndex(fake);
			expect.fail("Should've thrown error bceause no valid rooms");
		} catch (err) {
			expect(err).to.not.be.undefined;
		}
	});
});
