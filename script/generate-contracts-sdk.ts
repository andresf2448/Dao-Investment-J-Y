import fs from "node:fs"
import path from "node:path"
import { EXPORTED_CONTRACTS } from "./contracts.config"
import { generateAbis } from "./generate-abis"
import { generateAddresses } from "./generate-addresses"
import { generateHelpers } from "./generate-helpers"

const ROOT = process.cwd()
const SDK_SRC_DIR = path.join(ROOT, "contracts-sdk", "src")

function generateIndexFile() {
  const abiExports = EXPORTED_CONTRACTS.map(
    (contract) => `export * from "./abi/${contract.key}Abi"`
  )

  const helperExports = EXPORTED_CONTRACTS.map(
    (contract) => `export * from "./helpers/${contract.key}"`
  )

  const content = [
    ...abiExports,
    `export * from "./addresses"`,
    ...helperExports,
    "",
  ].join("\n")

  fs.writeFileSync(path.join(SDK_SRC_DIR, "index.ts"), content)
}

function main() {
  fs.mkdirSync(SDK_SRC_DIR, { recursive: true })

  generateAbis()
  generateAddresses()
  generateHelpers()
  generateIndexFile()

  console.log("contracts-sdk generado correctamente.")
}

main()