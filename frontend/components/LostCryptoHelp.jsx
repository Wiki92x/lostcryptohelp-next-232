import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { LoaderCircle, Sun, Moon } from "lucide-react";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export default function LostCryptoHelp() {
  const [darkMode, setDarkMode] = useState(true);
  const [walletInput, setWalletInput] = useState("");
  const [chain, setChain] = useState("ETH");
  const [approvals, setApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  const pages = [
    { id: "scan", title: "DeepTrace™", description: "Forensic wallet scanner" },
    { id: "revoke", title: "RevokeShield", description: "Token Approval Auditor" },
    { id: "rugpull", title: "RugPull Watch", description: "Live contract risk monitor" },
    { id: "gas", title: "GasRescue", description: "Stuck fund recovery toolkit" },
    { id: "cred", title: "CredCheck", description: "Wallet reputation analyzer" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("revokeScan");
    if (saved) {
      const parsed = JSON.parse(saved);
      setWalletInput(parsed.wallet);
      setChain(parsed.chain);
      setApprovals(parsed.approvals || []);
    }
  }, []);

  const fetchApprovals = async () => {
    setLoadingApprovals(true);
    setApprovals([]);
    try {
      const res = await fetch("/api/revoke-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletInput, chain })
      });
      const data = await res.json();
      const result = data.approvals || [];
      setApprovals(result);
      localStorage.setItem("revokeScan", JSON.stringify({ wallet: walletInput, chain, approvals: result }));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const revokeAccess = async (token, spender) => {
    try {
      if (!window.ethereum) return alert("Please connect Metamask");
      setTxStatus("pending");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(token, ERC20_ABI, signer);
      const tx = await contract.approve(spender, 0);
      await tx.wait();
      setTxStatus("success");
    } catch (e) {
      console.error(e);
      setTxStatus("error");
    }
  };

  return (
    <div className={darkMode ? "bg-[#0B0F1A] text-white min-h-screen" : "bg-gray-100 text-black min-h-screen"}>
      {/* NAVBAR */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-white/10 sticky top-0 z-50">
        <div className="text-xl font-bold tracking-tight">LostCryptoHelp</div>
        <nav className="space-x-4 text-sm flex items-center">
          {pages.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="hover:text-purple-400">
              {p.title}
            </a>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white text-black dark:bg-black dark:text-white rounded-full p-2"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </nav>
      </header>

      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-4 py-24 bg-gradient-to-br from-[#121C2B] to-[#1B263B]"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold max-w-3xl mx-auto leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
          One-Click Crypto Safety Tools
        </h1>
        <p className="text-gray-300 mt-6 max-w-xl mx-auto">
          Revoke contracts. Scan wallets. Rescue stuck funds. All automated.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-12 px-6">
          {pages.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl shadow text-center">
              <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
              <p className="text-sm text-gray-400">{p.description}</p>
            </a>
          ))}
        </div>
      </motion.section>

      {/* TOOL SECTIONS */}
      {pages.map((p) => (
        <section key={p.id} id={p.id} className="px-6 py-24 bg-[#0F1624] border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{p.title}</h2>
            <p className="text-gray-400 mb-8">{p.description}</p>

            {p.id === "revoke" ? (
              <div className="bg-white/5 p-6 rounded-xl space-y-4 text-left">
                <input
                  className="w-full p-3 rounded-md bg-white/10 text-white placeholder-gray-400"
                  placeholder="Enter wallet address"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full p-3 rounded-md bg-white/10 text-white"
                >
                  <option value="ETH">Ethereum</option>
                  <option value="BSC">Binance Smart Chain</option>
                </select>
                <button
                  onClick={fetchApprovals}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl"
                >
                  {loadingApprovals ? <LoaderCircle className="animate-spin inline mr-2" size={18} /> : "🔍 Scan Approvals"}
                </button>

                {approvals.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Detected Approvals</h4>
                    <ul className="space-y-3">
                      {approvals.map((a, i) => (
                        <li key={i} className="bg-white/10 rounded-md p-4">
                          <p><strong>Token:</strong> {a.token}</p>
                          <p><strong>Spender:</strong> {a.spender}</p>
                          <p><strong>Allowance:</strong> {a.amount}</p>
                          <button
                            className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 text-sm rounded"
                            onClick={() => revokeAccess(a.tokenAddress, a.spender)}
                          >
                            Revoke Access
                          </button>
                        </li>
                      ))}
                    </ul>
                    {txStatus === "pending" && <p className="text-yellow-400 mt-4">⏳ Transaction pending...</p>}
                    {txStatus === "success" && <p className="text-green-400 mt-4">✅ Revoked successfully!</p>}
                    {txStatus === "error" && <p className="text-red-400 mt-4">❌ Transaction failed</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 p-6 rounded-xl shadow">
                <p className="text-gray-300">[Coming soon: {p.title}]</p>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-500 py-10">
        &copy; {new Date().getFullYear()} LostCryptoHelp. Built with 🧠
      </footer>
    </div>
  );
}
