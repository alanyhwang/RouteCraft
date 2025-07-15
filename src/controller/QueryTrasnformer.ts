import { QueryValidator } from "./QueryValidator";
import { InsightError, InsightResult } from "./IInsightFacade";
import { Section } from "./SectionDataProcessor";
import Decimal from "decimal.js";

export class QueryTransformer {
	private transformerExist: boolean = false;
	private groups = new Set<string>();
	private applyKeys = new Map<string, {}>();
	private queryDatasetName: string = "";
	private queryValidator: QueryValidator;

	constructor(queryValidator: QueryValidator) {
		this.queryValidator = queryValidator;
	}

	public initializeTransformer(transformation: any): void {
		this.transformerExist = true;
		const transformationObject = transformation as Record<string, unknown>;
		this.queryValidator.validateTransformation(transformationObject);
		this.handleGroup(transformationObject.GROUP);
		this.handleApply(transformationObject.APPLY);
	}

	private handleGroup(group: any): void {
		this.queryValidator.validateStringArray("GROUP", group);

		group.forEach((key: string) => {
			const [idString, keyField] = key.split("_");
			this.queryValidator.validateIdString(this.queryDatasetName, idString);
			if (this.queryDatasetName === "") {
				this.queryDatasetName = idString;
			}
			this.queryValidator.validateKeyField("GROUP", keyField);
			this.groups.add(key);
		});
	}

	private handleApply(apply: any): void {
		this.queryValidator.validateApply(apply);
		for (const item of apply) {
			this.queryValidator.validateApplyItem(this.queryDatasetName, item);
			const keys = Object.keys(item);
			if (this.applyKeys.has(keys[0])) {
				throw new InsightError(`Duplicate APPLY key ${keys[0]}`);
			}
			this.applyKeys.set(keys[0], item[keys[0]]);
		}
	}

	public transformSections(inputSections: Section[]): InsightResult[] {
		const resultGroups = this.groupResults(inputSections);
		const output: InsightResult[] = [];

		for (const [stringifiedGroup, sections] of resultGroups) {
			const groupKey: Partial<Section> = JSON.parse(stringifiedGroup);
			const transformed: InsightResult = { ...groupKey };
			let validGroup = true;

			for (const [applyKey, applyKeyObject] of this.applyKeys) {
				const operator = Object.keys(applyKeyObject)[0];
				const fullKey = Object.values(applyKeyObject)[0];
				if (typeof fullKey !== "string") {
					throw new InsightError("fullKey must be a string");
				}
				const [, operateOnKey] = fullKey.split("_");

				const value = this.performOperation(operator, operateOnKey, sections);
				if (value === null || value === undefined) {
					validGroup = false;
					break;
				}
				transformed[applyKey] = value;
			}
			if (validGroup) {
				output.push(transformed);
			}
		}
		return output;
	}

	private performOperation(operator: string, operateOnKey: any, sections: Section[]): number | null {
		this.queryValidator.validateOperationKey(operator, operateOnKey);
		let result = null;
		switch (operator) {
			case "MAX":
				result = this.performMaxOperation(operateOnKey, sections);
				break;
			case "MIN":
				result = this.performMinOperation(operateOnKey, sections);
				break;
			case "AVG":
				result = this.performAvgOperation(operateOnKey, sections);
				break;
			case "SUM":
				result = this.performSumOperation(operateOnKey, sections);
				break;
			case "COUNT":
				result = this.performCountOperation(operateOnKey, sections);
				break;
			default:
				throw new InsightError("No operator found");
		}
		return result;
	}

	private performMaxOperation(key: string, sections: Section[]): number | null {
		let max: number | null = null;

		for (const section of sections) {
			const value = section[key as keyof Section];

			if (typeof value === "number" && (max === null || value > max)) {
				max = value;
			}
		}

		return max;
	}

	private performMinOperation(key: string, sections: Section[]): number | null {
		let min: number | null = null;

		for (const section of sections) {
			const value = section[key as keyof Section];

			if (typeof value === "number" && (min === null || value < min)) {
				min = value;
			}
		}

		return min;
	}

	private performAvgOperation(key: string, sections: Section[]): number | null {
		let sum = new Decimal(0);
		let numRows: number | null = null;
		let res: number | null = null;

		for (const section of sections) {
			const value = section[key as keyof Section];
			if (value !== null && value !== undefined && typeof value === "number") {
				const convertedValue = new Decimal(value);
				if (numRows === null) {
					numRows = 1;
				} else {
					numRows++;
				}
				sum = sum.add(convertedValue);
			}
		}
		if (numRows !== null) {
			const avg = sum.toNumber() / numRows;
			res = Number(avg.toFixed(2));
		}
		return res;
	}

	private performSumOperation(key: string, sections: Section[]): number | null {
		let sum = new Decimal(0);
		let hasValid = false;

		for (const section of sections) {
			const value = section[key as keyof Section];
			if (value !== null && value !== undefined && typeof value === "number") {
				sum = sum.add(new Decimal(value));
				hasValid = true;
			}
		}

		if (!hasValid) {
			return null;
		}

		return Number(sum.toFixed(2));
	}

	private performCountOperation(key: string, sections: Section[]): number | null {
		const seen = new Set<unknown>();

		for (const section of sections) {
			const value = section[key as keyof Section];
			if (value !== null && value !== undefined) {
				seen.add(value);
			}
		}

		return seen.size;
	}

	private groupResults(inputSections: Section[]): Map<string, Section[]> {
		const resultGroups = new Map<string, Section[]>();
		for (const item of inputSections) {
			const partialItem = this.pickFields(item, this.groups);
			const key: string = JSON.stringify(partialItem);
			if (!resultGroups.has(key)) {
				resultGroups.set(key, []);
			}
			resultGroups.get(key)!.push(item);
		}

		return resultGroups;
	}

	private pickFields(data: Section, keys: Set<string>): Partial<Section> {
		const newSection: Partial<Section> = {};
		keys.forEach((key) => {
			const [, field] = key.split("_");
			(newSection as any)[key] = data[field as keyof Section];
		});
		return newSection;
	}

	public transformToQueriedColumns(result: InsightResult[], columns: Set<string>): void {
		for (let i = 0; i < result.length; i++) {
			const row = result[i];
			const filteredRow: InsightResult = {};

			for (const key of columns) {
				if (key in row) {
					filteredRow[key] = row[key];
				}
			}

			result[i] = filteredRow;
		}
	}

	public getGroups(): Set<string> {
		return this.groups;
	}

	public getApplyKeys(): Map<string, {}> {
		return this.applyKeys;
	}

	public getQueryDatasetName(): string {
		return this.queryDatasetName;
	}

	public hasTransformer(): boolean {
		return this.transformerExist;
	}
}
