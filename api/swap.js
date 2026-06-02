const { AppKit } = require("@circle-fin/app-kit");
const { createViemAdapterFromPrivateKey } = require("@circle-fin/adapter-viem-v2");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tokenIn, tokenOut, amountIn, kitKey } = req.body;

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    });

    const kit = new AppKit();

    const result = await kit.swap({
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn: String(amountIn),
      config: { kitKey },
    });

    return res.status(200).json({
      amountOut: result.amountOut,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      fees: result.fees,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
