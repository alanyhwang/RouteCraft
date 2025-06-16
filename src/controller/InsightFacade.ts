import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { Section, SectionDatasetProcessor } from "./SectionDataProcessor";
import path from "node:path";
import { unlink } from "fs/promises";
import { DATA_DIR } from "../../config";
import { QueryEngine } from "./QueryEngine";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

// wrote implementation and tests with the help of ChatGPT (customized and modified ChatGPT generated templates)
export default class InsightFacade implements IInsightFacade {
	private datasets = new Map<string, Section[]>();
	private sectionProcessor: SectionDatasetProcessor;
	private datasetsLoaded = false;

	constructor() {
		this.sectionProcessor = new SectionDatasetProcessor(this.datasets);
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
			// Handle different dataset kinds
			if (kind === InsightDatasetKind.Sections) {
				// await this.sectionProcessor.init();
				await this.sectionProcessor.processDataset(id, content);
			} else {
				throw new InsightError("Unsupported dataset kind");
			}

			// // Store in memory
			// this.datasets.set(id, processed);

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
		// 1. Validate the ID
		if (!this.isValidId(id)) {
			throw new InsightError("Invalid ID");
		}

		// 2. Check existence in memory
		if (!this.datasets.has(id)) {
			throw new NotFoundError(`Dataset with id '${id}' not found`);
		}

		// 3. Remove from memory
		this.datasets.delete(id);

		// 4. Remove from disk
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

		// 5. Return the ID
		return id;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this.ensureDatasetsLoaded();

		const result: InsightDataset[] = [];

		for (const [id, sections] of this.datasets.entries()) {
			result.push({
				id,
				kind: InsightDatasetKind.Sections, // or whatever kind you store
				numRows: sections.length,
			});
		}

		return result;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if (!this.datasetsLoaded || this.datasets.size === 0) {
			throw new InsightError("No dataset added");
		}

		if (typeof query !== "object" || query === null) {
			throw new InsightError("Query must be non-null object");
		}

		const queryEngine = new QueryEngine(this.datasets);

		const { where, options } = queryEngine.checkQueryValid(query);
		queryEngine.handleOptions(options);
		queryEngine.handleWhere(where);

		return queryEngine.getInsightResult();
	}

	// check for no underscores and checks that if remove whitespaces from ends, length is > 0 (ie at least one char not whitespace)
	private isValidId(id: string): boolean {
		return /^[^_]+$/.test(id) && id.trim().length > 0;
	}

	private async ensureDatasetsLoaded(): Promise<void> {
		if (!this.datasetsLoaded) {
			await this.sectionProcessor.init();
			this.datasetsLoaded = true;
		}
	}
}
