import fs from "node:fs/promises";
import path from "node:path";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const DATA_SOURCE_VERSION = "2025-09-03";
const PAGE_MARKDOWN_VERSION = "2026-03-11";

const STATUS_PROPERTY = process.env.NOTION_STATUS_PROPERTY || "Status";
const PUBLISHED_VALUE = process.env.NOTION_PUBLISHED_VALUE || "Published";
const SECTION_PROPERTY = process.env.NOTION_SECTION_PROPERTY || "Section";
const DATE_PROPERTY = process.env.NOTION_DATE_PROPERTY || "Date";
const SLUG_PROPERTY = process.env.NOTION_SLUG_PROPERTY || "Slug";
const TAGS_PROPERTY = process.env.NOTION_TAGS_PROPERTY || "Tags";
const SUMMARY_PROPERTY = process.env.NOTION_SUMMARY_PROPERTY || "Summary";

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "content");
const ASSET_ROOT = path.join(ROOT, "static", "uploads", "notion");

if (!NOTION_TOKEN || (!NOTION_DATA_SOURCE_ID && !NOTION_DATABASE_ID)) {
  console.error("Missing NOTION_TOKEN and either NOTION_DATA_SOURCE_ID or NOTION_DATABASE_ID.");
  process.exit(1);
}

async function notionFetch(endpoint, { method = "GET", body, version }) {
  const response = await fetch(`https://api.notion.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": version,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return response.json();
}

function getPlainText(richText = []) {
  return richText.map((item) => item.plain_text || "").join("").trim();
}

function normalizePageId(value = "") {
  return value.replace(/-/g, "");
}

function yamlEscape(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function slugify(value, fallback) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (normalized) {
    return normalized;
  }

  return fallback;
}

function stripMarkdown(value) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/>\s?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extFromContentType(contentType = "") {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("jpg")) return ".jpg";
  if (contentType.includes("svg")) return ".svg";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("webp")) return ".webp";
  return "";
}

function filenameFromUrl(urlString, fallbackBase) {
  try {
    const url = new URL(urlString);
    const pathname = decodeURIComponent(url.pathname);
    const base = path.basename(pathname);
    if (base && base !== "/") {
      return base;
    }
  } catch {}

  return `${fallbackBase}.bin`;
}

async function downloadMarkdownAssets(markdown, slug) {
  const targetDir = path.join(ASSET_ROOT, slug);
  await fs.mkdir(targetDir, { recursive: true });

  const imageRegex = /!\[([^\]]*)]\((https?:\/\/[^)\s]+)\)/g;
  let updated = markdown;
  let index = 0;

  for (const match of markdown.matchAll(imageRegex)) {
    const originalUrl = match[2];
    const start = match.index ?? -1;
    if (start === -1) {
      continue;
    }

    index += 1;
    try {
      const response = await fetch(originalUrl);
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      const arrayBuffer = await response.arrayBuffer();
      const originalName = filenameFromUrl(originalUrl, `asset-${index}`);
      const parsed = path.parse(originalName);
      const ext = parsed.ext || extFromContentType(contentType) || ".bin";
      const safeBase = slugify(parsed.name || `asset-${index}`, `asset-${index}`);
      const filename = `${safeBase}${ext}`;
      const outputPath = path.join(targetDir, filename);

      await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

      const publicPath = `/uploads/notion/${slug}/${filename}`;
      updated = updated.replace(originalUrl, publicPath);
    } catch (error) {
      console.warn(`Failed to download asset: ${originalUrl}`);
      console.warn(error.message);
    }
  }

  return updated;
}

function readPropertyValue(page, propertyName) {
  const property = page.properties?.[propertyName];
  if (!property) {
    return null;
  }

  switch (property.type) {
    case "title":
      return getPlainText(property.title);
    case "rich_text":
      return getPlainText(property.rich_text);
    case "select":
      return property.select?.name || "";
    case "status":
      return property.status?.name || "";
    case "multi_select":
      return property.multi_select?.map((item) => item.name) || [];
    case "date":
      return property.date?.start || "";
    case "number":
      return String(property.number ?? "");
    case "url":
      return property.url || "";
    default:
      return null;
  }
}

async function fetchAllPages(dataSourceId) {
  const pages = [];
  let cursor;

  do {
    const payload = {
      page_size: 100,
      start_cursor: cursor,
      sorts: [
        {
          property: DATE_PROPERTY,
          direction: "descending",
        },
      ],
    };

    if (!cursor) {
      delete payload.start_cursor;
    }

    const result = await notionFetch(`/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      body: payload,
      version: DATA_SOURCE_VERSION,
    });

    pages.push(...result.results);
    cursor = result.has_more ? result.next_cursor : undefined;
  } while (cursor);

  return pages;
}

function normalizeNotionId(value = "") {
  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/[0-9a-fA-F]{32}/);
  return match ? match[0] : raw;
}

async function resolveDataSourceId() {
  if (NOTION_DATA_SOURCE_ID) {
    return normalizeNotionId(NOTION_DATA_SOURCE_ID);
  }

  const databaseId = normalizeNotionId(NOTION_DATABASE_ID);
  const database = await notionFetch(`/v1/databases/${databaseId}`, {
    version: DATA_SOURCE_VERSION,
  });

  const firstDataSource = database.data_sources?.[0]?.id;
  if (!firstDataSource) {
    throw new Error("No data source found under the provided Notion database.");
  }

  return firstDataSource;
}

async function fetchPageMarkdown(pageId) {
  return notionFetch(`/v1/pages/${pageId}/markdown`, {
    version: PAGE_MARKDOWN_VERSION,
  });
}

function buildFrontMatter({ title, date, slug, tags, summary, draft, lastmod, notionPageId }) {
  const lines = [
    "---",
    `title: '${yamlEscape(title)}'`,
    `date: ${date}`,
    `draft: ${draft ? "true" : "false"}`,
    `slug: '${yamlEscape(slug)}'`,
  ];

  if (summary) {
    lines.push(`description: '${yamlEscape(summary)}'`);
  }

  if (Array.isArray(tags) && tags.length > 0) {
    lines.push(`tags: [${tags.map((tag) => `'${yamlEscape(tag)}'`).join(", ")}]`);
  } else {
    lines.push("tags: []");
  }

  lines.push(`lastmod: ${lastmod}`);
  lines.push(`notion_page_id: '${yamlEscape(notionPageId)}'`);
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const dataSourceId = await resolveDataSourceId();
  const pages = await fetchAllPages(dataSourceId);
  let writtenCount = 0;

  for (const page of pages) {
    const title = readPropertyValue(page, "Title") || "Untitled";
    const explicitSlug = readPropertyValue(page, SLUG_PROPERTY);
    const slug = slugify(explicitSlug || title, normalizePageId(page.id));
    const section = slugify(readPropertyValue(page, SECTION_PROPERTY) || "posts", "posts");
    const date = readPropertyValue(page, DATE_PROPERTY) || page.created_time;
    const tags = readPropertyValue(page, TAGS_PROPERTY) || [];
    const status = readPropertyValue(page, STATUS_PROPERTY);
    const draft = status ? status !== PUBLISHED_VALUE : true;

    const markdownResult = await fetchPageMarkdown(page.id);
    let markdown = markdownResult.markdown || "";
    markdown = await downloadMarkdownAssets(markdown, slug);

    const summaryProperty = readPropertyValue(page, SUMMARY_PROPERTY);
    const summary = summaryProperty || stripMarkdown(markdown).slice(0, 140);
    const frontMatter = buildFrontMatter({
      title,
      date,
      slug,
      tags,
      summary,
      draft,
      lastmod: page.last_edited_time,
      notionPageId: page.id,
    });

    const warnings = [];
    if (markdownResult.truncated) {
      warnings.push("> [!WARNING]");
      warnings.push("> This page was truncated by the Notion markdown endpoint. Check the original Notion page.");
      warnings.push("");
    }

    const fileBody = `${frontMatter}${warnings.join("\n")}${markdown.trim()}\n`;
    const targetDir = path.join(CONTENT_ROOT, section);
    const targetFile = path.join(targetDir, `${slug}.md`);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetFile, fileBody, "utf8");
    writtenCount += 1;

    console.log(`Synced ${title} -> ${path.relative(ROOT, targetFile)}`);
  }

  console.log(`Done. Synced ${writtenCount} page(s) from Notion.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
