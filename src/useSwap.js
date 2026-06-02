import { useState, useCallback } from "react";

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState(null);

  const executeSwap = useCallback(async ({ tokenIn, tokenOut, amountIn, kitKey, provider }) => {
    if (!provider && !window.ethereum) throw new Error("No wallet provider found.");
    if (!kitKey || kitKey.trim() === "" || kitKey === "YOUR_KIT_KEY") {
      throw new Error("A Kit Key from Circle Console is required.\n\nGo to https://console.circle.com → Kit Keys → copy your key.");
    }

    setLoading(true);
    setError(null);
    setTxResult(null);

    try {
      const prov = provider || window.ethereum;
      const accounts = await prov.request({ method: "eth_accounts" });
      const fromAddress = accounts[0];

      // Call via Vercel proxy to avoid CORS
      const resp = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenIn, tokenOut, amountIn: String(amountIn), kitKey, fromAddress }),
      });

      const quote = await resp.json();

      if (!resp.ok || quote.error) {
        throw new Error(quote.error || quote.message || "Swap API error");
      }

      // Sign and send transaction via MetaMask/OKX
      if (quote.transaction) {
        const txHash = await prov.request({
          method: "eth_sendTransaction",
          params: [quote.transaction],
        });

        const explorerUrl = `https://testnet.arcscan.app/tx/${txHash}`;
        const result = { txHash, explorerUrl, amountOut: quote.outputAmount || "~", fees: [] };
        setTxResult(result);
        return result;
      }

      throw new Error("No transaction returned from swap API");
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