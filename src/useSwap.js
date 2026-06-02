import { useState, useCallback } from "react";

/**
 * Real onchain swap via Circle App Kit SDK.
 *
 * Accepts the active EIP-1193 provider (MetaMask or OKX) so the SDK signs
 * through whichever wallet the user chose — no private key ever stored.
 */
export function useSwap() {
  const [loading, setLoading]   = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError]       = useState(null);

  const executeSwap = useCallback(
    async ({ tokenIn, tokenOut, amountIn, kitKey, provider }) => {
      const prov = provider || window.ethereum;

      if (!prov) {
        throw new Error("No wallet provider found. Please connect a wallet first.");
      }
      if (!kitKey || kitKey.trim() === "" || kitKey === "YOUR_KIT_KEY") {
        throw new Error(
          "A Kit Key from Circle Console is required.\n\nGo to https://console.circle.com → App Kit → copy your Kit Key and paste it in Settings."
        );
      }

      setLoading(true);
      setError(null);
      setTxResult(null);

      try {
        const [{ AppKit }, { createViemAdapterFromProvider }] =
          await Promise.all([
            import("@circle-fin/app-kit"),
            import("@circle-fin/adapter-viem-v2"),
          ]);

        const kit = new AppKit();

        // Wrap the active wallet provider (MetaMask or OKX) as a viem adapter
        const adapter = await createViemAdapterFromProvider({ provider: prov });

        const result = await kit.swap({
          from: { adapter, chain: "Arc_Testnet" },
          tokenIn,
          tokenOut,
          amountIn: String(amountIn),
          config: { kitKey },
        });

        setTxResult({
          txHash:      result.txHash,
          explorerUrl: result.explorerUrl,
          amountOut:   result.amountOut,
          fees:        result.fees,
        });

        return result;
      } catch (err) {
        const msg = err?.message || "Swap failed. Please try again.";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setTxResult(null);
    setError(null);
  }, []);

  return { executeSwap, loading, txResult, error, reset };
}
