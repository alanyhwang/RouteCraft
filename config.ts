import path from "path";

export const DATA_DIR = path.resolve(__dirname, "data");

export const HTM_DIR = path.resolve(__dirname, "test/resources/fixtures/");

export const GEO_ENDPOINT = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team014/";

export const idAndKindDatasetParams = "/dataset/:id/:kind";

export const idDatasetParam = "/dataset/:id";

export const queryParam = "/query";

export const datasetsParam = "/datasets";

export const ARCHIVES_DIR = path.resolve(__dirname, "test/resources/archives/");
