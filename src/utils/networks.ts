/**
 * Network Configuration Utilities
 * Comprehensive network definitions for Envio-supported chains
 */

export interface NetworkConfig {
  id: number;
  name: string;
  hypersyncUrl: string;
  hyperrpcUrl: string;
  explorerUrl: string;
  tier: number;
  supportsTraces: boolean;
}

export const NETWORKS: Record<number, NetworkConfig> = {
  1: {
    id: 1,
    name: "Ethereum Mainnet",
    hypersyncUrl: "https://eth.hypersync.xyz",
    hyperrpcUrl: "https://eth.rpc.hypersync.xyz",
    explorerUrl: "https://etherscan.io",
    tier: 1,
    supportsTraces: false,
  },
  42161: {
    id: 42161,
    name: "Arbitrum One",
    hypersyncUrl: "https://arbitrum.hypersync.xyz",
    hyperrpcUrl: "https://arbitrum.rpc.hypersync.xyz",
    explorerUrl: "https://arbiscan.io",
    tier: 1,
    supportsTraces: false,
  },
  8453: {
    id: 8453,
    name: "Base",
    hypersyncUrl: "https://base.hypersync.xyz",
    hyperrpcUrl: "https://base.rpc.hypersync.xyz",
    explorerUrl: "https://basescan.org",
    tier: 1,
    supportsTraces: false,
  },
  10: {
    id: 10,
    name: "Optimism",
    hypersyncUrl: "https://optimism.hypersync.xyz",
    hyperrpcUrl: "https://optimism.rpc.hypersync.xyz",
    explorerUrl: "https://optimistic.etherscan.io",
    tier: 1,
    supportsTraces: false,
  },
  137: {
    id: 137,
    name: "Polygon",
    hypersyncUrl: "https://polygon.hypersync.xyz",
    hyperrpcUrl: "https://polygon.rpc.hypersync.xyz",
    explorerUrl: "https://polygonscan.com",
    tier: 1,
    supportsTraces: false,
  },
  // Add more networks as needed
};

export function getNetworkById(chainId: number): NetworkConfig | undefined {
  return NETWORKS[chainId];
}

export function getNetworkByName(name: string): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(
    (net) => net.name.toLowerCase() === name.toLowerCase()
  );
}

export function getHyperSyncUrl(chainId: number): string {
  const network = NETWORKS[chainId];
  return network ? network.hypersyncUrl : `https://${chainId}.hypersync.xyz`;
}

export function getHyperRpcUrl(chainId: number): string {
  const network = NETWORKS[chainId];
  return network ? network.hyperrpcUrl : `https://${chainId}.rpc.hypersync.xyz`;
}

export function getAllNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS);
}
