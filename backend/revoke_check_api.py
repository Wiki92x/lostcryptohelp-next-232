# revoke_check_api.py
from flask import Flask, request, jsonify
from web3 import Web3
import os, json, requests
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

LOG_FILE = "revoke_logs.json"
ERC20_ABI = [{
    "constant": True,
    "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "remaining", "type": "uint256"}],
    "type": "function"
}]

def get_token_contracts(wallet, base, key):
    url = f"{base}?module=account&action=tokentx&address={wallet}&page=1&offset=50&sort=desc&apikey={key}"
    try:
        res = requests.get(url)
        tokens = {}
        for tx in res.json().get("result", []):
            tokens[tx["contractAddress"]] = tx.get("tokenSymbol", "UNKNOWN")
        return list(tokens.items())
    except Exception as e:
        print("Token fetch failed:", e)
        return []

def get_spenders(wallet, base, key):
    url = f"{base}?module=account&action=txlist&address={wallet}&page=1&offset=50&sort=desc&apikey={key}"
    try:
        res = requests.get(url)
        spenders = set()
        for tx in res.json().get("result", []):
            if tx.get("input", "").startswith("0x095ea7b3"):
                spenders.add(tx["to"])
        return list(spenders)
    except Exception as e:
        print("Spender fetch failed:", e)
        return []

def log_scan(wallet, chain, approvals):
    entry = {
        "wallet": wallet,
        "chain": chain,
        "timestamp": datetime.utcnow().isoformat(),
        "approvals_found": len(approvals)
    }
    try:
        logs = json.load(open(LOG_FILE)) if os.path.exists(LOG_FILE) else []
        logs.append(entry)
        with open(LOG_FILE, "w") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print("Log failed:", e)

@app.route("/api/revoke-check", methods=["POST"])
def revoke_check():
    data = request.get_json()
    wallet = data.get("wallet")
    chain = data.get("chain", "ETH").upper()

    if chain not in CHAIN_CONFIG:
        return jsonify({"error": "Unsupported chain"}), 400

    config = CHAIN_CONFIG[chain]
    w3 = Web3(Web3.HTTPProvider(config["rpc"]))
    if not w3.isAddress(wallet):
        return jsonify({"error": "Invalid address"}), 400

    token_pairs = get_token_contracts(wallet, config["base"], config["api"])
    spenders = get_spenders(wallet, config["base"], config["api"])
    results = []

    for contract_addr, symbol in token_pairs:
        try:
            token = w3.eth.contract(address=Web3.toChecksumAddress(contract_addr), abi=ERC20_ABI)
            for spender in spenders:
                allowance = token.functions.allowance(wallet, spender).call()
                if allowance > 0:
                    results.append({
                        "token": symbol,
                        "spender": spender,
                        "amount": str(allowance),
                        "tokenAddress": contract_addr
                    })
        except Exception as e:
            print("Allowance check failed:", e)

    log_scan(wallet, chain, results)
    return jsonify({ "approvals": results })

@app.route("/api/revoke-logs", methods=["GET"])
def view_logs():
    try:
        logs = json.load(open(LOG_FILE)) if os.path.exists(LOG_FILE) else []
        return jsonify({ "logs": logs })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500

if __name__ == "__main__":
    app.run(debug=True)
