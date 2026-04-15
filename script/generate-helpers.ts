import fs from "node:fs"
import path from "node:path"
import { EXPORTED_CONTRACTS } from "./contracts.config"

const ROOT = process.cwd()
const HELPERS_OUTPUT_DIR = path.join(ROOT, "contracts-sdk", "src", "helpers")

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function generateHelpers() {
  ensureDir(HELPERS_OUTPUT_DIR)

  for (const contract of EXPORTED_CONTRACTS) {
    const abiName = `${contract.key}Abi`
    const fnName = `get${capitalize(contract.key)}Contract`

    const fileContent = `import { ${abiName} } from "../abi/${abiName}"
import { addresses } from "../addresses"

export function ${fnName}(chainId: number) {
  const address = addresses[chainId as keyof typeof addresses]?.${contract.key}

  if (!address) {
    throw new Error("${contract.contractName} no desplegado en chainId " + chainId)
  }

  return {
    address,
    abi: ${abiName},
  } as const
}
`

    fs.writeFileSync(
      path.join(HELPERS_OUTPUT_DIR, `${contract.key}.ts`),
      fileContent
    )
  }

  console.log("Helpers generados correctamente.")
}