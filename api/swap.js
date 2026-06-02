export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tokenIn, tokenOut, amountIn, kitKey, fromAddress } = req.body;

    const tokenMap = {
      USDC: "0x3600000000000000000000000000000000000000",
      EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    };

    const body = {
      inputToken: tokenMap[tokenIn] || tokenIn,
      outputToken: tokenMap[tokenOut] || tokenOut,
      inputAmount: String(amountIn),
      fromAddress: fromAddress || "0x0000000000000000000000000000000000000001",
      chainId: "5042002",
    };

    const r = await fetch("https://api.circle.com/v1/w3s/swap/routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kitKey}`,
        "X-Kit-Key": kitKey,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    try {
      const data = JSON.parse(text);
      return res.status(r.status).json(data);
    } catch {
      return res.status(500).json({ error: "Circle API returned: " + text.slice(0, 200) });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
