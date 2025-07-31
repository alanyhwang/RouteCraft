// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { expect } from "chai";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { Log } from "@ubccpsc310/project-support";
import Server from "../../src/rest/Server";
import { ARCHIVES_DIR } from "../../config";
import * as fs from "fs-extra";
import path from "node:path";
import { clearDisk } from "../TestUtil";

describe("Facade C3", function () {
	let server: Server;
	let sectionsZipFile: Buffer;
	let roomsZipFile: Buffer;
	const PORT = 4321;
	const SERVER_URL = `http://localhost:${PORT}`;

	before(async function () {
		// TODO: start server here once and handle errors properly

		server = new Server(PORT);
		try {
			await server.start();
			Log.info("Server started successfully for tests");
		} catch (err) {
			Log.error("Failed to start server in before hook", err);
			throw err;
		}

		const SECTIONS_PATH = path.join(ARCHIVES_DIR, "smaller_courses.zip");
		const ROOMS_PATH = path.join(ARCHIVES_DIR, "campus.zip");

		sectionsZipFile = await fs.readFile(SECTIONS_PATH);
		roomsZipFile = await fs.readFile(ROOMS_PATH);

		await clearDisk();
	});

	after(async function () {
		// TODO: stop server here once!
		if (server) {
			try {
				await server.stop();
				Log.info("Server stopped successfully after tests");
			} catch (err) {
				Log.error("Failed to stop server in after hook", err);
			}
		}
	});

	beforeEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		Log.info("Starting a test...");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
		Log.info("Finished a test.");
	});

	describe("PUT /dataset/:id/:kind", function () {
		beforeEach(async function () {
			await clearDisk();
			server.reInstantiateFacade();
		});

		it("should upload 1 sections dataset", async function () {
			const ENDPOINT_URL = "/dataset/1/sections";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should upload 1 rooms dataset", async function () {
			const ENDPOINT_URL = "/dataset/1/rooms";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(roomsZipFile)
					.set("Content-Type", "application/x-zip-compressed");
				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should upload 1 sections dataset with same content but different id", async function () {
			const ENDPOINT_URL = "/dataset/5/sections";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should return 400 for invalid dataset (not a zip)", async function () {
			const ENDPOINT_URL = "/dataset/3/sections";
			const INVALID_DATA = Buffer.from("not a zip file");

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(INVALID_DATA)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
				expect(res.body.error).to.be.a("string");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should return 400 for invalid id", async function () {
			const ENDPOINT_URL = "/dataset/inval_id/sections";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
				expect(res.body.error).to.be.a("string");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("shouldn't add one dataset with ID that already exists", async function () {
			const ENDPOINT_URL_1 = "/dataset/1/sections";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL_1)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
			const ENDPOINT_URL_2 = "/dataset/1/rooms";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL_2)
					.send(roomsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
				expect(res.body.error).to.be.a("string");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should return 400 for invalid kind", async function () {
			const ENDPOINT_URL = "/dataset/3/invalidkind";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
				expect(res.body.error).to.be.a("string");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});
	});

	describe("GET /datasets", function () {
		beforeEach(async function () {
			await clearDisk();
			server.reInstantiateFacade();
		});

		it("should return list of datasets (success)", async function () {
			try {
				const res = await request(SERVER_URL).get("/datasets");

				expect(res.status).to.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
				// Optional: check properties of returned datasets, e.g. id, kind, numRows
				if (res.body.result.length > 0) {
					const ds = res.body.result[0];
					expect(ds).to.have.property("id");
					expect(ds).to.have.property("kind");
					expect(ds).to.have.property("numRows");
				}
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});
	});

	describe("POST /query", function () {
		const QUERY_ENDPOINT = "/query";

		it("should run valid section query and return results", async function () {
			const input = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			try {
				const res = await request(SERVER_URL).post(QUERY_ENDPOINT).send(input).set("Content-Type", "application/json");

				expect(res.status).to.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail("Unexpected error in /query");
				// Optionally test that it returned the correct error code
			}
		});

		it("should run valid rooms query and return results", async function () {
			const input = {
				WHERE: {
					GT: {
						rooms_lat: 10,
					},
				},
				OPTIONS: {
					COLUMNS: [
						"rooms_fullname",
						"rooms_shortname",
						"rooms_number",
						"rooms_name",
						"rooms_address",
						"rooms_lat",
						"rooms_lon",
						"rooms_seats",
						"rooms_type",
						"rooms_furniture",
						"rooms_href",
					],
				},
			};

			try {
				const res = await request(SERVER_URL).post(QUERY_ENDPOINT).send(input).set("Content-Type", "application/json");

				expect(res.status).to.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail("Unexpected error in /query");
			}
		});

		// it("should run valid section query and return results even after server stopped", async function () {
		// 	if (server) {
		// 		try {
		// 			await server.stop();
		// 			Log.info("Server stopped successfully after tests");
		// 		} catch (err) {
		// 			Log.error("Failed to stop server in after hook", err);
		// 		}
		// 	}
		//
		// 	await new Promise((r) => setTimeout(r, 100));
		//
		// 	try {
		// 		await server.start();
		// 		Log.info("Server started successfully for tests");
		// 	} catch (err) {
		// 		Log.error("Failed to start server in before hook", err);
		// 		throw err;
		// 	}
		//
		// 	const input = {
		// 		WHERE: {
		// 			GT: {
		// 				sections_avg: 97,
		// 			},
		// 		},
		// 		OPTIONS: {
		// 			COLUMNS: ["sections_dept", "sections_avg"],
		// 			ORDER: "sections_avg",
		// 		},
		// 	};
		//
		// 	try {
		// 		const res = await request(SERVER_URL).post(QUERY_ENDPOINT).send(input).set("Content-Type", "application/json");
		//
		// 		expect(res.status).to.equal(StatusCodes.OK);
		// 		expect(res.body).to.have.property("result");
		// 		expect(res.body.result).to.be.an("array");
		// 	} catch (err) {
		// 		Log.error(err);
		// 		expect.fail("Unexpected error in /query");
		// 		// Optionally test that it returned the correct error code
		// 	}
		// });

		it("shouldn't query after sections dataset deleted", async function () {
			try {
				const deleteRes = await request(SERVER_URL).delete("/dataset/sections");

				expect(deleteRes.status).to.equal(StatusCodes.OK);
				expect(deleteRes.body).to.have.property("result");
				expect(deleteRes.body.result).to.be.an("string");
			} catch (err) {
				Log.error("Delete request failed:", err);
				expect.fail("DELETE request failed");
			}

			const input = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			try {
				const res = await request(SERVER_URL).post(QUERY_ENDPOINT).send(input).set("Content-Type", "application/json");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("shouldn't query after rooms dataset deleted", async function () {
			try {
				const deleteRes = await request(SERVER_URL).delete("/dataset/rooms");

				expect(deleteRes.status).to.equal(StatusCodes.OK);
				expect(deleteRes.body).to.have.property("result");
				expect(deleteRes.body.result).to.be.an("string");
			} catch (err) {
				Log.error("Delete request failed:", err);
				expect.fail("DELETE request failed");
			}

			const input = {
				WHERE: {
					GT: {
						rooms_lat: 10,
					},
				},
				OPTIONS: {
					COLUMNS: [
						"rooms_fullname",
						"rooms_shortname",
						"rooms_number",
						"rooms_name",
						"rooms_address",
						"rooms_lat",
						"rooms_lon",
						"rooms_seats",
						"rooms_type",
						"rooms_furniture",
						"rooms_href",
					],
				},
			};

			try {
				const res = await request(SERVER_URL).post(QUERY_ENDPOINT).send(input).set("Content-Type", "application/json");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should return 400 for invalid query", async function () {
			const invalidQuery = {
				WHERE: {
					IS: {
						sections_instructor: 1,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_instructor", "sections_avg"],
				},
			};

			try {
				const res = await request(SERVER_URL).post("/query").send(invalidQuery).set("Content-Type", "application/json");

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		before(async function () {
			await clearDisk();
			server.reInstantiateFacade();

			const SECTIONS_ENDPOINT_URL = "/dataset/sections/sections";
			const ROOMS_ENDPOINT_URL = "/dataset/rooms/rooms";

			try {
				const res = await request(SERVER_URL)
					.put(SECTIONS_ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}

			try {
				const res = await request(SERVER_URL)
					.put(ROOMS_ENDPOINT_URL)
					.send(roomsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		after(async function () {
			await clearDisk();
		});
	});

	describe("DELETE /dataset/:id", function () {
		beforeEach(async function () {
			await clearDisk();
			server.reInstantiateFacade();
		});

		it("should delete existing sections dataset and return 200", async function () {
			const ENDPOINT_URL = "/dataset/1/sections";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(sectionsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}

			try {
				const deleteRes = await request(SERVER_URL).delete("/dataset/1");

				expect(deleteRes.status).to.equal(StatusCodes.OK);
				expect(deleteRes.body).to.have.property("result");
				expect(deleteRes.body.result).to.be.an("string");
			} catch (err) {
				Log.error("Delete request failed:", err);
				expect.fail("DELETE request failed");
			}
		});

		it("should delete existing rooms dataset and return 200", async function () {
			const ENDPOINT_URL = "/dataset/1/rooms";

			try {
				const res = await request(SERVER_URL)
					.put(ENDPOINT_URL)
					.send(roomsZipFile)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.be.equal(StatusCodes.OK);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}

			try {
				const deleteRes = await request(SERVER_URL).delete("/dataset/1");

				expect(deleteRes.status).to.equal(StatusCodes.OK);
				expect(deleteRes.body).to.have.property("result");
				expect(deleteRes.body.result).to.be.an("string");
			} catch (err) {
				Log.error("Delete request failed:", err);
				expect.fail("DELETE request failed");
			}
		});

		it("should return 404 for non-existent dataset", async function () {
			const ENDPOINT_URL = "/dataset/50";

			try {
				const res = await request(SERVER_URL).delete(ENDPOINT_URL);

				expect(res.status).to.equal(StatusCodes.NOT_FOUND);
				expect(res.body).to.have.property("error");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});

		it("should return 400 for invalid id", async function () {
			const ENDPOINT_URL = "/dataset/in_valid";

			try {
				const res = await request(SERVER_URL).delete(ENDPOINT_URL);

				expect(res.status).to.equal(StatusCodes.BAD_REQUEST);
				expect(res.body).to.have.property("error");
			} catch (err) {
				Log.error(err);
				expect.fail();
			}
		});
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
