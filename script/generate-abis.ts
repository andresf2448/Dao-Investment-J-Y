import fs from "node:fs"
import path from "node:path"
import { EXPORTED_CONTRACTS } from "./contracts.config"

const ROOT = process.cwd()
const ABI_OUTPUT_DIR = path.join(ROOT, "contracts-sdk", "src", "abi")

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function toAbiExportName(key: string) {
  return `${key}Abi`
}

export function generateAbis() {
  ensureDir(ABI_OUTPUT_DIR)

  for (const contract of EXPORTED_CONTRACTS) {
    const artifactFullPath = path.join(ROOT, contract.artifactPath)

    if (!fs.existsSync(artifactFullPath)) {
      throw new Error(`Artifact no encontrado: ${artifactFullPath}`)
    }

    const artifactRaw = fs.readFileSync(artifactFullPath, "utf-8")
    const artifact = JSON.parse(artifactRaw)

    if (!artifact.abi) {
      throw new Error(`El artifact no contiene abi: ${artifactFullPath}`)
    }

    const exportName = toAbiExportName(contract.key)
    const fileContent =
      `export const ${exportName} = ${JSON.stringify(artifact.abi, null, 2)} as const\n`

    const outputFile = path.join(ABI_OUTPUT_DIR, `${exportName}.ts`)
    fs.writeFileSync(outputFile, fileContent)
  }

  console.log("ABIs generados correctamente.")
}