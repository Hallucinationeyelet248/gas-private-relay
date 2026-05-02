# GAS Private Relay

<div dir="rtl">

یک نسخه‌ی عمومی و ساده‌سازی‌شده از معماری **GAS-to-Private-Relay**:
پروکسی محلی شما از مسیر **Google Apps Script** عبور می‌کند و خروج نهایی ترافیک از طریق **سرور شخصی خودتان** انجام می‌شود.

**اسم پیشنهادی برای ریپوی گیت‌هاب:** `gas-private-relay`

| [English](README.md) | [Persian](README_FA.md) |
| :---: | :---: |

---

## این نسخه چه فرقی با نسخه قبلی دارد؟

تغییر معماری عمداً کوچک نگه داشته شده است:

- **Cloudflare Worker حذف شده**
- **سرور شخصی شما** جای آن را گرفته است

مسیر نهایی ترافیک:

```text
کلاینت -> پروکسی محلی -> مسیر گوگل -> Google Apps Script -> سرور شخصی -> سایت مقصد
```

یعنی بخش Domain Fronting و عبور از لایه‌ی Google حفظ می‌شود، اما خروج نهایی دیگر از کلادفلر نیست؛ از VPS یا سرور خودتان است.

---

## مزیت اصلی این نسخه نسبت به نسخه اصلی

این مهم‌ترین دلیل استفاده از این نسخه است.

در مدل قبلی که خروج نهایی از Cloudflare Worker انجام می‌شد، بعضی وب‌سایت‌ها ممکن بود بهتر عمل نکنند یا رفتارشان ناپایدار باشد، چون خروجی از زیرساخت عمومی Cloudflare انجام می‌شد. در عمل این موضوع می‌تواند باعث این موارد شود:

- صفحه‌های challenge،
- سخت‌گیری بیشتر در risk score،
- محدودیت‌های مربوط به Worker یا direct-IP،
- یا رفتار ناسازگار در سرویس‌های حساس.

در **GAS Private Relay** خروج نهایی از **IP سرور شخصی شما** انجام می‌شود. به همین دلیل معمولاً سازگاری با سرویس‌هایی که به خروجی Cloudflare حساس‌اند بهتر می‌شود؛ از جمله سایت‌هایی مثل **ChatGPT**، **Gemini** و سرویس‌های دیگری که challenge یا ضد‌ربات دارند.

**نکته‌ی مهم برای انتشار عمومی:** این مزیت نسبت به نسخه اصلی واقعی و مهم است، اما ادعای «باز شدن همه‌ی وب‌سایت‌ها بدون استثنا» دقیق نیست. نتیجه‌ی نهایی هنوز به این عوامل بستگی دارد:

- reputation و کیفیت IP سرور شما،
- کشور و موقعیت جغرافیایی IP،
- درست بودن TLS و اعتماد به سرتیفیکیت،
- سیاست خود سایت مقصد،
- و این‌که سرویس مقصد اساساً با ترافیک پروکسی چه برخوردی دارد.

پس جمع‌بندی دقیق و حرفه‌ای برای README این است:

> نسبت به نسخه‌ی Cloudflare، این نسخه برای کاهش مشکلات مربوط به challenge، محدودیت‌های Cloudflare و ناسازگاری برخی سرویس‌های حساس طراحی شده است، چون خروج نهایی را از Cloudflare به سرور شخصی شما منتقل می‌کند.

---

## چرا این مدل بهتر است؟

- وابستگی به Cloudflare حذف می‌شود
- خطاهای مربوط به Worker و محدودیت‌های Cloudflare در لایه‌ی خروج نهایی حذف می‌شوند
- IP خروجی در اختیار خودتان است
- در عمل برای سایت‌های challenge-sensitive نسبت به نسخه اصلی سازگاری بهتری می‌دهد
- عیب‌یابی آن ساده‌تر است
- تغییرات نسبت به پروژه‌ی اصلی کم است و مهاجرت ساده می‌ماند

---

## مقایسه نسخه اصلی با این نسخه

| موضوع | نسخه‌ی GAS + Cloudflare | نسخه‌ی GAS Private Relay |
| :--- | :--- | :--- |
| خروج نهایی | Cloudflare Worker / Cloudflare edge | سرور شخصی شما |
| خطاهای Cloudflare | ممکن است رخ بدهد | در لایه خروج نهایی حذف می‌شود |
| حساسیت به challenge | روی بعضی سرویس‌ها مشکل‌ساز می‌شود | معمولاً کمتر می‌شود چون خروج نهایی دیگر Cloudflare نیست |
| مالکیت IP خروجی | زیرساخت اشتراکی/عمومی | IP سرور خودتان |
| رفتار روی سایت‌هایی مثل ChatGPT / Gemini | ممکن است به مشکل بخورد | معمولاً بهتر است چون IP خروجی سرور خودتان است |
| میزان تغییر نسبت به نسخه اصلی | مبنا | کم و قابل مهاجرت |

---

## ساختار ریپو

```text
gas-private-relay/
├── backend/
│   ├── package.json
│   └── server.js               ← بک‌اند رله روی سرور شخصی
├── script/
│   └── Code.gs                 ← پل Google Apps Script
├── src/                        ← کد پروکسی محلی
├── config.example.json
├── main.py
├── setup.py
├── run.bat
└── run.sh
```

---

## پیش‌نیازها

### سمت کلاینت

- Python 3.10 یا بالاتر
- یک حساب Google برای ساخت Apps Script

### سمت سرور

- یک سرور لینوکسی یا VPS
- Node.js نسخه 18 یا بالاتر
- دسترسی به پورت `8080`

---

## مرحله ۱ — دریافت پروژه

```bash
git clone https://github.com/<your-user>/gas-private-relay.git
cd gas-private-relay
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

در ویندوز:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

اگر PyPI مستقیم در دسترس نبود:

```bash
pip install -r requirements.txt -i https://mirror-pypi.runflare.com/simple/ --trusted-host mirror-pypi.runflare.com
```

---

## مرحله ۲ — راه‌اندازی سرور شخصی (Backend)

روی سرور خودتان Node.js و PM2 را نصب کنید:

```bash
sudo apt update
sudo apt install -y nodejs npm
sudo npm install -g pm2
```

سپس پوشه‌ی `backend/` را به سرور منتقل کنید و اجرا کنید:

```bash
cd backend
pm2 start server.js --name gas-private-relay
pm2 save
```

تنظیم پیش‌فرض سرور:

- Host: `0.0.0.0`
- Port: `8080`

### تست سلامت سرور

```bash
curl http://YOUR_SERVER_IP:8080
```

باید چیزی شبیه این برگردد:

```json
{"ok":true,"name":"gas-private-relay-backend","status":"active"}
```

### باز کردن فایروال

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

اگر از پنل ابری، Security Group یا فایروال دیگری استفاده می‌کنید، همان‌جا هم پورت `8080` را باز کنید.

---

## مرحله ۳ — تنظیم Google Apps Script

1. وارد [Google Apps Script](https://script.google.com/) شوید
2. یک **New project** بسازید
3. کد پیش‌فرض را پاک کنید
4. فایل [`script/Code.gs`](script/Code.gs) همین ریپو را باز کنید و داخل ادیتور Paste کنید
5. این دو مقدار را تغییر دهید:

```javascript
const AUTH_KEY = "CHANGE_ME_TO_A_STRONG_SECRET";
const RELAY_URL = "http://YOUR_SERVER_IP:8080";
```

توضیح:

- `AUTH_KEY` باید با `auth_key` در `config.json` یکی باشد
- `RELAY_URL` باید IP و پورت سرور شخصی شما باشد

سپس:

6. از منوی **Deploy** گزینه **New deployment** را بزنید
7. نوع را روی **Web app** بگذارید
8. این تنظیمات را بزنید:
   - **Execute as:** Me
   - **Who has access:** Anyone
9. Deploy کنید و **Deployment ID** را بردارید

> هر بار که `Code.gs` را تغییر می‌دهید، حتماً از **Manage deployments** یک **New version** منتشر کنید.

---

## مرحله ۴ — تنظیم کلاینت محلی

می‌توانید از روی `config.example.json` فایل `config.json` بسازید، یا ساده‌تر:

```bash
python setup.py
```

تنظیمات پیشنهادی برای پایداری بیشتر و اشتراک در شبکه محلی:

```json
{
  "listen_host": "0.0.0.0",
  "lan_sharing": true,
  "socks5_port": 10808
}
```

فیلدهای مهم:

- `script_id`: همان Deployment ID مربوط به Apps Script
- `auth_key`: باید با `AUTH_KEY` یکی باشد
- `google_ip`: یک IP قابل‌دسترس از لبه‌ی گوگل
- `front_domain`: معمولاً `www.google.com`

---

## مرحله ۵ — اجرا

برای اجرای مستقیم:

```bash
python main.py
```

یا از لانچرها استفاده کنید:

- ویندوز: `run.bat`
- لینوکس / مک: `run.sh`

پورت‌های رایج در این نسخه:

- HTTP Proxy: `8085`
- SOCKS5: `10808`

اگر می‌خواهید گوشی یا دستگاه دیگری در LAN از این پروکسی استفاده کند:

```text
http://IP_سیستم_شما:8085
socks5://IP_سیستم_شما:10808
```

در این حالت مطمئن شوید فایروال سیستم شما این پورت‌ها را اجازه می‌دهد.

---

## سرتیفیکیت HTTPS

برای رهگیری و مدیریت ترافیک HTTPS، این پروژه از CA محلی استفاده می‌کند. اگر بعضی سایت‌های HTTPS باز نشدند، سرتیفیکیت ساخته‌شده در پوشه‌ی `ca/` را روی سیستم یا گوشی نصب کنید و در حالت **Trusted Root** قرار دهید.

برای نصب خودکار روی سیستم فعلی:

```bash
python main.py --install-cert
```

برای حذف:

```bash
python main.py --uninstall-cert
```

---

## عیب‌یابی

### خطای `unauthorized`

مقدار `auth_key` در `config.json` با `AUTH_KEY` در `Code.gs` یکی نیست.

### سرور شخصی در دسترس نیست

این موارد را چک کنید:

- `pm2 status`
- `curl http://YOUR_SERVER_IP:8080`
- باز بودن پورت در فایروال یا Security Group
- درست بودن `RELAY_URL` در `Code.gs`

### تغییرات Apps Script اعمال نمی‌شوند

از **Manage deployments** یک **New version** منتشر کنید.

### بعضی سایت‌های HTTPS مشکل دارند

سرتیفیکیت پوشه `ca` را نصب و Trust کنید.

### ChatGPT، Gemini یا سرویس‌های حساس دیگر هنوز درست کار نمی‌کنند

مزیت اصلی این نسخه این است که مشکلات **Cloudflare-specific** را از مسیر خروجی حذف می‌کند. اما نتیجه‌ی نهایی هنوز به **کیفیت IP سرور شخصی شما**، region و سیاست خود سرویس مقصد بستگی دارد.

اگر هنوز مشکل دارید:

- یک VPS با IP بهتر امتحان کنید
- مطمئن شوید CA محلی Trust شده است
- بررسی کنید سرویس مقصد region شما را بلاک نکرده باشد
- مطمئن شوید خود سرور بدون packet loss یا TLS interception در دسترس است

---

## توضیح کوتاه مناسب برای Description ریپو

> Domain-fronted local proxy using Google Apps Script as the public bridge and a private server backend as the final relay, designed to avoid Cloudflare-worker-specific compatibility issues.

---

## قدردانی

این ریپو بر پایه‌ی ایده‌ها و کارهای قبلی اکوسیستم MasterHttpRelay شکل گرفته و برای معماری **GAS-to-Private-Relay** بازنویسی و ساده‌سازی شده است تا انتشار عمومی و استفاده‌ی مجدد از آن راحت‌تر باشد.

</div>
