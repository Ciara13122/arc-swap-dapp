import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tokenIn, tokenOut, amountIn, kitKey, fromAddress } = req.body;

    // Use a throwaway wallet just to get a quote
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: "0x0000000000000000000000000000000000000000000000000000000000000001",
    });

    const kit = new AppKit();
    const result = await kit.swap({
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn: String(amountIn),
      config: { kitKey, dryRun: true },
    });

    return res.status(200).json({
      amountOut: result.amountOut,
      fees: result.fees,
      quoteOnly: true,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
