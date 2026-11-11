# 扫码安全官 (Scan-to-Ask Safety Coach)

A mobile-first, Chinese/English MVP for university machine-training safety. Each QR code opens one machine's SOP-based briefing, AI Q&A, three-question quiz, and server-saved result. A password-protected instructor dashboard shows attempts, pass rates, common questions, difficult questions, and unanswered escalations.

## 中文摘要

这是一个无需前端构建工具的完整 Node.js 应用。复制环境变量文件、安装依赖后即可启动。车床和钻床已提供**示例**安全规程；正式使用前必须替换为实训中心的正式规程。AI 只接收当前设备的规程，回答必须引用规则；规程未覆盖或 AI 失败时会明确提示询问老师。简报和题目有备用内容，实时问答需要有效 API Key。学生页、教师仪表盘和二维码页均可切换中文/English，学生设备会记住所选语言。

> **Safety notice:** The files in `sops/` are realistic samples, not approved operating procedures. Replace the header-marked sample content with the training center's official SOPs before real use. Passing this quiz does not replace instructor supervision or formal certification.

## 1. Requirements

- Windows 10/11
- Node.js 18 or newer (Node 20 LTS is recommended): <https://nodejs.org/>
- A DeepSeek API key for live Q&A and AI-generated content. The app starts without one, using fallback briefings/quizzes; Q&A will honestly report that the AI is unavailable.

Check Node in PowerShell:

```powershell
node -v
npm -v
```

## 2. Start on Windows (three steps)

Open PowerShell in this project folder, then run:

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Open <http://localhost:3000/qr>. Stop the server with `Ctrl+C`.

For the full AI demo, edit `.env` before `npm start`:

```dotenv
API_KEY=your_real_key
API_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-chat
ADMIN_PASSWORD=choose_a_private_password
PUBLIC_BASE_URL=http://localhost:3000
```

Never put the API key in HTML or JavaScript. Only the Node server reads it. Restart the server after changing `.env`, `machines.json`, or SOP files.

## 3. Get an API key

1. Create/sign in to a DeepSeek platform account at <https://platform.deepseek.com/>.
2. Open the API Keys section and create a key.
3. Ensure the account has API balance/access.
4. Paste the key into `API_KEY` in `.env`. Do not share it or commit `.env`.

## 4. Change the model provider

The server uses an OpenAI-compatible `/chat/completions` request. Change only `.env`; no code changes are needed. Example for Qwen's compatible mode:

```dotenv
API_KEY=your_qwen_key
API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
```

The provider must support JSON-object responses. If its response is invalid or a request fails, briefing/quiz generation uses safe fallbacks and live Q&A falls back to a deterministic local SOP matcher that cites real rules, refuses unsafe actions, and escalates uncovered questions. Cached content is tied to the SOP file hash and stored separately for Chinese and English.

## 5. Use the student flow

1. Open `/m/lathe` or `/m/drill-press` (or scan a QR code). Use the **English/中文** button to switch; the browser remembers the choice. To link directly, append `?lang=en` or `?lang=zh`.
2. Enter name and student ID. They are stored only in that browser's `localStorage` for later visits.
3. Read the five-item **60秒安全简报 / 60-second safety briefing**.
4. Optionally ask the Safety Coach a question. Answers cite `【规则N】` or `[Rule N]`; out-of-SOP questions are escalated.
5. Complete all three quiz questions. All must be correct. Every attempt, including retries, is saved.
6. A green pass card shows the name, student ID, machine, and timestamp. A failed result lists rules to re-read.

Useful local URLs:

- Student, lathe: <http://localhost:3000/m/lathe>
- Student, drill press, English: <http://localhost:3000/m/drill-press?lang=en>
- QR cards: <http://localhost:3000/qr> and <http://localhost:3000/qr?lang=en>
- Instructor dashboard: <http://localhost:3000/admin> and <http://localhost:3000/admin?lang=en>
- Health check: <http://localhost:3000/health>

## 6. Add a new machine

Only two data changes are required:

1. Create `sops/<id>.md` with numbered rules in this exact form: `规则1：...`.
2. Add one entry to `machines.json`:

```json
{
  "id": "milling-machine",
  "name": "铣床",
  "nameEn": "Milling Machine",
  "description": "金属加工铣床｜旋转刀具作业",
  "descriptionEn": "Metalworking milling machine | Rotating cutter operations"
}
```

Use lowercase letters, numbers, and hyphens for the ID. `nameEn` and `descriptionEn` are optional and fall back to the Chinese values. Restart the server. Its page is `/m/milling-machine`, and `/qr` includes it automatically. Briefings and quizzes generate from that SOP. The two sample machines have hand-written bilingual fallbacks; a new machine gets generic SOP-derived fallbacks, whose correct rule text remains in the original SOP language unless AI translation is available, so test both languages before a demo.

Changing an existing SOP automatically invalidates its cached AI briefing and quiz through a SHA-256 content hash.

## 7. Let a phone reach the page

### Same Wi-Fi (simplest)

1. Keep the computer and phone on the same Wi-Fi/network.
2. Run `ipconfig` in PowerShell. Find your wireless adapter's `IPv4 Address`, for example `192.168.1.23`.
3. Set this in `.env`, using your actual address:

```dotenv
PUBLIC_BASE_URL=http://192.168.1.23:3000
```

4. Restart `npm start`, open `/qr` on the computer, and scan with the phone.
5. If it does not connect, allow Node.js through Windows Defender Firewall on **Private** networks. Avoid guest Wi-Fi/client isolation.

`localhost` means the phone itself, so QR codes using `localhost` will not work on a phone.

### Tunnel (different networks)

Run a tunnel tool in a second terminal, for example `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`. Copy its HTTPS address into `.env`:

```dotenv
PUBLIC_BASE_URL=https://your-random-address.trycloudflare.com
```

Restart and reprint/reopen `/qr`. Anyone with a tunnel link may access student pages, so protect the admin password and close the tunnel after the demo.

## 8. Deploy to Railway (public QR scanning)

Railway runs this app as a container and gives you a public HTTPS URL that any phone can reach. A `Dockerfile`, `.dockerignore`, and `railway.json` are already in the repo.

1. Push this project to a GitHub repo.
2. On Railway, click **New Project → Deploy from GitHub repo** and select the repo. Railway detects the `Dockerfile` automatically.
3. In the service **Variables**, set:
   - `ADMIN_PASSWORD` — choose a strong password (do not use the default).
   - `PUBLIC_BASE_URL` — leave blank for the first deploy.
   - `API_KEY`, `API_BASE_URL`, `MODEL_NAME` — only if you want live AI Q&A. Without them, the local SOP fallback answers questions.
   - `RATE_LIMIT_PER_MINUTE` — optional, defaults to 60.
4. Deploy. Once it starts, copy Railway’s assigned domain, e.g. `https://scan-safety-coach-production.up.railway.app`.
5. Go back to **Variables** and set `PUBLIC_BASE_URL` to that exact HTTPS URL (no trailing slash). Redeploy so the QR codes use the public address.
6. **Add a volume** (Settings → Volumes → mount at `/app/data`). Without it, every restart/redeploy wipes the database (attempts, questions, cached briefings/quizzes).
7. Open `https://<your-domain>/qr` and scan a code with your phone — it should open the machine page.

To preview the dashboard on Railway, open `https://<your-domain>/admin` and sign in with `admin` / your `ADMIN_PASSWORD`.

## 9. Print QR codes

1. Confirm `PUBLIC_BASE_URL` is the address phones will use, then restart.
2. Open `/qr` for Chinese or `/qr?lang=en` for English and verify each printed URL. English QR codes open student pages with `?lang=en`. If `PUBLIC_BASE_URL` is still `localhost`, a warning banner explains phones cannot open those codes — set a LAN IP or tunnel URL first.
3. Click **打印全部二维码 / Print all QR codes**. Each machine prints on its own A4 page with a large name and QR code.
4. Scan the printed codes before attaching them beside the correct machines.

## 10. Instructor dashboard and DEMO data

Open `/admin`. Browser Basic Auth credentials:

- Username: `admin`
- Password: `ADMIN_PASSWORD` from `.env` (default in the example: `admin123`)

The dashboard refreshes every 10 seconds and has an **English/中文** switch. It includes recent attempts, per-machine pass rates, top 10 questions, high-failure quiz questions, unanswered escalations, quiz regeneration, and CSV export. Regeneration and export use the selected dashboard language. CSV includes a DEMO/real column and a UTF-8 BOM for Excel.

Real attempts are empty at first. To preview the dashboard with exactly 12 labeled DEMO attempts:

```powershell
npm run seed-demo
```

To remove only those DEMO rows (student IDs beginning `DEMO-`) and keep real attempts:

```powershell
npm run clear-demo
```

Run `clear-demo` before the judged live demonstration.

## 11. Troubleshooting

| Symptom | What to do |
|---|---|
| `npm install` fails on `better-sqlite3` | Confirm Node 18/20 is installed, then delete `node_modules` and run `npm install` again. If no prebuilt binary is available, install Microsoft C++ Build Tools and retry. |
| Browser cannot reach the app | Confirm `npm start` is still running and shows port 3000. Visit `/health`. Check whether another program uses the port; set `PORT=3001` and update `PUBLIC_BASE_URL` if needed. |
| Phone QR opens nothing | Do not use `localhost`. Set the computer LAN IP or tunnel HTTPS URL in `PUBLIC_BASE_URL`, restart, and rescan. Check firewall and Wi-Fi client isolation. |
| Q&A says it cannot connect | Check `API_KEY`, provider base URL, model name, account balance, and internet access. The server terminal logs the provider error. Use the retry button after fixing it. |
| Briefing/quiz says `fallback` or uses fixed questions | This is intentional when AI is missing/failing. The demo remains usable. Restore the API settings, then click **重新生成题目**; SOP changes also regenerate content. |
| AI says a question is not covered | This is intentional safe behavior. The question appears in the dashboard escalation list. Add an official rule only after instructor review. |
| Too many questions / HTTP 429 | Q&A allows `RATE_LIMIT_PER_MINUTE` requests per IP per minute (default 60). Wait one minute, or raise the limit in `.env` for demos over a shared tunnel. |
| Cannot sign in to `/admin` | Username is `admin`; password is exactly `ADMIN_PASSWORD`. Restart after editing `.env`. |
| Dashboard looks empty | Complete a quiz or run `npm run seed-demo`. Remove preview records with `npm run clear-demo`. |
| Quiz submission says questions changed | Reload and answer the current three questions. The SOP or admin regeneration may have changed the cache. |
| Need a clean local database | Stop the server, back up `data/safety.db`, then delete it if you intentionally want to erase all attempts/logs. Restart to recreate empty tables. |

Before the event, work through `TESTING.md`, pre-open the dashboard and QR page, and cache both machines' briefing/quiz content in every language you will demonstrate.
