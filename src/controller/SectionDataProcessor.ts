// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { access, readFile, writeFile, mkdir, readdir } from "fs/promises";
import { constants } from "fs";
import { InsightError } from "./IInsightFacade";
import JSZip from "jszip";
import path from "node:path";
import { DATA_DIR } from "../../config";

export interface Section {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

export class SectionDatasetProcessor {
	// readonly so these variables never re-initialized to something else
	private readonly datasetStore: Map<string, Section[]>;
	private readonly dataDir: string;

	// The valid dataset files must be saved to the <PROJECT_DIR>/data directory.
	constructor(datasetStore: Map<string, Section[]>) {
		this.datasetStore = datasetStore;
		this.dataDir = DATA_DIR;
	}

	public async init(): Promise<void> {
		await this.ensureDir(this.dataDir);
		const files = await readdir(this.dataDir);

		const jsonStr = ".json";

		const loadSections = files
			.filter((file) => file.endsWith(jsonStr))
			.map(async (file) => {
				const id = file.slice(0, -jsonStr.length);
				const sections = await this.loadFromDisk(id);
				return { id, sections };
			});

		const results = await Promise.all(loadSections);

		for (const { id, sections } of results) {
			if (sections) {
				this.datasetStore.set(id, sections);
			}
		}
	}

	public async processDataset(id: string, base64Content: string): Promise<Section[]> {
		// loadasync will throw already if base64content isn't base64 or zip ifle
		const zip = await JSZip.loadAsync(base64Content, { base64: true });

		// Ensure there is at least one file under "courses/"
		const hasCoursesFolder = Object.keys(zip.files).some((filename) => filename.startsWith("courses/"));

		if (!hasCoursesFolder) {
			throw new InsightError("Missing 'courses' folder in zip");
		}

		const folder = zip.folder("courses")!;

		// folder.files -> object from JSZip where each key is a file path (ie. courses/123.json), value is JSZip Object
		// Object.values converts object -> keeps just the JSZip Objects
		// map -> take each of those JSZip Objects (called file) and does what's inside the {}
		const coursePromises = Object.values(folder.files).map(async (file) => {
			// asynchronously read and decode file content as UTF-8 string
			const fileContent = await file.async("text");

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				return [];
			}

			// if data is null or undefined, if data isn't an object, if data.result isn't an array (also checking then if data.result is null or undefined)
			// or if data.result is empty, then return empty array
			if (!data || typeof data !== "object" || !Array.isArray(data.result) || data.result.length === 0) {
				return [];
			}

			return data.result;
		});

		// get an array of arrays (cause promise.all returns an array, and in that array
		// could be the results from each of the courses (which are also in an array form)
		const courseSections = await Promise.all(coursePromises);

		// combining the array of arrays into one array (so each entry is from a section)
		const allSections = courseSections.flat();

		if (allSections.length === 0) {
			throw new InsightError("No valid sections found in dataset");
		}

		const transformedSections = allSections.map((section: any) => this.transformSection(section));

		this.datasetStore.set(id, transformedSections);
		await this.saveToDisk(id, transformedSections);

		return transformedSections;
	}

	private async ensureDir(dirPath: string): Promise<void> {
		try {
			await mkdir(dirPath, { recursive: true });
		} catch (e) {
			throw new InsightError("Failed to create data directory: " + e);
		}
	}

	private transformSection(section: any): Section {
		const defaultYear = 1900;
		return {
			uuid: String(section.id),
			id: section.Course,
			title: section.Title,
			instructor: section.Professor,
			dept: section.Subject,
			year: section.Section === "overall" ? defaultYear : Number(section.Year),
			avg: section.Avg,
			pass: section.Pass,
			fail: section.Fail,
			audit: section.Audit,
		};
	}

	private async saveToDisk(id: string, sections: Section[]): Promise<void> {
		const filePath = path.join(this.dataDir, `${id}.json`);
		const content = JSON.stringify(sections, null, 2);
		await writeFile(filePath, content, "utf-8");
	}

	private async loadFromDisk(id: string): Promise<Section[] | null> {
		const filePath = path.join(this.dataDir, `${id}.json`);
		try {
			await access(filePath, constants.F_OK);
			const data = await readFile(filePath, "utf-8");
			return JSON.parse(data);
		} catch {
			return null;
		}
	}
}
