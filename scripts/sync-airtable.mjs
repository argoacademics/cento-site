#!/usr/bin/env node
/**
 * Fetches Verified submissions from Airtable and writes them as Quartz
 * markdown files under content/{Source Reference}/{Title}-{recordId}.md
 *
 * Requires: AIRTABLE_STITCHED_PT env var
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, "../content")

const BASE_ID = "appI3b2eKqgY9XWuQ"
const TABLE_ID = "tblpfCliNwnlmUt8Y"

async function fetchRecords(apiKey) {
  const records = []
  let offset = null

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`)
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
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

// Wrap the first real letter of a body in <span class="dropcap …"> so the
// drop cap is deterministic — immune to the ::first-letter quirks that drop it
// when a paragraph starts with a quote, link, or emphasis. Skips any leading
// markdown/punctuation (e.g. an opening curly/straight quote) and caps the
// first alphanumeric character. Returns the body unchanged if none is found.
function dropCap(body, className) {
  if (!body) return body
  // Match leading whitespace/punctuation, then the first alphanumeric char.
  const m = body.match(/^(\s*[^\p{L}\p{N}]*)(\p{L}|\p{N})/u)
  if (!m) return body
  const lead = m[1]
  const letter = m[2]
  const rest = body.slice(m[0].length)
  return `${lead}<span class="dropcap ${className}">${letter}</span>${rest}`
}

function buildMarkdown(record) {
  // Airtable REST API returns fields by name under record.fields
  const f = record.fields ?? {}

  const title = f["Title"] ?? record.id
  const sourceRef = f["Source Reference"] ?? ""
  const stitch = f["Stitch"] ?? ""
  const name = f["Name"] ?? ""
  const affiliation = f["Affiliation"] ?? ""
  const tags = f["Tags"] ?? ""
  const storyBody = f["Story Body"] ?? ""
  const explainerBody = f["Explainer Body"] ?? ""

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

  const storySection = storyBody ? `\n${dropCap(storyBody.trim(), "dropcap-story")}\n` : ""

  const explainerSection = explainerBody
    ? `\n---\n\n### Cultural Explainer\n\n${dropCap(explainerBody.trim(), "dropcap-explainer")}\n`
    : ""

  return `${frontmatter}\n${stitchCallout}${storySection}${explainerSection}`
}

async function main() {
  const apiKey = process.env.AIRTABLE_STITCHED_PT
  if (!apiKey) {
    console.error("AIRTABLE_STITCHED_PT is not set")
    process.exit(1)
  }

  console.log("Fetching verified submissions from Airtable…")
  const records = await fetchRecords(apiKey)
  console.log(`Found ${records.length} verified record(s)`)

  // Records whose Stitch never appears in their Story Body. The StitchPhrase
  // transformer matches with a literal indexOf, so these render with no link back
  // to the source — the whole point of the archive — and fail silently.
  const unstitched = []

  for (const record of records) {
    const f = record.fields ?? {}
    const sourceRef = f["Source Reference"]
    const title = f["Title"]

    if (!sourceRef || !title) {
      console.warn(`  Skipping ${record.id} — missing Source Reference or Title`)
      continue
    }

    const stitch = (f["Stitch"] ?? "").trim()
    const storyBody = f["Story Body"] ?? ""
    if (stitch && !storyBody.includes(stitch)) {
      // Approval in Airtable is what publishes a piece, so a record that would
      // render without its provenance link must not reach the archive. Skip it
      // and report; the "Stitch Check" field in Airtable shows the same verdict
      // on the desk, before Status is ever set to Verified.
      unstitched.push({ title, id: record.id, stitch })
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

  if (unstitched.length) {
    console.warn("")
    console.warn(
      `⚠  HELD BACK — ${unstitched.length} of ${records.length} Verified record(s) have a Stitch`,
    )
    console.warn("   that does not appear verbatim in their Story Body. They were NOT published,")
    console.warn("   because the stitch link is the whole point of the archive:")
    for (const u of unstitched) {
      console.warn(`     · ${u.title} (${u.id}) — looking for: "${u.stitch}"`)
    }
    console.warn("")
    console.warn("   Fix in Airtable: the Stitch must be an exact substring of the Story Body")
    console.warn("   (watch for curly vs straight quotes, and trailing whitespace). The")
    console.warn('   "Stitch Check" column shows this verdict per row. Re-approve to republish.')
    console.warn("")
  }

  console.log("Sync complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
