import { InsightError, InsightResult, ResultTooLargeError } from "./IInsightFacade";
import { Section } from "./SectionDataProcessor";
import { DatasetWrapper } from "./DataProcessor";

export class QueryEngine {
	private readonly MFIELD: string[] = ["avg", "pass", "fail", "audit", "year"];
	private readonly SFIELD: string[] = ["dept", "id", "instructor", "title", "uuid"];
	private readonly LOGICCOMPARISON: string[] = ["AND", "OR"];
	private readonly MCOMPARISON: string[] = ["LT", "GT", "EQ"];
	private readonly SCOMPARISON: string[] = ["IS"];
	private readonly NEGATION: string[] = ["NOT"];
	private readonly MAXRESULT: number = 5000;

	private queryDatasetName: string;
	private queryColumns: string[];
	private hasOrder: boolean;
	private queryOrder: string;
	private datasets: Map<string, DatasetWrapper>;
	private queryDataset: Section[];
	private passedInsightResult: InsightResult[];

	constructor(datasets: Map<string, DatasetWrapper>) {
		this.queryDatasetName = "";
		this.queryColumns = [];
		this.hasOrder = false;
		this.queryOrder = "";
		this.datasets = datasets;
		this.queryDataset = [];
		this.passedInsightResult = [];
	}

	public checkQueryValid(query: unknown): { where: any; options: any } {
		const queryObject = query as Record<string, unknown>;

		if (!("WHERE" in queryObject)) {
			throw new InsightError("Missing WHERE");
		}
		if (!("OPTIONS" in queryObject)) {
			throw new InsightError("Missing OPTIONS");
		}
		if (Object.keys(queryObject).length > 2) {
			throw new InsightError("Excess keys in query");
		}
		return { where: queryObject.WHERE, options: queryObject.OPTIONS };
	}

	public handleOptions(options: unknown): void {
		const optionsObject = options as Record<string, unknown>;
		this.checkOptionsValid(optionsObject);
		this.handleColumns(optionsObject.COLUMNS);
		if (this.hasOrder) {
			this.handleOrder(optionsObject.ORDER);
		}
		this.initializeDatasetSections();
	}

	private initializeDatasetSections(): void {
		const querySections = this.datasets.get(this.queryDatasetName);
		if (querySections) {
			this.queryDataset = querySections.data.map((section: any) => ({ ...section }));
		}
	}

	private checkOptionsValid(options: any): void {
		if (!("COLUMNS" in options)) {
			throw new InsightError("OPTIONS missing COLUMNS");
		}
		if (Object.keys(options).length === 2 && !("ORDER" in options)) {
			throw new InsightError("Invalid keys in OPTIONS");
		}
		if (Object.keys(options).length > 2) {
			throw new InsightError("Excess keys in options");
		}
		if ("ORDER" in options) {
			this.hasOrder = true;
		}
	}

	private handleColumns(columns: unknown): void {
		if (!Array.isArray(columns) || !columns.every((c) => typeof c === "string")) {
			throw new InsightError("COLUMNS must be an array of strings");
		}
		if (columns.length === 0) {
			throw new InsightError("COLUMNS must be a non-empty array");
		}

		columns.forEach((column) => {
			const [idString, keyField] = column.split("_");
			this.handleIdstring(idString);
			if (!this.MFIELD.includes(keyField) && !this.SFIELD.includes(keyField)) {
				throw new InsightError(`invalid key suffix '${keyField}' in COLUMNS`);
			}
			if (!this.queryColumns.includes(column)) {
				this.queryColumns.push(column);
			}
		});
	}

	private handleIdstring(idstring: string): void {
		if (!/^[^_]+$/.test(idstring)) {
			throw new InsightError(`idstring cannot contain underscore`);
		}
		if (this.queryDatasetName !== "" && this.queryDatasetName !== idstring) {
			throw new InsightError("Cannot query more than one dataset");
		}
		if (!this.datasets.has(idstring)) {
			throw new InsightError(`Referenced dataset '${idstring}' not added yet`);
		}
		if (this.queryDatasetName === "") {
			this.queryDatasetName = idstring;
		}
	}

	private handleOrder(order: unknown): void {
		if (!(typeof order === "string")) {
			throw new InsightError("order has to be a string");
		}
		if (!this.queryColumns.includes(order)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
		this.queryOrder = order;
	}

	public handleWhere(where: unknown): void {
		if (typeof where !== "object" || where === null) {
			throw new InsightError("WHERE must be an object");
		}
		this.buildInsightResult(where);

		if (this.hasOrder) {
			this.orderInsightResult();
		}
	}

	public sectionPassQuery(filter: any, parentName: string, section: Section): boolean {
		if (typeof filter !== "object" || filter === null) {
			throw new InsightError("filter must be non null object");
		}

		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			throw new InsightError(`'${parentName}' should only have 1 key, has '${keys.length}'`);
		}
		const filterName = keys[0];
		const content = (filter as Record<string, unknown>)[filterName];

		if (this.LOGICCOMPARISON.includes(filterName)) {
			return this.applyLogicComparison(content, filterName, section);
		} else if (this.MCOMPARISON.includes(filterName)) {
			return this.applyMComparison(content, filterName, section);
		} else if (this.SCOMPARISON.includes(filterName)) {
			return this.applySComparison(content, filterName, section);
		} else if (this.NEGATION.includes(filterName)) {
			return !this.sectionPassQuery(content, filterName, section);
		} else {
			throw new InsightError(`Invalid filter key: '${filterName}'`);
		}
	}

	private applyLogicComparison(content: unknown, filterName: string, section: Section): boolean {
		if (!Array.isArray(content) || content.length === 0) {
			throw new InsightError(`${filterName} must be a non-empty array`);
		}
		if (filterName === "AND") {
			return content.every((filter: any) => this.sectionPassQuery(filter, "AND", section));
		} else {
			return content.some((filter: any) => this.sectionPassQuery(filter, "OR", section));
		}
	}

	public applyMComparison(mComparator: any, comparatorName: string, section: Section): boolean {
		this.checkValidMComparator(mComparator, comparatorName);
		if (comparatorName === "LT") {
			return this.checkLT(mComparator, section);
		} else if (comparatorName === "GT") {
			return this.checkGT(mComparator, section);
		} else if (comparatorName === "EQ") {
			return this.checkEQ(mComparator, section);
		} else {
			throw new InsightError(`Invalid filter key: '${comparatorName}' `);
		}
	}

	private checkValidMComparator(mComparator: any, comparatorName: string): void {
		if (typeof mComparator !== "object" || mComparator === null || Array.isArray(mComparator)) {
			throw new InsightError("IS comparator must be a non-null object");
		}

		const key = Object.keys(mComparator)[0];
		const [idString, mKey] = key.split("_");
		this.handleIdstring(idString);

		if (!this.MFIELD.includes(mKey)) {
			throw new InsightError(`Invalid key: '${key}' in '${comparatorName}'`);
		}

		if (typeof mComparator[key] !== "number") {
			throw new InsightError(`Invalid type in '${comparatorName}', should be number`);
		}
	}

	private checkLT(mComparator: any, section: Section): boolean {
		const { sectionVal, comparatorVal } = this.extractValues(mComparator, section);
		return sectionVal < comparatorVal;
	}

	private checkGT(mComparator: any, section: Section): boolean {
		const { sectionVal, comparatorVal } = this.extractValues(mComparator, section);
		return sectionVal > comparatorVal;
	}

	private checkEQ(mComparator: any, section: Section): boolean {
		const { sectionVal, comparatorVal } = this.extractValues(mComparator, section);
		return sectionVal === comparatorVal;
	}

	private extractValues(mComparator: any, section: Section): { sectionVal: number; comparatorVal: number } {
		const key = Object.keys(mComparator)[0];
		const [, mField] = key.split("_");
		const sectionVal = section[mField as keyof Section] as number;
		const comparatorVal = mComparator[key] as number;
		return { sectionVal, comparatorVal };
	}

	public applySComparison(sComparator: any, comparatorName: string, section: Section): boolean {
		this.checkValidSComparator(sComparator, comparatorName);
		const sKey = Object.keys(sComparator)[0];
		const [, sField] = sKey.split("_");
		const value = Object.values(sComparator)[0] as string;
		if (value.startsWith("*") && value.endsWith("*")) {
			return this.containsValue(sField, value, section);
		} else if (value.startsWith("*")) {
			return this.endsWithValue(sField, value, section);
		} else if (value.endsWith("*")) {
			return this.startsWithValue(sField, value, section);
		} else {
			return (section[sField as keyof Section] as string) === value;
		}
	}

	private checkValidSComparator(sComparator: any, comparatorName: string): void {
		if (typeof sComparator !== "object" || sComparator === null || Array.isArray(sComparator)) {
			throw new InsightError("IS comparator must be a non-null object");
		}

		if (Object.keys(sComparator).length !== 1) {
			throw new InsightError(`IS should only have 1 key`);
		}

		const key = Object.keys(sComparator)[0];
		const [idString, sKey] = key.split("_");
		this.handleIdstring(idString);

		if (!this.SFIELD.includes(sKey)) {
			throw new InsightError(`Invalid key: '${key}' in '${comparatorName}'`);
		}

		if (typeof sComparator[key] !== "string") {
			throw new InsightError("Invalid value type in IS, should be non-empty string");
		}

		const inputString = sComparator[key] as string;
		this.handleInputString(inputString);
	}

	private containsValue(sField: string, value: string, section: Section): boolean {
		const cleanedValue = value.replace(/\*/g, "");
		const sectionVal = section[sField as keyof Section] as string;
		return sectionVal.includes(cleanedValue);
	}

	private endsWithValue(sField: string, value: string, section: Section): boolean {
		const cleanedValue = value.replace(/\*/g, "");
		const sectionVal = section[sField as keyof Section] as string;
		return sectionVal.endsWith(cleanedValue);
	}

	private startsWithValue(sField: string, value: string, section: Section): boolean {
		const cleanedValue = value.replace(/\*/g, "");
		const sectionVal = section[sField as keyof Section] as string;
		return sectionVal.startsWith(cleanedValue);
	}

	// private matchesValue(sField: string, value: string, section: Section): boolean {
	// 	const sectionVal = section[sField as keyof Section] as string;
	// 	return value === sectionVal;
	// }

	private handleInputString(inputString: string): void {
		if (!/^\*?[^*]*\*?$/.test(inputString)) {
			throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
		}
	}

	private buildInsightResult(where: any): void {
		if (Object.keys(where).length === 0) {
			if (this.queryDataset.length > this.MAXRESULT) {
				throw new ResultTooLargeError(
					"The result is too big. Only queries with a maximum of 5000 results are supported. "
				);
			}

			for (const section of this.queryDataset) {
				const transformedSection = this.transformSection(section);
				this.passedInsightResult.push(transformedSection);
			}
		}

		for (const section of this.queryDataset) {
			if (this.sectionPassQuery(where, "WHERE", section)) {
				const transformedSection = this.transformSection(section);
				this.passedInsightResult.push(transformedSection);
			}
		}

		if (this.passedInsightResult.length > this.MAXRESULT) {
			throw new ResultTooLargeError(
				"The result is too big. Only queries with a maximum of 5000 results are supported. "
			);
		}
	}

	private transformSection(section: Section): InsightResult {
		const result: InsightResult = {};

		this.queryColumns.forEach((column) => {
			const [, keyField] = column.split("_");
			result[column] = section[keyField as keyof Section];
		});

		return result;
	}

	private orderInsightResult(): void {
		this.passedInsightResult.sort((a, b) => {
			const aVal = a[this.queryOrder] as number | string;
			const bVal = b[this.queryOrder] as number | string;

			if (typeof aVal === "number" && typeof bVal === "number") {
				return aVal - bVal;
			} else {
				return String(aVal).localeCompare(String(bVal));
			}
		});
	}

	public getInsightResult(): InsightResult[] {
		return this.passedInsightResult;
	}
}
