import { InsightError, InsightResult } from "./IInsightFacade";
import { Section } from "./SectionDataProcessor";
import { DatasetWrapper } from "./DataProcessor";
import { QueryValidator } from "./QueryValidator";
import { LOGICCOMPARISON, MCOMPARISON, NEGATION, SCOMPARISON } from "../utils/QueryConstants";

export class QueryEngine {
	private queryDatasetName: string;
	private queryColumns: Set<string>;
	private hasOrder: boolean;
	private queryOrder: string;
	private datasets: Map<string, DatasetWrapper>;
	private queryDataset: Section[];
	private passedInsightResult: InsightResult[];
	private queryValidator: QueryValidator;

	constructor(datasets: Map<string, DatasetWrapper>) {
		this.queryDatasetName = "";
		this.queryColumns = new Set();
		this.hasOrder = false;
		this.queryOrder = "";
		this.datasets = datasets;
		this.queryDataset = [];
		this.passedInsightResult = [];
		this.queryValidator = new QueryValidator(this.datasets);
	}

	public makeQuery(query: unknown): void {
		const queryObject = query as Record<string, unknown>;
		this.queryValidator.validateFirstLevel(queryObject);
		this.handleOptions(queryObject.OPTIONS);
		this.handleWhere(queryObject.WHERE);
	}

	private handleOptions(options: any): void {
		const optionsObject = options as Record<string, unknown>;
		this.queryValidator.validateOptions(optionsObject);

		if ("ORDER" in optionsObject) {
			this.hasOrder = true;
		}

		this.handleColumns(optionsObject.COLUMNS);
		if (this.hasOrder) {
			this.handleOrder(optionsObject.ORDER);
		}
		this.initializeDatasetSections();
	}

	private initializeDatasetSections(): void {
		const querySections = this.datasets.get(this.queryDatasetName);
		if (querySections) {
			this.queryDataset = querySections.dataArray.map((section: any) => ({ ...section }));
		}
	}

	private handleColumns(columns: any): void {
		this.queryValidator.validateColumns(columns);

		columns.forEach((column: string) => {
			const [idString, keyField] = column.split("_");
			this.queryValidator.validateIdString(this.queryDatasetName, idString);
			this.updateQueryDatasetName(idString);
			this.queryValidator.validateColumnKeyField(keyField);
			this.queryColumns.add(column);
		});
	}

	private updateQueryDatasetName(idString: string): void {
		if (this.queryDatasetName === "") {
			this.queryDatasetName = idString;
		}
	}

	private handleOrder(order: any): void {
		this.queryValidator.validateOrder(this.queryColumns, order);
		this.queryOrder = order;
	}

	private handleWhere(where: any): void {
		this.queryValidator.validateIsObject("WHERE", where);
		this.buildInsightResult(where);

		if (this.hasOrder) {
			this.orderInsightResult();
		}
	}

	private sectionPassQuery(filter: any, parentName: string, section: Section): boolean {
		this.queryValidator.validateSectionPassQuery(filter, parentName);
		const keys = Object.keys(filter);
		const filterName = keys[0];
		const content = (filter as Record<string, unknown>)[filterName];

		if (LOGICCOMPARISON.includes(filterName)) {
			return this.applyLogicComparison(content, filterName, section);
		} else if (MCOMPARISON.includes(filterName)) {
			return this.applyMComparison(content, filterName, section);
		} else if (SCOMPARISON.includes(filterName)) {
			return this.applySComparison(content, filterName, section);
		} else if (NEGATION.includes(filterName)) {
			return !this.sectionPassQuery(content, filterName, section);
		} else {
			throw new InsightError(`Invalid filter key: '${filterName}'`);
		}
	}

	private applyLogicComparison(content: any, filterName: string, section: Section): boolean {
		this.queryValidator.validateArrayNonEmpty(filterName, content);
		if (filterName === "AND") {
			return content.every((filter: any) => this.sectionPassQuery(filter, "AND", section));
		} else {
			return content.some((filter: any) => this.sectionPassQuery(filter, "OR", section));
		}
	}

	private applyMComparison(mComparator: any, comparatorName: string, section: Section): boolean {
		this.queryValidator.validateMComparator(mComparator, comparatorName, this.queryDatasetName);
		const key = Object.keys(mComparator)[0];
		const [idString] = key.split("_");
		this.updateQueryDatasetName(idString);
		const { sectionVal, comparatorVal } = this.extractValues(mComparator, section);

		if (comparatorName === "LT") {
			return sectionVal < comparatorVal;
		} else if (comparatorName === "GT") {
			return sectionVal > comparatorVal;
		} else if (comparatorName === "EQ") {
			return sectionVal === comparatorVal;
		} else {
			throw new InsightError(`Invalid filter key: '${comparatorName}' `);
		}
	}

	private extractValues(mComparator: any, section: Section): { sectionVal: number; comparatorVal: number } {
		const key = Object.keys(mComparator)[0];
		const [, mField] = key.split("_");
		const sectionVal = section[mField as keyof Section] as number;
		const comparatorVal = mComparator[key] as number;
		return { sectionVal, comparatorVal };
	}

	private applySComparison(sComparator: any, comparatorName: string, section: Section): boolean {
		this.queryValidator.checkValidSComparator(sComparator, comparatorName, this.queryDatasetName);
		const sKey = Object.keys(sComparator)[0];
		const [idString, sField] = sKey.split("_");
		this.updateQueryDatasetName(idString);
		const value = Object.values(sComparator)[0] as string;
		const sectionVal = section[sField as keyof Section] as string;
		const cleanedValue = value.replace(/\*/g, "");

		if (value.startsWith("*") && value.endsWith("*")) {
			return sectionVal.includes(cleanedValue);
		} else if (value.startsWith("*")) {
			return sectionVal.endsWith(cleanedValue);
		} else if (value.endsWith("*")) {
			return sectionVal.startsWith(cleanedValue);
		} else {
			return value === sectionVal;
		}
	}

	private buildInsightResult(where: any): void {
		const matchesAll = Object.keys(where).length === 0;
		const matchingSections = this.queryDataset.filter(
			(section) => matchesAll || this.sectionPassQuery(where, "Where", section)
		);

		this.queryValidator.validateDatasetSize(matchingSections.length);
		this.passedInsightResult = matchingSections.map((section) => this.transformSection(section));
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
