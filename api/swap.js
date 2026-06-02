export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tokenIn, tokenOut, amountIn, kitKey } = req.body;

    // Use Circle's Swap Kit API directly
    const { SwapKit } = await import("@circle-fin/swap-kit");
    const kit = new SwapKit({ apiKey: kitKey });

    const quote = await kit.getQuote({
      inputToken: tokenIn === "USDC"
        ? "0x3600000000000000000000000000000000000000"
        : "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      outputToken: tokenOut === "USDC"
        ? "0x3600000000000000000000000000000000000000"
        : "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      inputAmount: String(amountIn),
      chain: "ARC-TESTNET",
    });

    return res.status(200).json(quote);
  } catch (e) {
    console.error("Swap error:", e);
    return res.status(500).json({ error: e.message });
  }
}
