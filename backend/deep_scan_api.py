# deep_scan_api.py (Supercharged DeepTrace Engine)

from flask import Flask, request, jsonify
from web3 import Web3
import requests
import os
from datetime import datetime

app = Flask(__name__)

CHAIN_CONFIG = {
    "ETH": {
        "rpc": os.getenv("ETH_NODE") or "https://rpc.ankr.com/eth",
        "api": os.getenv("ETHERSCAN_API_KEY") or "YourETHKey",
        "base": "https://api.etherscan.io/api"
    },
    "BSC": {
        "rpc": os.getenv("BSC_NODE") or "https://bsc-dataseed1.binance.org",
        "api": os.getenv("BSCSCAN_API_KEY") or "YourBSCKey",
        "base": "https://api.bscscan.com/api"
    }
}

# Mocked blacklist for demo
BLACKLISTED_CONTRACTS = [
    "0x000000000000000000000000000000000000dead",
    "0x1111111254EEB25477B68fb85Ed929f73A960582"
]

@app.route("/api/deep-scan", methods=["POST"])
def deep_scan():
    data = request.get_json()
    wallet = data.get("wallet")
    chain = data.get("chain", "ETH").upper()

    if chain not in CHAIN_CONFIG:
        return jsonify({"error": "Unsupported chain"}), 400

    config = CHAIN_CONFIG[chain]
    w3 = Web3(Web3.HTTPProvider(config["rpc"]))

    if not w3.isAddress(wallet):
        return jsonify({"error": "Invalid wallet address"}), 400

    # 1. Pull latest 100 transactions
    tx_url = f"{config['base']}?module=account&action=txlist&address={wallet}&startblock=0&endblock=99999999&sort=desc&apikey={config['api']}"
    try:
        res = requests.get(tx_url)
        txs = res.json().get("result", [])[:100]
    except:
        txs = []

    # 2. Analyze transactions
    failed_txs = [tx for tx in txs if tx.get("isError") == "1"]
    blacklisted = [tx for tx in txs if tx.get("to", "").lower() in BLACKLISTED_CONTRACTS]
    unverified_count = sum(1 for tx in txs if not tx.get("contractAddress") and len(tx.get("input", "")) > 10)

    # 3. Score system
    score = 3.0
    labels = []
    alerts = []

    if failed_txs:
        alerts.append({"type": "Failed Tx", "severity": "Medium", "description": f"{len(failed_txs)} failed transactions found"})
        score += 1.5

    if blacklisted:
        alerts.append({"type": "Blacklist Hit", "severity": "High", "description": "Interaction with known malicious contracts"})
        score += 3.0
        labels.append("Interacted With Malicious Contract")

    if unverified_count > 5:
        alerts.append({"type": "Unverified Contracts", "severity": "Medium", "description": f"{unverified_count} contract interactions unverified"})
        score += 1.5
        labels.append("Likely Victim Wallet")

    if score > 8:
        labels.append("High Risk Wallet")
    elif score > 5:
        labels.append("Moderate Risk")
    else:
        labels.append("Low Risk")

    # 4. Smart Summary
    summary = {
        "transactions": len(txs),
        "failed": len(failed_txs),
        "blacklisted_hits": len(blacklisted),
        "unverified_interactions": unverified_count
    }

    ai_summary = "This wallet shows signs of risk including failed transactions and interaction with potentially malicious contracts. Recommend reviewing token approvals and history." if score > 6 else "Wallet appears clean under current scan metrics."

    result = {
        "wallet": wallet,
        "chain": chain,
        "timestamp": datetime.utcnow().isoformat(),
        "score": round(score, 2),
        "alerts": alerts,
        "labels": labels,
        "summary": summary,
        "ai_summary": ai_summary
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
