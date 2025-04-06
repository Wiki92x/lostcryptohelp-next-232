// DeepTrace.jsx – Enhanced UI with Chain Toggle + Glass Morphism + USDT TRC20 Support
import React, { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SiEthereum, SiBinance, SiTron } from "react-icons/si";

export default function DeepTrace() {
  const [wallet, setWallet] = useState("");
  const [chain, setChain] = useState("ETH");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDeepScan = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/deep-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, chain })
      });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error("Scan failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1624] text-white px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">🔍 DeepTrace™</h1>

      <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/10 border border-white/10 shadow-xl p-6 rounded-2xl space-y-4">
        <input
          className="w-full p-4 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />

        <div className="flex items-center justify-center flex-wrap gap-3">
          <button
            onClick={() => setChain("ETH")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "ETH" ? "bg-purple-600 text-white border-purple-600" : "border-white/20 hover:border-purple-400"
            }`}
          >
            <SiEthereum size={18} /> Ethereum
          </button>
          <button
            onClick={() => setChain("BSC")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "BSC" ? "bg-yellow-500 text-black border-yellow-500" : "border-white/20 hover:border-yellow-400"
            }`}
          >
            <SiBinance size={18} /> BSC
          </button>
          <button
            onClick={() => setChain("TRON")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              chain === "TRON" ? "bg-red-500 text-white border-red-500" : "border-white/20 hover:border-red-400"
            }`}
          >
            <SiTron size={18} /> USDT (TRC-20)
          </button>
        </div>

        <button
          onClick={runDeepScan}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition"
        >
          {loading ? <LoaderCircle className="animate-spin inline mr-2" size={18} /> : "Run Deep Scan"}
        </button>
      </div>

      {report && (
        <div className="mt-12 max-w-3xl mx-auto bg-white/10 p-6 rounded-xl space-y-4 border border-white/10">
          <h2 className="text-2xl font-bold">📊 Risk Score: <span className="text-yellow-300">{report.score}/10</span></h2>

          <div className="text-sm text-gray-300">
            <p><strong>Wallet:</strong> {report.wallet}</p>
            <p><strong>Chain:</strong> {report.chain}</p>
            <p><strong>Scanned:</strong> {new Date(report.timestamp).toLocaleString()}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">🚩 Alerts</h3>
            <ul className="list-disc list-inside space-y-1">
              {report.alerts.map((alert, i) => (
                <li key={i} className="text-sm text-red-400">
                  <strong>{alert.severity}:</strong> {alert.description}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">🏷 Labels</h3>
            <div className="flex flex-wrap gap-2">
              {report.labels.map((label, i) => (
                <span key={i} className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">📊 Summary</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Transactions Scanned: {report.summary.transactions}</li>
              <li>Failed TXs: {report.summary.failed}</li>
              <li>Blacklisted Hits: {report.summary.blacklisted_hits}</li>
              <li>Unverified Contracts: {report.summary.unverified_interactions}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">🧠 AI Summary</h3>
            <p className="text-green-300 text-sm">{report.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
