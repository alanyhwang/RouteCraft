import { InsightError, ResultTooLargeError } from "./IInsightFacade";
import { DatasetWrapper } from "./DataProcessor";
import { APPLYTOKENS, DIRECTION, MAXRESULT, MFIELD, SFIELD } from "../constants/QueryConstants";
import { QueryTransformer } from "./QueryTrasnformer";

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
		if (!("TRANSFORMATIONS" in queryObject) && Object.keys(queryObject).length > 2) {
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

	public validateStringArray(name: string, object: unknown): void {
		this.validateArrayNonEmpty(name, object);
		if (!Array.isArray(object) || !object.every((c) => typeof c === "string")) {
			throw new InsightError(`${name} must be an array of strings`);
		}
	}

	public validateArrayNonEmpty(name: string, object: unknown): void {
		if (!Array.isArray(object) || object.length === 0) {
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

	public validateKeyField(name: string, keyField: string): void {
		if (!MFIELD.includes(keyField) && !SFIELD.includes(keyField)) {
			throw new InsightError(`invalid key '${keyField}' in '${name}'`);
		}
	}

	public validateOrder(queryColumns: Set<string>, order: any): void {
		if (typeof order !== "string" && typeof order !== "object") {
			throw new InsightError("order has to be a string or object");
		}
		if (typeof order === "string" && !queryColumns.has(order)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
	}

	public validateOrderObject(order: any): void {
		if (!("dir" in order)) {
			throw new InsightError("ORDER is missing dir key");
		}
		if (!("keys" in order)) {
			throw new InsightError("ORDER is missing keys key");
		}
	}

	public validateOrderDir(dir: any): void {
		if (typeof dir !== "string") {
			throw new InsightError("dir should be a string");
		}
		if (!DIRECTION.includes(dir)) {
			throw new InsightError("dir is not a valid direction");
		}
	}

	public validateOrderKeys(queryColumns: Set<string>, keys: any): void {
		if (!Array.isArray(keys) || !keys.every((c) => typeof c === "string")) {
			throw new InsightError("ORDER Keys must be an array of strings");
		}
		this.validateArrayNonEmpty("keys", keys);
		for (const key of keys) {
			if (!queryColumns.has(key)) {
				throw new InsightError("ORDER Keys should also be in COLUMN");
			}
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

	public validateTransformation(transformation: Record<string, unknown>): void {
		if (!("GROUP" in transformation)) {
			throw new InsightError("TRANSFORMATION is missing GROUP key");
		}
		if (!("APPLY" in transformation)) {
			throw new InsightError("TRANSFORMATION is missing APPLY key");
		}
	}

	public validateApply(apply: any): void {
		if (!Array.isArray(apply)) {
			throw new InsightError("APPLY must be an array");
		}
	}

	public validateApplyItem(queryDatasetName: string, item: any): void {
		if (typeof item !== "object" || item === null || Array.isArray(item)) {
			throw new InsightError("Each item in APPLY must be a non-null object");
		}

		const keys = Object.keys(item);
		if (keys.length !== 1) {
			throw new InsightError("Each object in APPLY must have exactly one key");
		}

		if (!/^[^_]+$/.test(keys[0])) {
			throw new InsightError(`applyKey cannot contain underscore`);
		}

		const applyRuleValue = item[keys[0]];
		if (typeof applyRuleValue !== "object" || applyRuleValue === null || Array.isArray(applyRuleValue)) {
			throw new InsightError("The value of each APPLY key must be a non-null object");
		}

		const innerKeys = Object.keys(applyRuleValue);
		if (innerKeys.length !== 1) {
			throw new InsightError("Each APPLY rule must specify exactly one aggregation operator");
		}
		if (!APPLYTOKENS.includes(innerKeys[0])) {
			throw new InsightError("Aggregation operator does not exist");
		}

		const queryString = applyRuleValue[innerKeys[0]];
		if (typeof queryString !== "string") {
			throw new InsightError("Aggregation field must be a string");
		}
		const [idString, keyField] = queryString.split("_");
		this.validateIdString(queryDatasetName, idString);
		this.validateKeyField("APPLY", keyField);
	}

	public columnInTransformer(queryTransformer: QueryTransformer, column: string, idString: string): void {
		const transformerGroups = queryTransformer.getGroups();
		const transformerApplyKeys = queryTransformer.getApplyKeys();
		const transformerDatasetName = queryTransformer.getQueryDatasetName();
		if (!transformerGroups.has(column) && !transformerApplyKeys.has(column)) {
			throw new InsightError(`Invalid key ${column} in COLUMNS`);
		}
		if (transformerDatasetName !== idString && column.includes("_")) {
			throw new InsightError(`Cannot query more than one dataset`);
		}
	}

	public validateOperationKey(operator: string, key: any): void {
		if (operator === "COUNT") {
			if (!MFIELD.includes(key) && !SFIELD.includes(key)) {
				throw new InsightError(`${operator} operator does not have valid key`);
			}
		} else {
			if (!MFIELD.includes(key)) {
				throw new InsightError(`${operator} operator cannot have keys that are strings`);
			}
		}
	}
}
