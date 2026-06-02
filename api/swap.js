import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tokenIn, tokenOut, amountIn, kitKey } = req.body;

    // Get a quote only (no signing) — returns estimated output
    const kit = new AppKit();
    const quote = await kit.getSwapQuote({
      chain: "Arc_Testnet",
      tokenIn,
      tokenOut,
      amountIn: String(amountIn),
      config: { kitKey },
    });

    return res.status(200).json({
      amountOut: quote.amountOut,
      rate: quote.rate,
      fees: quote.fees,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
