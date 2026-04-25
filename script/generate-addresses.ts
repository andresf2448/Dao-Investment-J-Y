import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const DEPLOYMENTS_DIR = path.join(ROOT, "deployments")
const ADDRESSES_OUTPUT_DIR = path.join(ROOT, "contracts-sdk", "src", "addresses")

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function getNetworkFiles() {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) return []

  return fs
    .readdirSync(DEPLOYMENTS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
}

function toConstName(networkName: string) {
  const safeName = networkName
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/^[^a-zA-Z]+/, "")

  return `${safeName.charAt(0).toLowerCase()}${safeName.slice(1)}Addresses`
}

export function generateAddresses() {
  ensureDir(ADDRESSES_OUTPUT_DIR)

  const networkFiles = getNetworkFiles()

  if (networkFiles.length === 0) {
    throw new Error("No se encontraron archivos en deployments/")
  }

  const indexImports: string[] = []
  const chainMappings = new Map<string, string[]>()

  for (const fileName of networkFiles) {
    const networkName = fileName.replace(".json", "")
    const constName = toConstName(networkName)
    const fullPath = path.join(DEPLOYMENTS_DIR, fileName)

    const raw = fs.readFileSync(fullPath, "utf-8")
    const deployment = JSON.parse(raw)

    const { chainId, ...contracts } = deployment

    if (!chainId) {
      throw new Error(`El archivo ${fileName} no contiene chainId`)
    }

    const fileContent =
      `export const ${constName} = ${JSON.stringify(contracts, null, 2)} as const\n`

    fs.writeFileSync(
      path.join(ADDRESSES_OUTPUT_DIR, `${networkName}.ts`),
      fileContent
    )

    indexImports.push(`import { ${constName} } from "./${networkName}"`)

    const current = chainMappings.get(String(chainId)) ?? []
    current.push(constName)
    chainMappings.set(String(chainId), current)
  }

  const indexMappings = Array.from(chainMappings.entries()).map(
    ([chainId, constNames]) => {
      if (constNames.length === 1) {
        return `  ${chainId}: ${constNames[0]},`
      }

      return `  ${chainId}: {\n${constNames
        .map((constName) => `    ...${constName},`)
        .join("\n")}\n  },`
    },
  )

  const indexContent =
    `${indexImports.join("\n")}\n\n` +
    `export const addresses = {\n${indexMappings.join("\n")}\n} as const\n`

  fs.writeFileSync(path.join(ADDRESSES_OUTPUT_DIR, "index.ts"), indexContent)

  console.log("Addresses generadas correctamente.")
}