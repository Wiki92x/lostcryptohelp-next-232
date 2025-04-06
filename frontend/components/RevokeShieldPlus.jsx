// RevokeShieldPlus.jsx – Now With Metamask Revoke Support
import React, { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SiEthereum, SiBinance, SiTron } from "react-icons/si";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export default function RevokeShieldPlus() {
  const [walletsInput, setWalletsInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chain, setChain] = useState("ETH");
  const [txStatus, setTxStatus] = useState(null);

  const parseWallets = () => {
    return walletsInput
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  };

  const scanAll = async () => {
    const wallets = parseWallets();
    setLoading(true);
    setResults([]);

    const scanned = [];
    for (const wallet of wallets) {
      try {
        const res = await fetch("/api/revoke-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, chain })
        });
        const data = await res.json();
        scanned.push({ wallet, approvals: data.approvals || [] });
      } catch (err) {
        scanned.push({ wallet, approvals: [], error: true });
      }
    }

    setResults(scanned);
    setLoading(false);
  };

  const handleRevoke = async (tokenAddress, spender) => {
    try {
      if (!window.ethereum) return alert("Please connect Metamask");
      setTxStatus("pending");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await contract.approve(spender, 0);
      await tx.wait();
      setTxStatus("success");
    } catch (e) {
      console.error(e);
      setTxStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1624] text-white px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">🔄 RevokeShield+</h1>

      <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/10 border border-white/10 shadow-xl p-6 rounded-2xl space-y-4">
        <textarea
          className="w-full p-4 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Paste wallet addresses (one per line or comma-separated)"
          rows={6}
          value={walletsInput}
          onChange={(e) => setWalletsInput(e.target.value)}
        />

        <div className="flex items-center justify-center flex-wrap gap-3">
          <button
            onClick={() => setChain("ETH")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "ETH" ? "bg-purple-600 text-white border-purple-600" : "border-white/20 hover:border-purple-400"
            }`}
          >
            <SiEthereum size={18} /> Ethereum (ERC-20)
          </button>
          <button
            onClick={() => setChain("BSC")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "BSC" ? "bg-yellow-400 text-black border-yellow-400" : "border-white/20 hover:border-yellow-300"
            }`}
          >
            <SiBinance size={18} /> BNB (BEP-20)
          </button>
          <button
            onClick={() => setChain("TRON")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "TRON" ? "bg-green-500 text-white border-green-500" : "border-white/20 hover:border-green-300"
            }`}
          >
            <SiTron size={18} /> USDT (TRC-20)
          </button>
        </div>

        <button
          onClick={scanAll}
          className="w-full bg-gradient-to-r from-red-600 to-pink-500 hover:to-red-700 text-white font-bold py-3 rounded-xl transition"
        >
          {loading ? <LoaderCircle className="animate-spin inline mr-2" size={18} /> : "🔍 Scan Wallets"}
        </button>
      </div>

      <div className="mt-12 space-y-8">
        {results.map((result, i) => (
          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 max-w-4xl mx-auto">
            <h2 className="font-semibold text-lg mb-2">
              {result.wallet} — {result.error ? (
                <span className="text-red-400">❌ Failed</span>
              ) : result.approvals.length > 0 ? (
                <span className="text-yellow-300">🚨 {result.approvals.length} Approvals Found</span>
              ) : (
                <span className="text-green-400">✅ No Risky Approvals</span>
              )}
            </h2>

            {result.approvals.length > 0 && (
              <ul className="space-y-2 text-sm">
                {result.approvals.map((a, idx) => (
                  <li
                    key={idx}
                    className="bg-white/10 p-3 rounded-lg text-white flex flex-col sm:flex-row sm:justify-between sm:items-center"
                  >
                    <div>
                      <p><strong>Token:</strong> {a.token}</p>
                      <p><strong>Spender:</strong> {a.spender}</p>
                      <p><strong>Amount:</strong> {a.amount}</p>
                    </div>
                    <button
                      className="mt-2 sm:mt-0 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm"
                      onClick={() => handleRevoke(a.tokenAddress, a.spender)}
                    >
                      Revoke Access
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {txStatus === "pending" && <p className="text-yellow-400 mt-2">⏳ Transaction pending...</p>}
            {txStatus === "success" && <p className="text-green-400 mt-2">✅ Revoked successfully!</p>}
            {txStatus === "error" && <p className="text-red-400 mt-2">❌ Revoke failed. Try again.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
