import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import path from "node:path";
import { unlink } from "fs/promises";
import { DATA_DIR } from "../../config";
import { QueryEngine } from "./QueryEngine";
import { DatasetWrapper } from "./DataProcessor";
import { SectionDatasetProcessor } from "./SectionDataProcessor";
import { RoomDatasetProcessor } from "./RoomDataProcessor";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

// wrote implementation and tests with the help of ChatGPT (customized and modified ChatGPT generated templates)
export default class InsightFacade implements IInsightFacade {
	private datasets = new Map<string, DatasetWrapper>();
	private sectionProcessor: SectionDatasetProcessor;
	private roomProcessor: RoomDatasetProcessor;
	private datasetsLoaded = false;

	constructor() {
		this.sectionProcessor = new SectionDatasetProcessor(this.datasets);
		this.roomProcessor = new RoomDatasetProcessor(this.datasets);
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		await this.ensureDatasetsLoaded();

		// Validate ID
		if (!this.isValidId(id)) {
			throw new InsightError("Invalid dataset ID");
		}

		// Check for duplicate
		if (this.datasets.has(id)) {
			throw new InsightError(`Dataset with id '${id}' already exists`);
		}

		try {
			if (kind === InsightDatasetKind.Sections) {
				await this.sectionProcessor.processDataset(id, content);
			} else if (kind === InsightDatasetKind.Rooms) {
				await this.roomProcessor.processDataset(id, content);
			} else {
				throw new InsightError("Unsupported dataset kind");
			}

			// Return all added dataset ids
			return Array.from(this.datasets.keys());
		} catch (e) {
			// Catch any errors from processing/persistence
			if (e instanceof InsightError) {
				throw e;
			}

			// for any errors that weren't insighterrors initially (ie errors from parsing json)
			throw new InsightError("Failed to add dataset: " + e);
		}
	}

	public async removeDataset(id: string): Promise<string> {
		await this.ensureDatasetsLoaded();

		if (!this.isValidId(id)) {
			throw new InsightError("Invalid ID");
		}

		if (!this.datasets.has(id)) {
			throw new NotFoundError(`Dataset with id '${id}' not found`);
		}

		this.datasets.delete(id);

		const filePath = path.join(DATA_DIR, `${id}.json`);
		try {
			await unlink(filePath); // delete the file
		} catch (err: any) {
			// If file doesn't exist, it's fine — we already removed from memory
			// But if any other issue (like permission), throw InsightError
			if (err.code !== "ENOENT") {
				throw new InsightError(`Failed to delete dataset file: ${err.message}`);
			}
		}

		return id;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this.ensureDatasetsLoaded();

		const result: InsightDataset[] = [];

		for (const [id, content] of this.datasets.entries()) {
			result.push({
				id,
				kind: content.kind,
				numRows: content.dataArray.length,
			});
		}

		return result;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// await this.ensureDatasetsLoaded();

		if (!this.datasetsLoaded || this.datasets.size === 0) {
			throw new InsightError("No dataset added");
		}

		if (typeof query !== "object" || query === null) {
			throw new InsightError("Query must be non-null object");
		}

		const queryEngine = new QueryEngine(this.datasets);

		return queryEngine.performQuery(query);
	}

	// check for no underscores and checks that if remove whitespaces from ends, length is > 0 (ie at least one char not whitespace)
	private isValidId(id: string): boolean {
		return /^[^_]+$/.test(id) && id.trim().length > 0;
	}

	private async ensureDatasetsLoaded(): Promise<void> {
		if (!this.datasetsLoaded) {
			await this.sectionProcessor.init();
			await this.roomProcessor.init();
			this.datasetsLoaded = true;
		}
	}
}
