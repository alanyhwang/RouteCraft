import { InsightError, ResultTooLargeError } from "./IInsightFacade";
import { DatasetWrapper } from "./DataProcessor";
import { MAXRESULT, MFIELD, SFIELD } from "../utils/QueryConstants";

export class QueryValidator {
	private datasets: Map<string, DatasetWrapper>;

	constructor(datasets: Map<string, DatasetWrapper>) {
		this.datasets = datasets;
	}

	public validateFirstLevel(queryObject: Record<string, unknown>): void {
		if (!("WHERE" in queryObject)) {
			throw new InsightError("Missing WHERE");
		}
		if (!("OPTIONS" in queryObject)) {
			throw new InsightError("Missing OPTIONS");
		}
		if (Object.keys(queryObject).length > 2) {
			throw new InsightError("Excess keys in query");
		}
	}

	public validateOptions(optionsObject: Record<string, unknown>): void {
		if (!("COLUMNS" in optionsObject)) {
			throw new InsightError("OPTIONS missing COLUMNS");
		}
		if (Object.keys(optionsObject).length === 2 && !("ORDER" in optionsObject)) {
			throw new InsightError("Invalid keys in OPTIONS");
		}
		if (Object.keys(optionsObject).length > 2) {
			throw new InsightError("Excess keys in options");
		}
	}

	public validateColumns(columns: unknown): void {
		if (!Array.isArray(columns) || !columns.every((c) => typeof c === "string")) {
			throw new InsightError("COLUMNS must be an array of strings");
		}
		this.validateArrayNonEmpty("COLUMNS", columns);
	}

	public validateArrayNonEmpty(name: string, array: any): void {
		if (!Array.isArray(array) || array.length === 0) {
			throw new InsightError(`${name} must be a non-empty array`);
		}
	}

	public validateIdString(queryDatasetName: string, idString: string): void {
		if (!/^[^_]+$/.test(idString)) {
			throw new InsightError(`idstring cannot contain underscore`);
		}
		if (queryDatasetName !== "" && queryDatasetName !== idString) {
			throw new InsightError("Cannot query more than one dataset");
		}
		if (!this.datasets.has(idString)) {
			throw new InsightError(`Referenced dataset '${idString}' not added yet`);
		}
	}

	public validateColumnKeyField(keyField: string): void {
		if (!MFIELD.includes(keyField) && !SFIELD.includes(keyField)) {
			throw new InsightError(`invalid key suffix '${keyField}' in COLUMNS`);
		}
	}

	public validateOrder(queryColumns: Set<string>, order: any): void {
		if (!(typeof order === "string")) {
			throw new InsightError("order has to be a string");
		}
		if (!queryColumns.has(order)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
	}

	public validateIsObject(name: string, object: any): void {
		if (typeof object !== "object" || object === null) {
			throw new InsightError(`${name} must be an object`);
		}
	}

	public validateSectionPassQuery(filter: any, parentName: string): void {
		this.validateIsObject("filter", filter);
		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			throw new InsightError(`'${parentName}' should only have 1 key, has '${keys.length}'`);
		}
	}

	public validateMComparator(mComparator: any, comparatorName: string, queryDatasetName: string): void {
		if (typeof mComparator !== "object" || mComparator === null || Array.isArray(mComparator)) {
			throw new InsightError("IS comparator must be a non-null object");
		}

		const key = Object.keys(mComparator)[0];
		const [idString, mKey] = key.split("_");
		this.validateIdString(queryDatasetName, idString);

		if (!MFIELD.includes(mKey)) {
			throw new InsightError(`Invalid key: '${key}' in '${comparatorName}'`);
		}

		if (typeof mComparator[key] !== "number") {
			throw new InsightError(`Invalid type in '${comparatorName}', should be number`);
		}
	}

	public checkValidSComparator(sComparator: any, comparatorName: string, queryDatasetName: string): void {
		if (typeof sComparator !== "object" || sComparator === null || Array.isArray(sComparator)) {
			throw new InsightError("IS comparator must be a non-null object");
		}

		if (Object.keys(sComparator).length !== 1) {
			throw new InsightError(`IS should only have 1 key`);
		}

		const key = Object.keys(sComparator)[0];
		const [idString, sKey] = key.split("_");
		this.validateIdString(queryDatasetName, idString);

		if (!SFIELD.includes(sKey)) {
			throw new InsightError(`Invalid key: '${key}' in '${comparatorName}'`);
		}

		if (typeof sComparator[key] !== "string") {
			throw new InsightError("Invalid value type in IS, should be non-empty string");
		}

		const inputString = sComparator[key] as string;
		this.handleInputString(inputString);
	}

	private handleInputString(inputString: string): void {
		if (!/^\*?[^*]*\*?$/.test(inputString)) {
			throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
		}
	}

	public validateDatasetSize(datasetSize: number): void {
		if (datasetSize > MAXRESULT) {
			throw new ResultTooLargeError(
				"The result is too big. Only queries with a maximum of 5000 results are supported. "
			);
		}
	}
}
