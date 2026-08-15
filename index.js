const { Client, LocalAuth, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('http');

let lastQrCodeData = null;

// خادم لعرض رمز الـ QR عبر المتصفح وإبقاء الخدمة نشطة
const PORT = process.env.PORT || 10000;
http.createServer(async (req, res) => {
    if (lastQrCodeData) {
        try {
            const qrImage = await qrcode.toDataURL(lastQrCodeData);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <title>ربط واتساب بوت</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #f0f2f5; margin: 0; }
                        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
                        img { width: 260px; height: 260px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>امسح رمز الـ QR لربط الواتساب</h2>
                        <img src="${qrImage}" alt="QR Code" />
                        <p>افتح الواتساب > الأجهزة المرتبطة > ربط جهاز</p>
                    </div>
                </body>
                </html>
            `);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('خطأ في توليد الرمز');
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2 style="text-align:center;margin-top:50px;font-family:sans-serif;">✅ البوت متصل بالواتساب وجاهز للعمل!</h2>');
    }
}).listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/opt/render/project/src/.cache/chrome/linux-146.0.7680.31/chrome-linux64/chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    lastQrCodeData = qr;
    console.log('تم توليد رمز QR جديد، افتح رابط الخدمة في المتصفح لمسحه.');
});

client.on('ready', () => {
    lastQrCodeData = null;
    console.log('\n✅ البوت متصل بالواتساب وجاهز لاستقبال الأوامر في القروبات!');
});

client.on('message', async (msg) => {
    const text = msg.body;

    if (text.startsWith('!تصويت')) {
        const parts = text.split('|').map(p => p.trim());
        
        if (parts.length < 3) {
            msg.reply('❌ صيغة الأمر غير صحيحة!\nيرجى الكتابة بالشكل التالي:\n`!تصويت | موضوع التصويت | خيار 1 | خيار 2`');
            return;
        }

        const pollTitle = parts[1];
        const pollOptions = parts.slice(2);

        const poll = new Poll(pollTitle, pollOptions, {
            allowMultipleAnswers: false
        });

        await msg.reply(poll);
    }
});

client.initialize();
