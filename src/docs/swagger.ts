import path from "node:path";
import YAML from "yamljs";

type OpenApiPaths = Record<string, unknown>;
type OpenApiDoc = {
  openapi?: string;
  info?: unknown;
  paths?: OpenApiPaths;
  components?: Record<string, unknown>;
  tags?: unknown[];
};

const DOCS_DIR = path.resolve(__dirname);

const loadYaml = (file: string): OpenApiDoc =>
  YAML.load(path.join(DOCS_DIR, file)) as OpenApiDoc;

const docs: OpenApiDoc[] = [
  loadYaml("auth.yaml"),
  loadYaml("users.yaml"),
  loadYaml("preRegistration.yaml"),
  loadYaml("catalogModels.yaml"),
  loadYaml("ads.yaml"),
];

const mergedPaths: OpenApiPaths = {};
const mergedComponents: Record<string, unknown> = {};
const mergedTags: unknown[] = [];

for (const doc of docs) {
  if (doc.paths) {
    for (const [path, value] of Object.entries(doc.paths)) {
      mergedPaths[path] = value;
    }
  }
  if (doc.components) {
    for (const [key, value] of Object.entries(doc.components)) {
      mergedComponents[key] = {
        ...((mergedComponents[key] as Record<string, unknown>) ?? {}),
        ...((value as Record<string, unknown>) ?? {}),
      };
    }
  }
  if (Array.isArray(doc.tags)) {
    mergedTags.push(...doc.tags);
  }
}

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Muse API",
    version: "1.0.0",
    description: "Muse 백엔드 통합 API 문서 (Auth, Users, PreRegistration, CatalogModels, Ads)",
  },
  servers: [{ url: "http://localhost:4000", description: "Local" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "PreRegistration" },
    { name: "CatalogModels" },
    { name: "Ads" },
    ...mergedTags,
  ],
  components: {
    ...mergedComponents,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: mergedPaths,
};
