import { useState } from "react";
import { useWallet } from "./useWallet";
import { useSwap } from "./useSwap";
import { useTokenBalances } from "./useTokenBalances";
import "./App.css";

const TOKENS = ["USDC", "EURC"];
const RATES = { "USDC-EURC": 0.9905, "EURC-USDC": 1.0096 };
const WALLETS = [
  { id: "metamask", name: "MetaMask", icon: "🦊", desc: "Browser extension wallet" },
  { id: "okx", name: "OKX Wallet", icon: "⬛", desc: "Multi-chain Web3 wallet" },
];

export default function App() {
  const { address, walletType, provider, status, isOnArc,
    connectMetaMask, connectOKX, disconnect, switchToArc } = useWallet();
  const { executeSwap, loading, txResult, error, reset } = useSwap();
  const { balances, refresh } = useTokenBalances(address);

  const [tab, setTab] = useState("swap");
  const [kitKey, setKitKey] = useState(() => localStorage.getItem("arc_kit_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tIn, setTIn] = useState("USDC");
  const [tOut, setTOut] = useState("EURC");
  const [amt, setAmt] = useState("");
  const [swapSt, setSwapSt] = useState(null);

  const rate = RATES[`${tIn}-${tOut}`] ?? 1;
  const est = amt ? (parseFloat(amt) * rate).toFixed(4) : "";
  const saveKey = (v) => { setKitKey(v); localStorage.setItem("arc_kit_key", v); };

  const flip = () => { setTIn(tOut); setTOut(tIn); setAmt(""); reset(); };

  const doSwap = async () => {
    if (!address || !amt || parseFloat(amt) <= 0) return;
    setSwapSt(null); reset();
    try {
      await executeSwap({ tokenIn: tIn, tokenOut: tOut, amountIn: amt, kitKey, provider });
      setSwapSt("ok"); setAmt(""); refresh();
    } catch { setSwapSt("err"); }
  };

  const pickWallet = async (id) => {
    setShowPicker(false);
    if (id === "metamask") await connectMetaMask();
    else await connectOKX();
  };

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const wInfo = WALLETS.find((w) => w.id === walletType);

  return (
    <div className="app">
      <div className="grid-bg" />

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">ArcSwap</span>
          <span className="logo-badge">TESTNET</span>
        </div>
        <div className="header-right">
          <a className="nav-link" href="https://faucet.circle.com" target="_blank" rel="noreferrer">Faucet ↗</a>
          <a className="nav-link" href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">Explorer ↗</a>
          <button className="btn-settings" onClick={() => setShowSettings(true)}>⚙</button>
          {status === "disconnected" && <button className="btn-connect" onClick={() => setShowPicker(true)}>Connect Wallet</button>}
          {status === "connecting" && <button className="btn-connect" disabled>Connecting…</button>}
          {status === "wrong_network" && <button className="btn-connect warn" onClick={switchToArc}>Switch to Arc</button>}
          {status === "connected" && (
            <button className="btn-connect connected" onClick={disconnect}>
              {wInfo?.icon} <span className="dot" /> {short}
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {address && isOnArc && (
          <div className="balances-strip">
            <span className="bal-label">Balances</span>
            <span className="bal-item"><span className="bal-token">USDC</span><span className="bal-amount">{balances.USDC}</span></span>
            <span className="bal-sep">·</span>
            <span className="bal-item"><span className="bal-token">EURC</span><span className="bal-amount">{balances.EURC}</span></span>
            {wInfo && <><span className="bal-sep">·</span><span className="bal-wallet">{wInfo.icon} {wInfo.name}</span></>}
          </div>
        )}

        <div className="tabs">
          {["swap", "pool", "network"].map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Swap Tab */}
        {tab === "swap" && (
          <div className="panel">
            <div className="panel-header">
              <h2>Swap Tokens</h2>
              <span className="panel-sub">Arc Testnet · Real onchain</span>
            </div>

            <div className="token-box">
              <div className="token-box-top">
                <label>You pay</label>
                {address && <button className="btn-max" onClick={() => { const b = balances[tIn]; if (b && b !== "—") setAmt(b); }}>MAX</button>}
              </div>
              <div className="token-row">
                <input type="number" className="amount-input" placeholder="0.00" value={amt}
                  onChange={(e) => { setAmt(e.target.value); reset(); setSwapSt(null); }} />
                <select className="token-select" value={tIn}
                  onChange={(e) => { if (e.target.value === tOut) setTOut(tIn); setTIn(e.target.value); reset(); }}>
                  {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="token-balance">Balance: {balances[tIn]}</div>
            </div>

            <button className="flip-btn" onClick={flip}>⇅</button>

            <div className="token-box">
              <div className="token-box-top"><label>You receive</label></div>
              <div className="token-row">
                <input type="number" className="amount-input" placeholder="0.00"
                  value={txResult ? txResult.amountOut : est} readOnly />
                <select className="token-select" value={tOut}
                  onChange={(e) => { if (e.target.value === tIn) setTIn(tOut); setTOut(e.target.value); reset(); }}>
                  {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="token-balance">Balance: {balances[tOut]}</div>
            </div>

            <div className="info-rows">
              <div className="info-row"><span>Rate</span><span>1 {tIn} ≈ {rate.toFixed(4)} {tOut}</span></div>
              <div className="info-row"><span>Fee</span><span>~0.001 USDC</span></div>
            </div>

            {!address
              ? <button className="btn-primary" onClick={() => setShowPicker(true)}>Connect Wallet</button>
              : !isOnArc
                ? <button className="btn-primary warn" onClick={switchToArc}>Switch to Arc Testnet</button>
                : <button className={`btn-primary ${loading ? "loading" : ""}`} onClick={doSwap}
                    disabled={loading || !amt || parseFloat(amt) <= 0}>
                    {loading ? <><span className="spinner" /> Swapping…</> : `Swap ${tIn} → ${tOut}`}
                  </button>
            }

            {swapSt === "ok" && txResult && (
              <div className="result success">
                <div className="result-title">✓ Swap confirmed</div>
                <div className="result-row"><span>Received</span><strong>{txResult.amountOut} {tOut}</strong></div>
                {txResult.fees?.map((f, i) => (
                  <div className="result-row" key={i}><span>Fee ({f.type})</span><span>{f.amount} {f.token}</span></div>
                ))}
                <a className="result-link" href={txResult.explorerUrl} target="_blank" rel="noreferrer">View on Explorer ↗</a>
              </div>
            )}
            {swapSt === "err" && error && (
              <div className="result error">
                <div className="result-title">✗ Swap failed</div>
                <div className="result-msg">{error}</div>
                {error.includes("Kit Key") && <button className="btn-inline" onClick={() => setShowSettings(true)}>Open Settings →</button>}
              </div>
            )}
          </div>
        )}

        {/* Pool Tab */}
        {tab === "pool" && (
          <div className="panel">
            <div className="panel-header"><h2>Liquidity Pool</h2><span className="panel-sub">StableFX · Arc Testnet</span></div>
            <div className="pool-card">
              <div className="pool-pair">
                <span className="pool-token usdc">USDC</span>
                <span className="pool-slash">/</span>
                <span className="pool-token eurc">EURC</span>
              </div>
              <div className="pool-stats">
                <div className="pool-stat"><span>TVL</span><strong>$124,500</strong></div>
                <div className="pool-stat"><span>APR</span><strong className="green">2.1%</strong></div>
                <div className="pool-stat"><span>Fee</span><strong>0.3%</strong></div>
              </div>
            </div>
            <div className="notice">
              <span className="notice-icon">ℹ</span>
              <div>Arc uses <strong>StableFX</strong> — an RFQ-based FX engine.
                See <a href="https://docs.arc.io/build/stablecoin-fx" target="_blank" rel="noreferrer">StableFX docs ↗</a>
              </div>
            </div>
            <div className="token-box" style={{marginTop:20}}>
              <label style={{color:"var(--text-dim)",fontSize:12,marginBottom:8,display:"block"}}>Deposit USDC</label>
              <div className="token-row">
                <input type="number" className="amount-input" placeholder="0.00" />
                <span className="token-tag">USDC</span>
              </div>
            </div>
            <div className="token-box">
              <label style={{color:"var(--text-dim)",fontSize:12,marginBottom:8,display:"block"}}>Deposit EURC</label>
              <div className="token-row">
                <input type="number" className="amount-input" placeholder="0.00" />
                <span className="token-tag">EURC</span>
              </div>
            </div>
            <button className="btn-primary" onClick={() => alert("See: https://docs.arc.io/build/stablecoin-fx")}>Add Liquidity</button>
          </div>
        )}

        {/* Network Tab */}
        {tab === "network" && (
          <div className="panel">
            <div className="panel-header"><h2>Network Info</h2><span className="panel-sub">Arc Testnet</span></div>
            <div className="info-table">
              <div className="info-kv"><span>Chain ID</span><code>5042</code></div>
              <div className="info-kv"><span>RPC</span><code>https://rpc.testnet.arc.network</code></div>
              <div className="info-kv"><span>Gas token</span><code>USDC</code></div>
              <div className="info-kv"><span>Explorer</span><a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">testnet.arcscan.app ↗</a></div>
            </div>
            <div className="section-title" style={{marginTop:16}}>Contract Addresses</div>
            <div className="info-table">
              <div className="info-kv"><span>USDC</span><code className="addr">0x3600000000000000000000000000000000000000</code></div>
              <div className="info-kv"><span>EURC</span><code className="addr">0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a</code></div>
              <div className="info-kv"><span>FxEscrow</span><code className="addr">0x867650F5eAe8df91445971f14d89fd84F0C9a9f8</code></div>
            </div>
            <div className="quick-links">
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="quick-link">Get tokens ↗</a>
              <a href="https://docs.arc.io" target="_blank" rel="noreferrer" className="quick-link">Docs ↗</a>
              <a href="https://console.circle.com" target="_blank" rel="noreferrer" className="quick-link">Console ↗</a>
            </div>
          </div>
        )}
      </main>

      {/* Wallet Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Wallet</h3>
              <button className="modal-close" onClick={() => setShowPicker(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="wallet-picker-hint">Select a wallet to connect to Arc Testnet.</p>
              <div className="wallet-options">
                {WALLETS.map((w) => (
                  <button key={w.id} className="wallet-option" onClick={() => pickWallet(w.id)}>
                    <span className="wallet-option-icon">{w.icon}</span>
                    <div className="wallet-option-info">
                      <span className="wallet-option-name">{w.name}</span>
                      <span className="wallet-option-desc">{w.desc}</span>
                    </div>
                    <span className="wallet-option-arrow">→</span>
                  </button>
                ))}
              </div>
              <p className="wallet-picker-footer">
                No wallet? <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a> or <a href="https://www.okx.com/web3" target="_blank" rel="noreferrer">OKX Wallet</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">
                Circle Kit Key
                <span className="modal-hint"> — <a href="https://console.circle.com" target="_blank" rel="noreferrer">Get free ↗</a></span>
              </label>
              <input type="text" className="modal-input" placeholder="KIT_KEY:xxxx:xxxx"
                value={kitKey} onChange={(e) => saveKey(e.target.value)} autoComplete="off" />
              <div className="modal-steps">
                <div className="step"><span className="step-n">1</span><span>Sign up at <a href="https://console.circle.com" target="_blank" rel="noreferrer">console.circle.com</a></span></div>
                <div className="step"><span className="step-n">2</span><span>Go to App Kit → copy your Kit Key</span></div>
                <div className="step"><span className="step-n">3</span><span>Paste above and close this dialog</span></div>
                <div className="step"><span className="step-n">4</span><span>Get test tokens at <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">faucet.circle.com</a></span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowSettings(false)}>Save & Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        Built on <a href="https://arc.network" target="_blank" rel="noreferrer">Arc Network</a> · Powered by <a href="https://circle.com" target="_blank" rel="noreferrer">Circle</a>
      </footer>
    </div>
  );
}
