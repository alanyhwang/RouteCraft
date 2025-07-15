import { InsightError, InsightResult } from "./IInsightFacade";
import { Section } from "./SectionDataProcessor";
import { DatasetWrapper } from "./DataProcessor";
import { QueryValidator } from "./QueryValidator";
import { LOGICCOMPARISON, MCOMPARISON, NEGATION, SCOMPARISON } from "../constants/QueryConstants";
import { QueryTransformer } from "./QueryTrasnformer";

export class QueryEngine {
	private queryDatasetName = "";
	private queryColumns = new Set<string>();
	private hasOrder = false;
	private queryOrder: string[] = [];
	private orderDirection = "";
	private queryDataset: Section[] = [];
	private passedSections: Section[] = [];
	private passedInsightResult: InsightResult[] = [];
	private queryValidator: QueryValidator;
	private queryTransformer: QueryTransformer;

	constructor(private datasets: Map<string, DatasetWrapper>) {
		this.queryValidator = new QueryValidator(this.datasets);
		this.queryTransformer = new QueryTransformer(this.queryValidator);
	}

	public performQuery(query: unknown): InsightResult[] {
		const queryObject = query as Record<string, unknown>;
		this.queryValidator.validateFirstLevel(queryObject);

		if ("TRANSFORMATIONS" in queryObject) {
			this.handleTransformations(queryObject.TRANSFORMATIONS);
		}
		this.handleOptions(queryObject.OPTIONS);
		this.handleWhere(queryObject.WHERE);
		this.applyTransformations();
		this.queryValidator.validateDatasetSize(this.passedInsightResult.length);

		if (this.hasOrder) {
			this.orderInsightResult();
		}

		return this.getInsightResult();
	}

	private applyTransformations(): void {
		if (this.queryTransformer.hasTransformer()) {
			this.passedInsightResult = this.queryTransformer.transformSections(this.passedSections);
		} else {
			this.passedInsightResult = this.passedSections.map((section) => this.transformSection(section));
		}
		this.queryTransformer.transformToQueriedColumns(this.passedInsightResult, this.queryColumns);
	}

	private handleTransformations(transformations: any): void {
		this.queryTransformer.initializeTransformer(transformations);
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
		this.queryValidator.validateStringArray("COLUMNS", columns);

		columns.forEach((column: string) => {
			const [idString, keyField] = column.split("_");
			if (this.queryTransformer.hasTransformer()) {
				this.queryValidator.columnInTransformer(this.queryTransformer, column, idString);
			} else {
				this.queryValidator.validateIdString(this.queryDatasetName, idString);
			}

			if (column.includes("_")) {
				this.updateQueryDatasetName(idString);
				this.queryValidator.validateKeyField("COLUMNS", keyField);
			}
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
		if (typeof order === "string") {
			this.queryOrder.push(order);
		}
		if (typeof order === "object") {
			const orderObject = order as Record<string, unknown>;
			this.queryValidator.validateOrderObject(order);
			this.handleOrderDir(orderObject.dir);
			this.handleOrderKeys(orderObject.keys);
		}
	}

	private handleOrderDir(dir: any): void {
		this.queryValidator.validateOrderDir(dir);
		this.orderDirection = dir;
	}

	private handleOrderKeys(keys: any): void {
		this.queryValidator.validateOrderKeys(this.queryColumns, keys);
		this.queryOrder = keys;
	}

	private handleWhere(where: any): void {
		this.queryValidator.validateIsObject("WHERE", where);
		this.buildPassedSections(where);
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

	private buildPassedSections(where: any): void {
		const matchesAll = Object.keys(where).length === 0;
		this.passedSections = this.queryDataset.filter(
			(section) => matchesAll || this.sectionPassQuery(where, "Where", section)
		);
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
		const direction = this.orderDirection === "DOWN" ? -1 : 1;

		this.passedInsightResult.sort((a, b) => {
			for (const key of this.queryOrder) {
				const aVal = a[key];
				const bVal = b[key];

				const aIsMissing = aVal === undefined || aVal === null;
				const bIsMissing = bVal === undefined || bVal === null;

				if (aIsMissing && bIsMissing) continue;
				if (aIsMissing) return 1 * direction; // null/undefined goes last in UP, first in DOWN
				if (bIsMissing) return -1 * direction;

				if (typeof aVal === typeof bVal) {
					if (aVal < bVal) return -1 * direction;
					if (aVal > bVal) return 1 * direction;
					// else equal, check next key
				}
			}
			return 0;
		});
	}

	public getInsightResult(): InsightResult[] {
		return this.passedInsightResult;
	}
}
