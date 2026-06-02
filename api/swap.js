import { useState, useCallback } from "react";

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState(null);

  const executeSwap = useCallback(async ({ tokenIn, tokenOut, amountIn, kitKey, provider }) => {
    const prov = provider || window.ethereum;
    if (!prov) throw new Error("No wallet provider found.");
    if (!kitKey || kitKey.trim() === "") {
      throw new Error("A Kit Key is required.\n\nGo to https://console.circle.com → Kit Keys → copy your key.");
    }

    setLoading(true);
    setError(null);
    setTxResult(null);

    try {
      const [{ AppKit }, { createViemAdapterFromProvider }] = await Promise.all([
        import("@circle-fin/app-kit"),
        import("@circle-fin/adapter-viem-v2"),
      ]);

      const kit = new AppKit();

      const adapter = await createViemAdapterFromProvider({
        provider: prov,
      });

      const result = await kit.swap({
        from: { adapter, chain: "Arc_Testnet" },
        tokenIn,
        tokenOut,
        amountIn: String(amountIn),
        config: { kitKey },
      });

      setTxResult({
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        amountOut: result.amountOut,
        fees: result.fees,
      });
      return result;
    } catch (err) {
      const msg = err?.message || "Swap failed.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setTxResult(null); setError(null); }, []);

  return { executeSwap, loading, txResult, error, reset };
}
