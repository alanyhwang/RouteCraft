import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

// wrote TODOs, tests and queries with the help of ChatGPT (customized and modified ChatGPT generated templates)
describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let allSections: string;
	let sections: string;

	before(async function () {
		// This block runs once and loads the datasets.
		allSections = await getContentFromArchives("pair.zip");
		sections = await getContentFromArchives("smaller_courses.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should reject with an empty dataset id", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);

				// error message when error wasn't thrown (ie didn't go to catch when called addDataset
				expect.fail("Should've thrown error cause of empty ID");
			} catch (err) {
				// error was expectedly thrown but checking error to be right error type
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an id that has an underscore", async function () {
			try {
				await facade.addDataset("i_d", sections, InsightDatasetKind.Sections);
				expect.fail("Should've thrown error because ID contains underscore");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an id only has whitespace", async function () {
			try {
				await facade.addDataset("  ", sections, InsightDatasetKind.Sections);
				expect.fail("Should've thrown error because there's only whitespace");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// don't need try catch because mocha will automatically fail test if unhandled error or rejected promise occurs during async test
		it("should add a valid dataset", async function () {
			const result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should reject adding a dataset whose id has already been added", async function () {
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should've thrown error because of duplicate dataset ID");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when content is not in valid base64 format", async function () {
			const invalidSection = "not_valid_section!";

			try {
				await facade.addDataset("invalid", invalidSection, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because of content not in base64 format");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when content is empty content string", async function () {
			try {
				await facade.addDataset("empty", "", InsightDatasetKind.Sections);
				expect.fail("Should've thrown because content is empty string");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject a content that is in form of base-64 but decodes to non-ZIP data", async function () {
			// buffer used to handle binary data
			const plain = Buffer.from("non-zip").toString("base64");
			try {
				await facade.addDataset("text", plain, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because of non-zip content");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject content in base-64 but is an empty ZIP archive", async function () {
			// Create an empty zip in-memory (PK header only)
			// const countNum = 18;
			//
			// //full binary string that is absolute min valid ZIP file (no actual files or entries)
			// const emptyZipBase64 = Buffer.from("PK\x05\x06" + "\x00".repeat(countNum), "binary").toString("base64");

			const emptyZipBase64 = await getContentFromArchives("empty.zip");
			try {
				await facade.addDataset("emptyZip", emptyZipBase64, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because of empty ZIP");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject content that is base64 zip but doesn't have courses in the zip's root directory", async function () {
			const notCoursesDirectory = await getContentFromArchives("no-courses-directory.zip");
			try {
				await facade.addDataset("notCourses", notCoursesDirectory, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because don't have courses as root directory");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject content that is base64 zip but not in json format", async function () {
			const notJson = await getContentFromArchives("not-json.zip");
			try {
				await facade.addDataset("notJson", notJson, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because not in json format");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject content that is base64 zip but no result key in json", async function () {
			const noResultKey = await getContentFromArchives("no-result-in-json.zip");
			try {
				await facade.addDataset("noResultKey", noResultKey, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because no result key in json");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject content that is base64 zip but no valid sections in json", async function () {
			const noValidSections = await getContentFromArchives("json-no-valid-sections.zip");
			try {
				await facade.addDataset("noValidSections", noValidSections, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because no valid sections in json");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when kind is rooms", async function () {
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Rooms);
				expect.fail("Should've thrown because only valid kind is Sections for C0 and C1");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add when trying to add dataset that was already removed", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc");

			const result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should add multiple valid datasets and return string array with all added ids", async function () {
			let result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);

			result = await facade.addDataset("sfu", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc", "sfu"]);

			result = await facade.addDataset("uvic", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc", "sfu", "uvic"]);
		});

		it("should add ids that have same characters but different lowercase/uppercase)", async function () {
			let result = await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["UBC"]);

			result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["UBC", "ubc"]);
		});

		it("should have persistence to disk so previously added dataset should be re-loaded by a new InsightFacade instance", async function () {
			// add first dataset
			await facade.addDataset("first", sections, InsightDatasetKind.Sections);

			// simulate restart
			facade = new InsightFacade();

			// add second dataset – the returned array should include BOTH ids
			const result = await facade.addDataset("second", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["first", "second"]);
		});

		it("should reject adding previously added dataset id in a new InsightFacade instance to test persistence", async function () {
			// add first dataset
			await facade.addDataset("first", sections, InsightDatasetKind.Sections);

			// simulate restart
			facade = new InsightFacade();

			try {
				await facade.addDataset("first", sections, InsightDatasetKind.Sections);
				expect.fail("Should've thrown because this dataset id already added and should've persisted");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should remove a valid dataset successfully", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("ubc");
			expect(result).to.equal("ubc");
		});

		// it("should have persistence to disk so previously added dataset should be able to be removed in new InsightFacade instance", async function () {
		// 	// add first dataset
		// 	await facade.addDataset("first", sections, InsightDatasetKind.Sections);
		//
		// 	// simulate restart
		// 	facade = new InsightFacade();
		//
		// 	// add second dataset – the returned array should include BOTH ids
		// 	const result = await facade.removeDataset("first");
		// 	expect(result).to.equal("first");
		// });

		it("should reject when removing a dataset with ID that was never added", async function () {
			try {
				await facade.removeDataset("neverAdded");
				expect.fail("Should've thrown error because ID doesn't exist");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should reject when removing a dataset with empty string ID", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should've thrown error because empty string ID not valid");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when removing with ID with only whitespace", async function () {
			try {
				await facade.removeDataset(" ");
				expect.fail("Should've thrown error because ID with only whitespace is not valid");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when removing with ID that has an underscore", async function () {
			try {
				await facade.removeDataset("invalid_id");
				expect.fail("Should've thrown error because ID has an underscore");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject when trying to remove dataset that was already removed", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc");

			try {
				await facade.removeDataset("ubc");
				expect.fail("Should've thrown error because dataset should've already been removed");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});
	});

	describe("listDatasets", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("returns empty array when no datasets have been added", async function () {
			const ds = await facade.listDatasets();
			expect(ds).to.deep.equal([]);
		});

		it("returns array with one dataset after a successful add", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			const ds = await facade.listDatasets();
			expect(ds).to.have.length(1);

			// getting first thing in ds array (deconstruction) -> same as doing ds[0]
			const [single] = ds;
			expect(single.id).to.equal("ubc");
			expect(single.kind).to.equal(InsightDatasetKind.Sections);
			expect(single.numRows).to.be.greaterThan(0);
		});

		it("returns array with all datasets after multiple adds", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("sfu", sections, InsightDatasetKind.Sections);
			await facade.addDataset("uvic", sections, InsightDatasetKind.Sections);

			const ds = await facade.listDatasets();

			const numExpected = 3;

			expect(ds).to.have.length(numExpected);

			// looping through every entry in ds array (ie d) and getting d's id (d.id)
			// map returns an array always so get an array of all the d.ids in ids
			const ids = ds.map((d) => d.id);
			expect(ids).to.have.members(["ubc", "sfu", "uvic"]);

			// checking that each entry has correct metadata
			for (const entry of ds) {
				expect(entry.kind).to.equal(InsightDatasetKind.Sections);
				expect(entry.numRows).to.be.greaterThan(0);
			}
		});

		it("return arrays that reflects that dataset has been removed", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			let ds = await facade.listDatasets();
			expect(ds).to.have.length(1);

			await facade.removeDataset("ubc");
			ds = await facade.listDatasets();
			expect(ds).to.deep.equal([]);
		});

		it("returned array will still have datasets persisted on disk from previous facades", async function () {
			// first instance: add dataset & implicitly persist
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			// simulate a program restart
			facade = new InsightFacade();

			const ds = await facade.listDatasets();
			expect(ds).to.have.length(1);
			expect(ds[0].id).to.equal("ubc");
			expect(ds[0].kind).to.equal(InsightDatasetKind.Sections);
			expect(ds[0].numRows).to.be.greaterThan(0);
		});

		it("listDatasets still shows correct added dataset even after failed remove", async function () {
			await facade.addDataset("sfu", sections, InsightDatasetKind.Sections);

			try {
				await facade.removeDataset("ubc"); // should throw NotFoundError
				expect.fail("Should've thrown error because id doesn't exist");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}

			const ds = await facade.listDatasets();
			expect(ds).to.have.length(1);
			expect(ds[0].id).to.equal("sfu");
			expect(ds[0].kind).to.equal(InsightDatasetKind.Sections);
			expect(ds[0].numRows).to.be.greaterThan(0);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// Check correct err thrown
				if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceof(ResultTooLargeError);
				} else {
					expect(err).to.be.instanceof(InsightError);
				}
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}

			// check value equality - order doesn't matter
			expect(result).to.have.deep.members(expected);
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", allSections, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.

		// Dataset indicated does not exist
		it("[invalid/invalidNoDatasetAdded.json] invalid no dataset added prior", checkQuery);

		// Query & Number of Results
		// possible test: query with 5000, 5001 results
		it("[valid/validQueryNoResult.json] valid query 0 result", checkQuery);
		it("[valid/valid5000Query.json] valid query 5000 result", checkQuery);
		it("[invalid/invalid5001Query.json] invalid query 5001 result", checkQuery);

		// Valid Query WHERE & OPTIONS
		it("[valid/validQuery.json] valid WHERE + OPTIONS", checkQuery);
		it("[valid/validQueryFlipped.json] valid OPTIONS + WHERE", checkQuery);

		// Invalid: Query missing WHERE & OPTIONS
		it("[invalid/missingWHEREAndOPTIONS.json] Query missing WHERE & OPTIONS", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/invalidWHEREMissingOptions.json] Query missing OPTIONS", checkQuery);
		it("[invalid/invalidWHEREResultTooLargeError.json] Query result too large / WHERE missing BODY", checkQuery);
		it("[invalid/optionsNoColumn.json] OPTIONS missing COLUMN", checkQuery);

		// Filter
		it("[invalid/invalidFilterKey.json] Filter has invalid key", checkQuery);

		// BODY Filter: LOGICCOMPARISON - AND
		it("[valid/validANDOneItem.json] valid AND with 1 item", checkQuery);
		it("[valid/validANDTwoItem.json] valid AND with 2 items", checkQuery);
		it("[valid/validANDThreeItem.json] valid AND with 3 item", checkQuery);
		it("[valid/validANDWithDuplicateQuery.json] valid AND with 2 of same item", checkQuery);
		it("[invalid/invalidANDEmpty.json] AND is empty array", checkQuery);
		it("[invalid/invalidANDBlankItem.json] AND has invalid key", checkQuery);

		// BODY Filter: LOGICCOMPARISON - OR
		it("[valid/validOROneItem.json] valid OR with 1 item", checkQuery);
		it("[valid/validORTwoItem.json] valid OR with 2 item", checkQuery);
		it("[valid/validORThreeItem.json] valid OR with 3 item", checkQuery);
		it("[valid/validORWithDuplicateQuery.json] valid OR with 2 of same item", checkQuery);
		it("[invalid/invalidOREmptyArray.json] AND is empty array", checkQuery);
		it("[invalid/invalidORNoValidKey.json] AND has invalid key", checkQuery);

		// BODY Filter: MCOMPARISON - GT
		it("[valid/validGT.json] valid GT", checkQuery);
		it("[invalid/invalidGTBadKey.json] GT with bad key", checkQuery);
		it("[invalid/invalidGTKeyType.json] GT with bad key type", checkQuery);
		it("[invalid/invalidGTValue.json] GT with bad value type", checkQuery);

		// BODY Filter: MCOMPARISON - LT
		it("[valid/validLT.json] valid LT", checkQuery);
		it("[invalid/invalidLTKey.json] LT with bad key", checkQuery);
		it("[invalid/invalidLTKeyType.json] LT with bad key type", checkQuery);
		it("[invalid/invalidLTValue.json] LT with bad value type", checkQuery);

		// BODY Filter: MCOMPARISON - EQ
		it("[valid/validEQ.json] valid EQ", checkQuery);
		it("[invalid/invalidEQBadKey.json] EQ with bad key", checkQuery);
		it("[invalid/invalidEQKeyType.json] EQ with bad key type", checkQuery);
		it("[invalid/invalidEQValue.json] EQ with bad value type", checkQuery);

		// BODY Filter: SCOMPARISON - Valid
		it("[valid/validIS.json] valid IS exact match", checkQuery);
		it("[valid/validISWildCardEnd.json] valid IS wildcard *input", checkQuery);
		it("[valid/validISWildCardStarts.json] valid IS wildcard input*", checkQuery);
		it("[valid/validISWildCardContains.json] valid IS wildcard *input*", checkQuery);
		it("[valid/validISSpace.json] valid IS with only one space", checkQuery);

		// BODY Filter: SCOMPARISON - Invalid
		it("[invalid/invalidISWildCardSandwich.json] invalid IS * is between 2 characters", checkQuery);
		it("[invalid/invalidISWildCardAsteriskSandwich.json] invalid IS * is between 2 *", checkQuery);
		it("[invalid/invalidISWildCardEmptyChar.json] IS with only ** result in large query", checkQuery);
		it("[invalid/invalidISWildCardOneAsterisk.json] IS with only * result in large query", checkQuery);
		it("[invalid/invalidISInvalidKey.json] IS with invalid key", checkQuery);
		it("[invalid/invalidISInvalidKeyType.json] IS with invalid key type", checkQuery);
		it("[invalid/invalidISNoKey.json] IS with no key", checkQuery);
		it("[invalid/invalidISInvalidValueType.json] IS with invalid value type", checkQuery);

		// NEGATION
		it("[valid/validNOT.json] valid negation", checkQuery);
		it("[valid/validDoubleNOT.json] valid double negation", checkQuery);
		it("[invalid/invalidNOTNoKey.json] empty after NOT", checkQuery);
		it("[invalid/invalidNOTInvalidKey.json] invalid key after NOT", checkQuery);
		it("[invalid/invalidTwoKeysInNOT.json] two keys after NOT", checkQuery);

		// OPTIONS - COLUMNS
		it("[valid/validCOLUMNSOne.json] valid one column", checkQuery);
		it("[valid/validCOLUMNSTwo.json] valid two column", checkQuery);
		it("[valid/validCOLUMNSTwo.json] valid duplicate column keys", checkQuery);
		it("[invalid/invalidCOLUMNSEmptyArray.json] COLUMNS array is empty", checkQuery);
		it("[invalid/invalidCOLUMNSEmptyString.json] COLUMNS array is empty string", checkQuery);
		it("[invalid/invalidCOLUMNSInvalidKey.json] COLUMNS array contains an invalid key", checkQuery);
		it("[invalid/invalidCOLUMNSMultipleDataset.json] COLUMNS querying different datasets", checkQuery);

		// OPTIONS - ORDER
		it("[valid/validORDER.json] Valid ORDER", checkQuery);
		it("[valid/validORDERMoreData.json] Valid ORDER 3000 query data", checkQuery);
		it("[valid/validNoORDER.json] No ORDER operation", checkQuery);
		it("[valid/validNoORDERMoreData.json] No ORDER operation 3000 query data", checkQuery);
		it("[invalid/invalidORDERNotInColumn.json] ORDER key not in COLUMN key list", checkQuery);
		it("[invalid/invalidORDERBlank.json] ORDER key is blank", checkQuery);

		// idstring tests
		it("[invalid/invalidNoDatasetQuery.json] No dataset specified in query", checkQuery);
		it("[invalid/invalidQueryMoreThanOneDataset.json] Query more than 1 dataset", checkQuery);
		it("[invalid/invalidDatasetNotAdded.json] Query dataset does not exist", checkQuery);
		it("[invalid/invalidDatasetCannotBeEmptyString.json] Query dataset cannot be empty string", checkQuery);
		it("[invalid/invalidDatasetCannotBeEmptyString.json] Query dataset additional underscore", checkQuery);

		// Query Key Types - Strings
		it("[valid/uuidValid.json] uuid correct type in query", checkQuery);
		it("[invalid/uuidInvalidType.json] uuid wrong type in query", checkQuery);

		it("[valid/courseIDValid.json] courseID correct type in query", checkQuery);
		it("[invalid/courseIDInvalidType.json] courseID wrong type in query", checkQuery);

		it("[valid/titleValid.json] title correct type in query", checkQuery);
		it("[invalid/titleInvalidType.json] title wrong type in query", checkQuery);

		it("[valid/instructorValid.json] instructor correct type in query", checkQuery);
		it("[invalid/instructorInvalidType.json] instructor wrong type in query", checkQuery);

		it("[valid/deptValid.json] dept correct type in query", checkQuery);
		it("[invalid/deptInvalidType.json] dept wrong type in query", checkQuery);

		// Query Key Types - Numbers
		it("[valid/yearValid.json] year correct type in query", checkQuery);
		it("[valid/yearValid2.json] year 2 correct type in query", checkQuery);
		it("[valid/yearValidUUID.json] year 2 correct type in query with uuid", checkQuery);
		it("[valid/yearValidUUIDOrdered.json] year 2 correct type in query with uuid", checkQuery);
		it("[invalid/yearInvalid.json] year wrong type in query", checkQuery);

		it("[valid/avgValid.json] avg correct type in query", checkQuery);
		it("[invalid/avgInvalid.json] avg wrong type in query", checkQuery);

		it("[valid/passValid.json] pass correct type in query", checkQuery);
		it("[invalid/passInvalid.json] pass wrong type in query", checkQuery);

		it("[valid/failValid.json] fail correct type in query", checkQuery);
		it("[invalid/failInvalid.json] fail wrong type in query", checkQuery);

		it("[valid/auditValid.json] audit correct type in query", checkQuery);
		it("[invalid/auditInvalid.json] audit wrong type in query", checkQuery);

		// Complex Query
		it("[valid/validComplexQueryThreeDeep.json] include AND OR NOT LT GT IS", checkQuery);
	});
});
