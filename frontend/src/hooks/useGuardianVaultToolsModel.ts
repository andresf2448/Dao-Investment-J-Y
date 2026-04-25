import {
  getProtocolCoreContract,
  getVaultRegistryContract,
} from "@dao/contracts-sdk";
import { useEffect, useMemo, useState } from "react";
import { useChainId, useConnection, useReadContracts } from "wagmi";
import type { Address } from "viem";
import Swal from "sweetalert2";
import type {
  GuardianVaultAsset,
  GuardianVaultToolsModel,
} from "@/types/models/guardianVaultTools";
import { getKnownProtocolAssets } from "@/constants/protocolAssets";
import { formatAddress, getTransactionError, isValidAddress } from "@/utils";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getVaultFactoryContract } from "./getVaultFactoryContract";
import {
  getReadContractResult,
  ZERO_ADDRESS,
} from "./shared/contractResults";
import { resolveOptionalContract } from "./shared/resolveContract";
import useWriteContracts from "./useWriteContracts";

export function useGuardianVaultToolsModel(): GuardianVaultToolsModel {
  const chainId = useChainId();
  const connection = useConnection();
  const capabilities = useProtocolCapabilities();
  const { executeWrite } = useWriteContracts();
  const [selectedAssetAddress, setSelectedAssetAddress] =
    useState<Address | null>(null);
  const [vaultName, setVaultName] = useState("JY Vault");
  const [vaultSymbol, setVaultSymbol] = useState("jyVault");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const protocolCoreConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getProtocolCoreContract);
  }, [chainId]);

  const vaultFactoryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getVaultFactoryContract);
  }, [chainId]);

  const vaultRegistryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getVaultRegistryContract);
  }, [chainId]);

  const knownAssets = useMemo(() => getKnownProtocolAssets(chainId), [chainId]);

  const { data: supportedAssetsData } = useReadContracts({
    allowFailure: true,
    contracts:
      protocolCoreConfig && knownAssets.length > 0
        ? knownAssets.map((asset) => ({
            abi: protocolCoreConfig.abi,
            address: protocolCoreConfig.address,
            functionName: "isVaultAssetSupported" as const,
            args: [asset.address],
          }))
        : [],
    query: {
      enabled: Boolean(protocolCoreConfig) && knownAssets.length > 0,
    },
  });

  const assets = useMemo<GuardianVaultAsset[]>(() => {
    return knownAssets
      .filter(
        (_, index) =>
          getReadContractResult<boolean>(supportedAssetsData?.[index]) === true,
      )
      .map((asset) => ({
        symbol: asset.symbol,
        address: asset.address,
      }));
  }, [knownAssets, supportedAssetsData]);

  useEffect(() => {
    if (assets.length === 0) {
      setSelectedAssetAddress(null);
      return;
    }

    setSelectedAssetAddress((current) => {
      if (current && assets.some((asset) => asset.address === current)) {
        return current;
      }

      return assets[0].address as Address;
    });
  }, [assets]);

  const selectedAsset = useMemo<GuardianVaultAsset | null>(() => {
    if (!selectedAssetAddress) {
      return assets[0] ?? null;
    }

    return (
      assets.find((asset) => asset.address === selectedAssetAddress) ??
      assets[0] ??
      null
    );
  }, [assets, selectedAssetAddress]);

  const guardianAddress = connection.address as Address | undefined;

  const { data: deploymentData, refetch } = useReadContracts({
    allowFailure: true,
    contracts:
      vaultFactoryConfig &&
      vaultRegistryConfig &&
      selectedAsset &&
      guardianAddress
        ? [
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "predictVaultAddress" as const,
              args: [guardianAddress, selectedAsset.address as Address],
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "isDeployed" as const,
              args: [guardianAddress, selectedAsset.address as Address],
            },
            {
              abi: vaultRegistryConfig.abi,
              address: vaultRegistryConfig.address,
              functionName: "getVaultByAssetAndGuardian" as const,
              args: [selectedAsset.address as Address, guardianAddress],
            },
          ]
        : [],
    query: {
      enabled: Boolean(
        vaultFactoryConfig &&
          vaultRegistryConfig &&
          selectedAsset &&
          guardianAddress,
      ),
    },
  });

  const predictedAddress =
    getReadContractResult<readonly [bigint | string, Address]>(deploymentData?.[0])?.[1] ??
    getReadContractResult<readonly [string, Address]>(deploymentData?.[0])?.[1] ??
    "Wallet not connected";
  const deployedPair = getReadContractResult<readonly [Address, boolean]>(deploymentData?.[1]);
  const existingVault =
    getReadContractResult<Address>(deploymentData?.[2]) ?? ZERO_ADDRESS;

  const pairExists =
    Boolean(deployedPair?.[1]) || existingVault !== ZERO_ADDRESS;
  const isVaultNameValid = vaultName.trim().length >= 3;
  const isVaultSymbolValid =
    vaultSymbol.trim().length >= 2 && vaultSymbol.trim().length <= 12;

  const canCreateVault =
    capabilities.canCreateVault &&
    !!selectedAsset &&
    isValidAddress(selectedAsset.address) &&
    isVaultNameValid &&
    isVaultSymbolValid &&
    !pairExists &&
    !isSubmitting;

  const setSelectedAsset = (asset: GuardianVaultAsset) => {
    setSelectedAssetAddress(asset.address as Address);
  };

  const createVault = async () => {
    if (!selectedAsset || !canCreateVault) {
      return;
    }

    setIsSubmitting(true);

    Swal.fire({
      title: "Creating vault",
      text: "Confirm the transaction in your wallet.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await executeWrite({
        functionContract: "getVaultFactoryContract",
        functionName: "createVault",
        args: [selectedAsset.address, vaultName.trim(), vaultSymbol.trim()],
        options: {
          waitForReceipt: true,
        },
      });

      if (response?.receipt?.status !== "success") {
        throw new Error("Vault creation transaction failed.");
      }

      await refetch();
      Swal.close();

      await Swal.fire({
        title: "Vault created",
        text: `The ${selectedAsset.symbol} vault was deployed successfully.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      const transactionError = getTransactionError(error);

      Swal.hideLoading();
      Swal.update({
        title: transactionError.title,
        text: transactionError.message,
        icon: "error",
        showConfirmButton: true,
        confirmButtonText: "OK",
        allowOutsideClick: true,
        allowEscapeKey: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    assets,
    selectedAsset,
    setSelectedAsset,
    vaultName,
    setVaultName,
    vaultSymbol,
    setVaultSymbol,
    predictedAddress:
      typeof predictedAddress === "string"
        ? predictedAddress
        : formatAddress(predictedAddress),
    pairExists,
    isVaultNameValid,
    isVaultSymbolValid,
    canCreateVault,
    isSubmitting,
    capabilities,
    createVault,
  };
}
