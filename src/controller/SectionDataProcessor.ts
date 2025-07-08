// file created with the help of ChatGPT (customized and modified ChatGPT generated templates)

import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import JSZip from "jszip";
import { DatasetProcessor } from "./DataProcessor";

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

export class SectionDatasetProcessor extends DatasetProcessor {
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

		const allSections = await this.resolveAndFlatten<Section>(coursePromises, "No valid sections found");

		const transformedSections = allSections.map((section: any) => this.transformSection(section));

		this.storeDataset(id, transformedSections);

		await this.saveToDisk(id, transformedSections);

		return transformedSections;
	}

	protected datasetKind(): InsightDatasetKind {
		return InsightDatasetKind.Sections;
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
}
