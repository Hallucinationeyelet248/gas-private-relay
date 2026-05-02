# GAS Private Relay

A domain-fronted local proxy that uses **Google Apps Script (GAS)** as the public relay layer and a **private server backend** as the final egress.

Suggested GitHub repository name: **`gas-private-relay`**

| [English](README.md) | [Persian](README_FA.md) |
| :---: | :---: |

## Disclaimer

This project is provided for **educational, testing, and research purposes only**.

- It is provided **as is**, without warranty of any kind.
- You are responsible for your own deployment, certificates, network exposure, and legal compliance.
- If you use Google Apps Script or any VPS/provider, you are responsible for complying with their terms, quotas, and acceptable use policies.
- Review the repository license before using, modifying, or redistributing this project.

---

## What changed in this edition?

This repository is the **private-backend edition** of the original GAS + Cloudflare flow.

The architectural change is intentionally small:

- **Cloudflare Worker is removed**
- **Your own server** becomes the relay backend

New traffic path:

```text
Client -> Local Proxy -> Google-facing front -> Google Apps Script -> Private Relay Server -> Target website
```

From the network perspective, the local client still uses the Google-facing path. The final outbound request is now performed by **your own VPS / server**, not Cloudflare.

---

## Key advantage over the original Cloudflare edition

This is the main reason to use this edition.

With the original Cloudflare-worker model, some websites can behave poorly because the final egress comes from public Cloudflare infrastructure. In practice, that can lead to:

- challenge pages,
- stricter bot/risk scoring,
- direct-IP or worker-related restrictions,
- or inconsistent behavior on sensitive services.

With **GAS Private Relay**, the final egress is **your own server IP**. That usually makes the traffic path more predictable and often improves compatibility with services that are sensitive to Cloudflare-worker egress, including sites such as **ChatGPT**, **Gemini**, and other challenge-protected platforms.

**Important accuracy note:** this improves the situation significantly compared with the original edition, but it does **not** guarantee universal access to every website. Final compatibility still depends on:

- your server IP reputation,
- geolocation,
- TLS / certificate trust,
- target-site policy,
- and whether the destination blocks proxy-style traffic in general.

So the honest public summary is:

> Compared with the original Cloudflare-based edition, this private-backend edition is designed to reduce Cloudflare-specific challenge and compatibility problems by moving final egress to your own server.

---

## Why use the private-backend model?

- No dependency on Cloudflare Workers
- No Cloudflare-specific worker errors such as edge restrictions or direct-IP issues
- Outbound traffic exits from **your own server**, not public Cloudflare worker IP ranges
- Better real-world compatibility with challenge-sensitive websites than the original Cloudflare edition
- Easier to reason about and debug end-to-end
- Minimal change from the original project design

---

## Original edition vs this edition

| Topic | Original GAS + Cloudflare edition | GAS Private Relay edition |
| :--- | :--- | :--- |
| Final egress | Cloudflare Worker / Cloudflare edge | Your own VPS / server |
| Cloudflare-specific errors | Possible | Eliminated at the egress layer |
| Cloudflare challenge sensitivity | Can be a problem on some services | Usually reduced because Cloudflare is no longer the final relay |
| IP ownership | Shared/public infrastructure | Your own server IP |
| Behavior on sites like ChatGPT / Gemini | May fail depending on worker/IP behavior | Often better, because the exit IP is your own server |
| Migration effort | Baseline | Small change from original flow |

---

## Repository layout

```text
gas-private-relay/
├── backend/
│   ├── package.json
│   └── server.js               # personal relay backend (Node.js)
├── script/
│   └── Code.gs                 # Google Apps Script bridge
├── src/                        # local proxy implementation
├── config.example.json
├── main.py
├── setup.py
├── run.bat
└── run.sh
```

---

## Quick start

### 1) Download the project

```bash
git clone https://github.com/<your-user>/gas-private-relay.git
cd gas-private-relay
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

If direct access to PyPI is blocked:

```bash
pip install -r requirements.txt -i https://mirror-pypi.runflare.com/simple/ --trusted-host mirror-pypi.runflare.com
```

---

## 2) Set up the private relay backend

Requirements:

- Ubuntu/Debian or another Linux server
- Node.js **18+**
- A public IP or reachable server address

Install Node.js and PM2:

```bash
sudo apt update
sudo apt install -y nodejs npm
sudo npm install -g pm2
```

Copy the `backend/` folder to your server, then run:

```bash
cd backend
pm2 start server.js --name gas-private-relay
pm2 save
```

Default listen address:

- Host: `0.0.0.0`
- Port: `8080`

Health check:

```bash
curl http://YOUR_SERVER_IP:8080
```

Expected response:

```json
{"ok":true,"name":"gas-private-relay-backend","status":"active"}
```

### Open the firewall

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

If you use another firewall or cloud security group, allow inbound TCP on port `8080` there as well.

---

## 3) Set up Google Apps Script

1. Open [Google Apps Script](https://script.google.com/)
2. Create a **New project**
3. Delete the default code
4. Open [`script/Code.gs`](script/Code.gs) from this repository and paste it into the editor
5. Edit these values:

```javascript
const AUTH_KEY = "CHANGE_ME_TO_A_STRONG_SECRET";
const RELAY_URL = "http://YOUR_SERVER_IP:8080";
```

- `AUTH_KEY` must match the local client config
- `RELAY_URL` must point to your private backend

6. Click **Deploy -> New deployment**
7. Choose **Web app**
8. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
9. Deploy and copy the **Deployment ID**

Whenever you edit `Code.gs`, use **Deploy -> Manage deployments -> Edit -> New version -> Deploy** so the live web app is updated.

---

## 4) Configure the local client

This edition keeps the local client almost unchanged. Create `config.json` using `config.example.json` as a base, or just run the setup wizard:

```bash
python setup.py
```

Recommended public-sharing / LAN-friendly settings:

```json
{
  "listen_host": "0.0.0.0",
  "lan_sharing": true,
  "socks5_port": 10808
}
```

Important values:

- `script_id`: your Apps Script deployment ID
- `auth_key`: must match `AUTH_KEY` in `Code.gs`
- `google_ip`: a reachable Google edge IP
- `front_domain`: usually `www.google.com`

Then start the client:

```bash
python main.py
```

Or use the launchers:

- Windows: `run.bat`
- Linux/macOS: `run.sh`

---

## 5) Client usage

You can use the built-in HTTP proxy and SOCKS5 proxy with tools such as:

- v2rayN
- FoxyProxy
- Browser/system proxy settings

Typical ports in this edition:

- HTTP proxy: `8085`
- SOCKS5 proxy: `10808`

If you want other devices on your LAN to use the proxy, point them to:

```text
http://YOUR_PC_LAN_IP:8085
socks5://YOUR_PC_LAN_IP:10808
```

Make sure your OS firewall allows inbound access on those local ports.

---

## Certificates

This project performs local MITM for HTTPS proxying. If HTTPS websites fail to load correctly, install the certificate generated in the `ca/` directory and trust it as a **Trusted Root** on the device that uses the proxy.

You can use:

```bash
python main.py --install-cert
```

If needed, remove it with:

```bash
python main.py --uninstall-cert
```

---

## Troubleshooting

### Apps Script returns `unauthorized`

`auth_key` in `config.json` does not match `AUTH_KEY` in `script/Code.gs`.

### Backend is not reachable

Check:

- `pm2 status`
- `curl http://YOUR_SERVER_IP:8080`
- firewall / security group rules
- that `RELAY_URL` in Apps Script points to the correct IP and port

### Changes in Apps Script do not take effect

Re-deploy with a **new version** from **Manage deployments**.

### HTTPS pages still fail

Install the generated CA certificate on the client device and trust it.

### ChatGPT, Gemini, or other sensitive websites still do not work

This edition removes **Cloudflare-specific** egress problems, which is its main advantage over the original version. But final behavior still depends on **your server IP reputation**, region, and the target service policy.

If a site still fails:

- test with a better-quality VPS IP,
- verify the local CA is trusted,
- confirm the site is not blocking your chosen region,
- and confirm the backend server is reachable without packet loss or TLS interception.

---

## Suggested public repo description

> Domain-fronted local proxy using Google Apps Script as the relay bridge and a private server backend as the final egress path, designed to avoid Cloudflare-worker-specific compatibility issues.

---

## Acknowledgement

This repository is based on ideas and prior work from the MasterHttpRelay ecosystem and has been adapted into a clearer **GAS-to-Private-Relay** layout for public deployment and reuse.
