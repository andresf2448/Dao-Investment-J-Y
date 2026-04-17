import fs from "node:fs"
import path from "node:path"
import { EXPORTED_CONTRACTS } from "./contracts.config"
import { generateAbis } from "./generate-abis"
import { generateAddresses } from "./generate-addresses"
import { generateHelpers } from "./generate-helpers"

const ROOT = process.cwd()
const SDK_DIR = path.join(ROOT, "contracts-sdk")
const SDK_SRC_DIR = path.join(SDK_DIR, "src")

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf8")
}

function writeJsonIfNotExists(filePath: string, data: unknown) {
  if (fs.existsSync(filePath)) return
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8")
}

function ensureSdkStructure() {
  ensureDir(SDK_DIR)
  ensureDir(SDK_SRC_DIR)
  ensureDir(path.join(SDK_SRC_DIR, "abi"))
  ensureDir(path.join(SDK_SRC_DIR, "helpers"))
}

function generatePackageJson() {
  const packageJson = {
    name: "@dao/contracts-sdk",
    version: "1.0.0",
    private: true,
    type: "module",
    main: "./src/index.ts",
    types: "./src/index.ts",
    exports: {
      ".": "./src/index.ts"
    }
  }

  writeJsonIfNotExists(path.join(SDK_DIR, "package.json"), packageJson)
}

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

  writeFile(path.join(SDK_SRC_DIR, "index.ts"), content)
}

function main() {
  ensureSdkStructure()

  generatePackageJson()
  generateAbis()
  generateAddresses()
  generateHelpers()
  generateIndexFile()

  console.log("contracts-sdk generado correctamente.")
}

main()