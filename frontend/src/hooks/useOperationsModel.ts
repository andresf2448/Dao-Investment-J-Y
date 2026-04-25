import {
  getProtocolCoreContract,
  getTreasuryContract,
} from "@dao/contracts-sdk";
import { useCallback, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useChainId, useReadContracts } from "wagmi";
import type {
  InfrastructureWiring,
  OperationsModel,
  OperationsStatus,
} from "@/types/models/operations";
import { getKnownProtocolAssets } from "@/constants/protocolAssets";
import { formatAddress, getTransactionError, isValidAddress } from "@/utils";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getVaultFactoryContract } from "./getVaultFactoryContract";
import {
  getReadContractResult,
  ZERO_ADDRESS,
} from "./shared/contractResults";
import { resolveOptionalContract } from "./shared/resolveContract";
import { useProtocolReads } from "./useProtocolReads";
import useWriteContracts from "./useWriteContracts";

export function useOperationsModel(): OperationsModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const { executeWrite } = useWriteContracts();
  const knownAssets = useMemo(() => getKnownProtocolAssets(chainId), [chainId]);
  const [supportedVaultAsset, setSupportedVaultAsset] = useState("");
  const [supportedGenesisToken, setSupportedGenesisToken] = useState("");
  const [factoryRouterInput, setFactoryRouterInput] = useState("");
  const [factoryCoreInput, setFactoryCoreInput] = useState("");
  const [guardianAdministratorInput, setGuardianAdministratorInput] =
    useState("");
  const [vaultRegistryInput, setVaultRegistryInput] = useState("");
  const [treasuryProtocolCoreInput, setTreasuryProtocolCoreInput] =
    useState("");
  const {
    isVaultCreationPaused,
    isDepositsPaused,
    assetsSupported,
    refetch,
  } = useProtocolReads([
    {
      key: "isVaultCreationPaused",
      contract: "getProtocolCoreContract",
      functionName: "isVaultCreationPaused",
    },
    {
      key: "isDepositsPaused",
      contract: "getProtocolCoreContract",
      functionName: "isVaultDepositsPaused",
    },
    {
      key: "assetsSupported",
      contract: "getProtocolCoreContract",
      functionName: "getSupportedGenesisTokens",
    },
  ]);

  const vaultFactoryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getVaultFactoryContract);
  }, [chainId]);

  const protocolCoreConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getProtocolCoreContract);
  }, [chainId]);

  const treasuryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getTreasuryContract);
  }, [chainId]);

  const { data: wiringData } = useReadContracts({
    allowFailure: true,
    contracts: [
      ...(vaultFactoryConfig
        ? [
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "router" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "core" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "guardianAdministrator" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "vaultRegistry" as const,
            },
          ]
        : []),
      ...(treasuryConfig
        ? [
            {
              abi: treasuryConfig.abi,
              address: treasuryConfig.address,
              functionName: "protocolCore" as const,
            },
          ]
        : []),
    ],
    query: {
      enabled: Boolean(vaultFactoryConfig || treasuryConfig),
    },
  });

  const { data: supportedVaultAssetsData } = useReadContracts({
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

  const supportedVaultAssetsCount = useMemo(() => {
    return (supportedVaultAssetsData ?? []).filter(
      (result) => getReadContractResult<boolean>(result) === true,
    ).length;
  }, [supportedVaultAssetsData]);

  const supportedGenesisTokensList = useMemo(
    () => {
      const tokens = ((assetsSupported as readonly string[] | undefined) ??
        []) as string[];

      return tokens.filter(
        (token, index, self) =>
          self.findIndex(
            (candidate) => candidate.toLowerCase() === token.toLowerCase(),
          ) === index,
      );
    },
    [assetsSupported],
  );

  const supportedGenesisTokenCount = supportedGenesisTokensList.length;

  const supportedVaultAssetError =
    supportedVaultAsset.trim() !== "" &&
    !isValidAddress(supportedVaultAsset.trim())
      ? "Enter a valid asset address."
      : undefined;
  const supportedGenesisTokenError =
    supportedGenesisToken.trim() !== "" &&
    !isValidAddress(supportedGenesisToken.trim())
      ? "Enter a valid token address."
      : undefined;
  const factoryRouterError =
    factoryRouterInput.trim() !== "" &&
    !isValidAddress(factoryRouterInput.trim())
      ? "Enter a valid router contract address."
      : undefined;
  const factoryCoreError =
    factoryCoreInput.trim() !== "" && !isValidAddress(factoryCoreInput.trim())
      ? "Enter a valid core contract address."
      : undefined;
  const guardianAdministratorError =
    guardianAdministratorInput.trim() !== "" &&
    !isValidAddress(guardianAdministratorInput.trim())
      ? "Enter a valid guardian administrator address."
      : undefined;
  const vaultRegistryError =
    vaultRegistryInput.trim() !== "" && !isValidAddress(vaultRegistryInput.trim())
      ? "Enter a valid vault registry address."
      : undefined;
  const treasuryProtocolCoreError =
    treasuryProtocolCoreInput.trim() !== "" &&
    !isValidAddress(treasuryProtocolCoreInput.trim())
      ? "Enter a valid ProtocolCore address."
      : undefined;

  const canSubmitFactoryRouter =
    capabilities.canAccessAdminConsole &&
    isValidAddress(factoryRouterInput.trim());
  const canSubmitFactoryCore =
    capabilities.canAccessAdminConsole && isValidAddress(factoryCoreInput.trim());
  const canSubmitGuardianAdministrator =
    capabilities.canAccessAdminConsole &&
    isValidAddress(guardianAdministratorInput.trim());
  const canSubmitVaultRegistry =
    capabilities.canAccessAdminConsole && isValidAddress(vaultRegistryInput.trim());
  const canSubmitTreasuryProtocolCore =
    capabilities.canAccessAdminConsole &&
    isValidAddress(treasuryProtocolCoreInput.trim());

  const assetSupportPermissionMessage = !capabilities.canResumeVaultCreation
    ? "Asset support actions are restricted to manager operators."
    : undefined;
  const wiringPermissionMessage = !capabilities.canAccessAdminConsole
    ? "Infrastructure wiring is restricted to administrative operators."
    : undefined;

  const executeOperation = useCallback(
    async (
      title: string,
      params: Parameters<typeof executeWrite>[0],
      onSuccess?: () => void | Promise<void>,
    ) => {
      Swal.fire({
        title,
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
          ...params,
          options: {
            waitForReceipt: true,
          },
        });

        if (response?.receipt?.status !== "success") {
          throw new Error("Transaction failed.");
        }

        await refetch();
        await onSuccess?.();
        Swal.close();

        await Swal.fire({
          title: "Operation completed",
          text: "Protocol state was updated successfully.",
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
      }
    },
    [executeWrite, refetch],
  );

  const pauseVaultCreation = useCallback(
    () =>
      executeOperation("Pausing vault creation", {
        functionContract: "getProtocolCoreContract",
        functionName: "pauseVaultCreation",
      }),
    [executeOperation],
  );
  const resumeVaultCreation = useCallback(
    () =>
      executeOperation("Resuming vault creation", {
        functionContract: "getProtocolCoreContract",
        functionName: "unpauseVaultCreation",
      }),
    [executeOperation],
  );
  const pauseVaultDeposits = useCallback(
    () =>
      executeOperation("Pausing vault deposits", {
        functionContract: "getProtocolCoreContract",
        functionName: "pauseVaultDeposits",
      }),
    [executeOperation],
  );
  const resumeVaultDeposits = useCallback(
    () =>
      executeOperation("Resuming vault deposits", {
        functionContract: "getProtocolCoreContract",
        functionName: "unpauseVaultDeposits",
      }),
    [executeOperation],
  );
  const addSupportedVaultAsset = useCallback(
    () =>
      executeOperation(
        "Adding supported vault asset",
        {
          functionContract: "getProtocolCoreContract",
          functionName: "setSupportedVaultAsset",
          args: [supportedVaultAsset.trim(), true],
        },
        () => setSupportedVaultAsset(""),
      ),
    [executeOperation, supportedVaultAsset],
  );
  const updateSupportedGenesisTokens = useCallback(() => {
    const nextToken = supportedGenesisToken.trim();

    if (
      supportedGenesisTokensList.some(
        (token) => token.toLowerCase() === nextToken.toLowerCase(),
      )
    ) {
      return Promise.resolve();
    }

    return executeOperation(
      "Updating supported genesis tokens",
      {
        functionContract: "getProtocolCoreContract",
        functionName: "setSupportedGenesisTokens",
        args: [[...supportedGenesisTokensList, nextToken]],
      },
      () => setSupportedGenesisToken(""),
    );
  }, [executeOperation, supportedGenesisToken, supportedGenesisTokensList]);
  const setFactoryRouter = useCallback(
    () =>
      executeOperation(
        "Updating factory router",
        {
          functionContract: "getVaultFactoryContract",
          functionName: "setRouter",
          args: [factoryRouterInput.trim()],
        },
        () => setFactoryRouterInput(""),
      ),
    [executeOperation, factoryRouterInput],
  );
  const setFactoryCore = useCallback(
    () =>
      executeOperation(
        "Updating factory core",
        {
          functionContract: "getVaultFactoryContract",
          functionName: "setCore",
          args: [factoryCoreInput.trim()],
        },
        () => setFactoryCoreInput(""),
      ),
    [executeOperation, factoryCoreInput],
  );
  const setGuardianAdministrator = useCallback(
    () =>
      executeOperation(
        "Updating guardian administrator",
        {
          functionContract: "getVaultFactoryContract",
          functionName: "setGuardianAdministrator",
          args: [guardianAdministratorInput.trim()],
        },
        () => setGuardianAdministratorInput(""),
      ),
    [executeOperation, guardianAdministratorInput],
  );
  const setVaultRegistry = useCallback(
    () =>
      executeOperation(
        "Updating vault registry",
        {
          functionContract: "getVaultFactoryContract",
          functionName: "setVaultRegistry",
          args: [vaultRegistryInput.trim()],
        },
        () => setVaultRegistryInput(""),
      ),
    [executeOperation, vaultRegistryInput],
  );
  const setTreasuryProtocolCore = useCallback(
    () =>
      executeOperation(
        "Updating treasury core reference",
        {
          functionContract: "getTreasuryContract",
          functionName: "setProtocolCore",
          args: [treasuryProtocolCoreInput.trim()],
        },
        () => setTreasuryProtocolCoreInput(""),
      ),
    [executeOperation, treasuryProtocolCoreInput],
  );

  const wiringValues = useMemo(
    () => [
      getReadContractResult<string>(wiringData?.[0]) ?? ZERO_ADDRESS,
      getReadContractResult<string>(wiringData?.[1]) ?? ZERO_ADDRESS,
      getReadContractResult<string>(wiringData?.[2]) ?? ZERO_ADDRESS,
      getReadContractResult<string>(wiringData?.[3]) ?? ZERO_ADDRESS,
      getReadContractResult<string>(wiringData?.[4]) ?? ZERO_ADDRESS,
    ],
    [wiringData],
  );

  const wiring: InfrastructureWiring = {
    factoryRouter: formatAddress(wiringValues[0]),
    factoryCore: formatAddress(wiringValues[1]),
    guardianAdministrator: formatAddress(wiringValues[2]),
    vaultRegistry: formatAddress(wiringValues[3]),
    treasuryProtocolCore: formatAddress(wiringValues[4]),
  };

  const configuredWiringCount = wiringValues.filter(
    (value) => value && value !== ZERO_ADDRESS,
  ).length;

  const status: OperationsStatus = {
    vaultCreation: isVaultCreationPaused ? "paused" : "enabled",
    vaultDeposits: isDepositsPaused ? "paused" : "enabled",
    supportedAssetsCount: supportedVaultAssetsCount,
    infrastructureState:
      configuredWiringCount === 5
        ? "linked"
        : configuredWiringCount > 0
          ? "partial"
          : "unconfigured",
  };

  return {
    status,
    wiring,
    assetSupport: {
      supportedVaultAsset,
      setSupportedVaultAsset,
      supportedVaultAssetError,
      canAddSupportedVaultAsset:
        capabilities.canResumeVaultCreation &&
        isValidAddress(supportedVaultAsset.trim()),
      supportedGenesisToken,
      setSupportedGenesisToken,
      supportedGenesisTokenError,
      canUpdateSupportedGenesisTokens:
        capabilities.canResumeVaultCreation &&
        isValidAddress(supportedGenesisToken.trim()),
      supportedGenesisTokenCount,
      assetSupportPermissionMessage,
    },
    wiringForm: {
      factoryRouterInput,
      setFactoryRouterInput,
      factoryRouterError,
      canSubmitFactoryRouter,
      factoryCoreInput,
      setFactoryCoreInput,
      factoryCoreError,
      canSubmitFactoryCore,
      guardianAdministratorInput,
      setGuardianAdministratorInput,
      guardianAdministratorError,
      canSubmitGuardianAdministrator,
      vaultRegistryInput,
      setVaultRegistryInput,
      vaultRegistryError,
      canSubmitVaultRegistry,
      treasuryProtocolCoreInput,
      setTreasuryProtocolCoreInput,
      treasuryProtocolCoreError,
      canSubmitTreasuryProtocolCore,
      wiringPermissionMessage,
    },
    actions: {
      pauseVaultCreation,
      resumeVaultCreation,
      pauseVaultDeposits,
      resumeVaultDeposits,
      addSupportedVaultAsset,
      updateSupportedGenesisTokens,
      setFactoryRouter,
      setFactoryCore,
      setGuardianAdministrator,
      setVaultRegistry,
      setTreasuryProtocolCore,
    },
    summary: {
      protocolControlsValue: `${isVaultCreationPaused ? "Paused" : "Enabled"} / ${
        isDepositsPaused ? "Paused" : "Enabled"
      }`,
      infrastructureAccessValue: capabilities.canAccessAdminConsole
        ? "Allowed"
        : "Restricted",
      infrastructureAccessSubtitle: capabilities.canAccessAdminConsole
        ? "Administrative wallet access is available for wiring and control actions."
        : "Administrative wallet access is required for wiring and control actions.",
    },
    refetch,
    capabilities,
  };
}
