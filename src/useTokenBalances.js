import { useState, useEffect, useCallback } from "react";

// Arc Testnet ERC-20 contract addresses (6 decimals each)
const TOKENS = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
};

const ARC_RPC = "https://rpc.testnet.arc.network";

// Minimal balanceOf ABI call via raw JSON-RPC
async function fetchBalance(tokenAddress, walletAddress) {
  // balanceOf(address) selector = 0x70a08231
  const data =
    "0x70a08231" +
    walletAddress.slice(2).toLowerCase().padStart(64, "0");

  const resp = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    }),
  });

  const json = await resp.json();
  if (json.error) throw new Error(json.error.message);

  // result is a 32-byte hex; USDC/EURC both use 6 decimals
  const raw = BigInt(json.result || "0x0");
  const decimals = 6n;
  const divisor = 10n ** decimals;
  const whole = raw / divisor;
  const frac = raw % divisor;
  return `${whole}.${frac.toString().padStart(6, "0").slice(0, 2)}`;
}

export function useTokenBalances(walletAddress) {
  const [balances, setBalances] = useState({ USDC: "—", EURC: "—" });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalances({ USDC: "—", EURC: "—" });
      return;
    }

    setLoading(true);
    try {
      const [usdc, eurc] = await Promise.all([
        fetchBalance(TOKENS.USDC, walletAddress),
        fetchBalance(TOKENS.EURC, walletAddress),
      ]);
      setBalances({ USDC: usdc, EURC: eurc });
    } catch (err) {
      console.warn("Balance fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
    // Refresh every 15 seconds while the wallet is connected
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { balances, loading, refresh };
}
