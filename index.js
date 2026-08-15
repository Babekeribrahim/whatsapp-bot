const { Client, LocalAuth, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const http = require('http');

// خادم لإبقاء الخدمة نشطة على Render
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Bot Server is Running');
}).listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome',
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
    console.log('\n==========================================');
    console.log('امسح رمز الـ QR أدناه باستخدام الواتساب:');
    console.log('==========================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
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
