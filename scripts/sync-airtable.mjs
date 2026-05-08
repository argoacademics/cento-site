#!/usr/bin/env node
/**
 * Fetches Verified submissions from Airtable and writes them as Quartz
 * markdown files under content/{Source Reference}/{Title}-{recordId}.md
 *
 * Requires: AIRTABLE_API_KEY env var
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, "../content")

const BASE_ID = "appI3b2eKqgY9XWuQ"
const TABLE_ID = "tblpfCliNwnlmUt8Y"

const FIELDS = [
  "fldg2CqdBfcqamig2", // Name
  "fldMvleFtM9QoF5o7", // Source Reference
  "fldiDdrNv6X7RpOdh", // Status
  "fldgjKjoWzKzB6UVw", // Title
  "fldTgLFFlmTgVkICe", // Stitch
  "fldehSXhaOFVCgUsW", // Story Body
  "fldidfmw259IWlbpO", // Explainer Body
  "fldwSY4Q9ImqseWbX", // Tags
  "fldzKzYaO33ZCzmGM", // Affiliation
  "fldIjsbg1NBtIS2Gv", // Submitted at
]

async function fetchRecords(apiKey) {
  const records = []
  let offset = null

  do {
    const params = new URLSearchParams({
      "fields[]": FIELDS,
      "filterByFormula": `{Status} = "Verified"`,
      pageSize: 100,
    })
    // URLSearchParams collapses repeated keys; rebuild for fields[]
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`)
    for (const f of FIELDS) url.searchParams.append("fields[]", f)
    url.searchParams.set("filterByFormula", `{Status} = "Verified"`)
    url.searchParams.set("pageSize", "100")
    if (offset) url.searchParams.set("offset", offset)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Airtable API error ${res.status}: ${body}`)
    }

    const json = await res.json()
    records.push(...json.records)
    offset = json.offset ?? null
  } while (offset)

  return records
}

function slugify(str) {
  return str
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
}

function yamlStr(value) {
  if (!value) return '""'
  // Wrap in quotes; escape internal quotes
  return `"${String(value).replace(/"/g, '\\"')}"`
}

function buildMarkdown(record) {
  const f = record.cellValuesByFieldId
  const title = f["fldgjKjoWzKzB6UVw"] ?? record.id
  const sourceRef = f["fldMvleFtM9QoF5o7"] ?? ""
  const stitch = f["fldTgLFFlmTgVkICe"] ?? ""
  const name = f["fldg2CqdBfcqamig2"] ?? ""
  const affiliation = f["fldzKzYaO33ZCzmGM"] ?? ""
  const tags = f["fldwSY4Q9ImqseWbX"] ?? ""
  const storyBody = f["fldehSXhaOFVCgUsW"] ?? ""
  const explainerBody = f["fldidfmw259IWlbpO"] ?? ""

  const parentLink = sourceRef ? `[[${sourceRef}/${sourceRef}]]` : ""

  const frontmatter = [
    `---`,
    `title: ${yamlStr(title)}`,
    `submitter: ${yamlStr(name)}`,
    `author: ${yamlStr(name)}`,
    sourceRef ? `parent_node: "${parentLink}"` : null,
    stitch ? `stitch_phrase: ${yamlStr(stitch)}` : null,
    affiliation ? `affiliation: ${yamlStr(affiliation)}` : null,
    tags ? `tags: ${yamlStr(tags)}` : null,
    `status: "Verified"`,
    `---`,
  ]
    .filter((l) => l !== null)
    .join("\n")

  const stitchCallout =
    stitch && sourceRef
      ? `\n> [!abstract] The Stitch\n> This narrative originates from the phrase **"${stitch}"** extracted from [[${sourceRef}/${sourceRef}|${sourceRef}]]\n`
      : ""

  const storySection = storyBody
    ? `\n${storyBody.trim()}${sourceRef ? `\n\nThis story is stitched to [[${sourceRef}/${sourceRef}|${sourceRef}]].` : ""}\n`
    : ""

  const explainerSection = explainerBody
    ? `\n---\n\n### Cultural Explainer\n\n${explainerBody.trim()}\n`
    : ""

  return `${frontmatter}\n${stitchCallout}${storySection}${explainerSection}`
}

async function main() {
  const apiKey = process.env.AIRTABLE_API_KEY
  if (!apiKey) {
    console.error("AIRTABLE_API_KEY is not set")
    process.exit(1)
  }

  console.log("Fetching verified submissions from Airtable…")
  const records = await fetchRecords(apiKey)
  console.log(`Found ${records.length} verified record(s)`)

  for (const record of records) {
    const f = record.cellValuesByFieldId
    const sourceRef = f["fldMvleFtM9QoF5o7"]
    const title = f["fldgjKjoWzKzB6UVw"]

    if (!sourceRef || !title) {
      console.warn(`  Skipping ${record.id} — missing Source Reference or Title`)
      continue
    }

    const dir = path.join(CONTENT_DIR, sourceRef)
    fs.mkdirSync(dir, { recursive: true })

    const filename = `${slugify(title)}-${record.id}.md`
    const filepath = path.join(dir, filename)
    const content = buildMarkdown(record)

    fs.writeFileSync(filepath, content, "utf8")
    console.log(`  Wrote ${path.relative(CONTENT_DIR, filepath)}`)
  }

  console.log("Sync complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
