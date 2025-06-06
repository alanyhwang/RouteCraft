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

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {

	});

	describe("removeDataset", function () {

	});

	describe("listDatasets", function () {

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
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
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
		it("[valid/validNoORDER.json] No ORDER operation", checkQuery);
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
