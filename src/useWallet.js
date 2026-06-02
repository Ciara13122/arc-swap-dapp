import { useState, useCallback, useEffect } from "react";

const ARC_TESTNET = {
  chainId: "0x4CE812", // 5042 decimal
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

/**
 * Detect which EIP-1193 provider to use.
 *
 * When both MetaMask and OKX are installed, window.ethereum is usually
 * hijacked by whichever extension loaded last.  Modern MetaMask exposes
 * window.ethereum.providers[] so we can pick by isMetaMask / isOKExWallet.
 * OKX also injects window.okxwallet as a dedicated handle.
 */
function getProvider(walletType) {
  if (walletType === "metamask") {
    // Multiple providers array (MetaMask MV3 + another extension)
    if (window.ethereum?.providers) {
      const mm = window.ethereum.providers.find((p) => p.isMetaMask && !p.isOKExWallet);
      if (mm) return mm;
    }
    // Single provider — check it is MetaMask
    if (window.ethereum?.isMetaMask) return window.ethereum;
    return null;
  }

  if (walletType === "okx") {
    // OKX dedicated injection (most reliable)
    if (window.okxwallet) return window.okxwallet;
    // Fallback: providers array
    if (window.ethereum?.providers) {
      const okx = window.ethereum.providers.find((p) => p.isOKExWallet);
      if (okx) return okx;
    }
    if (window.ethereum?.isOKExWallet) return window.ethereum;
    return null;
  }

  return null;
}

export function useWallet() {
  const [address, setAddress]           = useState(null);
  const [chainId, setChainId]           = useState(null);
  const [walletType, setWalletType]     = useState(null); // "metamask" | "okx"
  const [provider, setProvider]         = useState(null);
  const [status, setStatus]             = useState("disconnected");
  // disconnected | connecting | connected | wrong_network

  const isOnArc = chainId?.toLowerCase() === ARC_TESTNET.chainId.toLowerCase();

  // ── internal helper ──────────────────────────────────────────────────────
  const connectWithProvider = useCallback(async (prov, type) => {
    setStatus("connecting");
    try {
      const accounts = await prov.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      setAddress(addr);
      setProvider(prov);
      setWalletType(type);

      // Switch / add Arc Testnet
      try {
        await prov.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARC_TESTNET.chainId }],
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await prov.request({
            method: "wallet_addEthereumChain",
            params: [ARC_TESTNET],
          });
        }
      }

      const currentChain = await prov.request({ method: "eth_chainId" });
      setChainId(currentChain);
      setStatus(currentChain?.toLowerCase() === ARC_TESTNET.chainId.toLowerCase() ? "connected" : "wrong_network");
    } catch (err) {
      console.error(`${type} connection error:`, err);
      setStatus("disconnected");
      setProvider(null);
      setWalletType(null);
    }
  }, []);

  // ── public API ────────────────────────────────────────────────────────────
  const connectMetaMask = useCallback(async () => {
    const prov = getProvider("metamask");
    if (!prov) {
      alert("MetaMask not found.\n\nInstall it from https://metamask.io and refresh.");
      return;
    }
    await connectWithProvider(prov, "metamask");
  }, [connectWithProvider]);

  const connectOKX = useCallback(async () => {
    const prov = getProvider("okx");
    if (!prov) {
      alert("OKX Wallet not found.\n\nInstall it from https://www.okx.com/web3 and refresh.");
      return;
    }
    await connectWithProvider(prov, "okx");
  }, [connectWithProvider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setStatus("disconnected");
    setProvider(null);
    setWalletType(null);
  }, []);

  const switchToArc = useCallback(async () => {
    if (!provider) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_TESTNET.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [ARC_TESTNET],
        });
      }
    }
  }, [provider]);

  // ── event listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setStatus("disconnected");
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chain) => {
      setChainId(chain);
      setStatus(chain?.toLowerCase() === ARC_TESTNET.chainId.toLowerCase() ? "connected" : "wrong_network");
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider]);

  return {
    address,
    chainId,
    walletType,
    provider,
    status,
    isOnArc,
    connectMetaMask,
    connectOKX,
    disconnect,
    switchToArc,
  };
}
