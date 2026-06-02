export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const { tokenIn, tokenOut, amountIn, kitKey, fromAddress } = req.body;
    const r = await fetch("https://api.circle.com/v1/w3s/swap/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + kitKey
      },
      body: JSON.stringify({
        inputToken: tokenIn,
        outputToken: tokenOut,
        inputAmount: amountIn,
        fromAddress,
        chain: "ARC-TESTNET"
      })
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
