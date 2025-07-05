// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { access, readFile, writeFile, mkdir, readdir } from "fs/promises";
import { constants } from "fs";
import { InsightDatasetKind, InsightError } from "./IInsightFacade";
// import JSZip from "jszip";
import path from "node:path";
import { DATA_DIR } from "../../config";
import { Section } from "./SectionDataProcessor";
// import { Section } from "./SectionDataProcessor";

type DatasetData = Section[]; // | Room[];

export interface DatasetWrapper {
	kind: InsightDatasetKind;
	data: DatasetData;
}

export abstract class DatasetProcessor {
	protected datasetStore: Map<string, DatasetWrapper>;
	protected dataDir: string;

	constructor(datasetStore: Map<string, DatasetWrapper>) {
		this.datasetStore = datasetStore;
		this.dataDir = DATA_DIR;
	}

	public async init(): Promise<void> {
		await this.ensureDir(this.dataDir);
		const files = await readdir(this.dataDir);

		const jsonStr = ".json";

		const loadData = files
			.filter((file) => file.endsWith(jsonStr))
			.map(async (file) => {
				const id = file.slice(0, -jsonStr.length);
				const data = await this.loadFromDisk(id);
				return { id, data };
			});

		const results = await Promise.all(loadData);

		for (const { id, data } of results) {
			if (data) {
				this.datasetStore.set(id, {
					kind: this.datasetKind(),
					data: data,
				});
			}
		}
	}

	protected async ensureDir(dirPath: string): Promise<void> {
		try {
			await mkdir(dirPath, { recursive: true });
		} catch (e) {
			throw new InsightError("Failed to create data directory: " + e);
		}
	}

	protected async saveToDisk(id: string, data: DatasetData): Promise<void> {
		const filePath = path.join(this.dataDir, `${id}.json`);
		const content = JSON.stringify(data, null, 2);
		await writeFile(filePath, content, "utf-8");
	}

	protected async loadFromDisk(id: string): Promise<DatasetData | null> {
		const filePath = path.join(this.dataDir, `${id}.json`);
		try {
			await access(filePath, constants.F_OK);
			const data = await readFile(filePath, "utf-8");
			return JSON.parse(data);
		} catch {
			return null;
		}
	}
	protected abstract datasetKind(): InsightDatasetKind;

	public abstract processDataset(id: string, base64Content: string): Promise<DatasetData>;
}

// protected async ensureDir(): Promise<void> {
// 	try {
// 		await mkdir(this.dataDir, { recursive: true });
// 	} catch (e) {
// 		throw new InsightError(`Failed to create data directory: ${e}`);
// 	}
// }
//
// protected async saveToDisk(id: string, data: T[]): Promise<void> {
// 	const filePath = path.join(this.dataDir, `${id}.json`);
// 	const content = JSON.stringify(data, null, 2);
// 	await writeFile(filePath, content, "utf-8");
// }
//
// protected async loadFromDisk(id: string): Promise<T[] | null> {
// 	const filePath = path.join(this.dataDir, `${id}.json`);
// 	try {
// 		await access(filePath, constants.F_OK);
// 		const data = await readFile(filePath, "utf-8");
// 		return JSON.parse(data);
// 	} catch {
// 		return null;
// 	}
// }
//
// public async init(): Promise<void> {
// 	await this.ensureDir();
// 	const files = await readdir(this.dataDir);
//
// 	for (const file of files) {
// 		if (!file.endsWith(".json")) continue;
//
// 		const id = file.slice(0, -5);
// 		const content = await this.loadFromDisk(id);
// 		if (content) {
// 			this.datasetStore.set(id, {
// 				kind: this.datasetKind(),
// 				data: content,
// 			});
// 		}
// 	}
// }
