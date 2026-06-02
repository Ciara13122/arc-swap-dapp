import { useState, useCallback } from "react";

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState(null);

  const executeSwap = useCallback(
    async ({ tokenIn, tokenOut, amountIn, kitKey }) => {
      if (!kitKey || !kitKey.startsWith("KIT_KEY:")) {
        throw new Error(
          "Kit Key required. Go to https://console.circle.com → Kit Keys"
        );
      }
      setLoading(true);
      setError(null);
      setTxResult(null);
      try {
        const resp = await fetch("/api/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenIn, tokenOut, amountIn, kitKey }),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) throw new Error(data.error || "Swap failed");
        setTxResult(data);
        return data;
      } catch (err) {
        setError(err.message);
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
