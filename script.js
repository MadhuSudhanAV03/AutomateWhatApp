const fs = require('fs');
const csv = require('csv-parser');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const csvFile = 'Cnario-OldData.csv';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

const phoneNumbers = new Set();

function formatPhone(phone) {
    const cleaned = String(phone || '').replace(/\D/g, '');

    if (cleaned.length === 10) return '91' + cleaned;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('0')) return '91' + cleaned.slice(1);

    return null;
}

function extractPhoneNumbersFromCSV() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv())
            .on('data', (row) => {
                const ph = (row['Phone Number'] || row['Phone number'] || row['phone number'] || '').trim();
                const x = formatPhone(ph);
                if (x) phoneNumbers.add(x);
                else console.log(`⚠ Could not format: "${ph}"`);
            })
            .on('end', () => {
                console.log(`✅ Extracted ${phoneNumbers.size} unique phone numbers.`);
                resolve(Array.from(phoneNumbers));
            })
            .on('error', reject);
    });
}

client.on('qr', (qr) => {
    console.log('Scan this QR code:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => console.log('🔐 Authenticated'));
client.on('auth_failure', (msg) => console.error('❌ Auth failed:', msg));
client.on('disconnected', (reason) => console.error('🔌 Disconnected:', reason));

client.on('ready', async () => {
    console.log('🟢 WhatsApp client ready');

    await delay(3000);

    const numbers = await extractPhoneNumbersFromCSV();
    console.log(`📋 Numbers to process: ${numbers.length}`);
    console.log('Sample formatted numbers:', numbers.slice(0, 3));

    let posterImage, webifyPDF;
    try {
        posterImage = MessageMedia.fromFilePath('./Cnario.jpeg');
        webifyPDF   = MessageMedia.fromFilePath('./Cnario-2026.pdf');
        console.log('✅ Media files loaded');
    } catch (e) {
        console.error('❌ Failed to load media files:', e.message);
        process.exit(1);
    }

    const message = `Hello Coders,

IEEE SIT SB proudly presents C-nario ✨

C-NARIO is an engaging programming contest designed to challenge your understanding of C concepts, logical reasoning, and problem-solving skills. It offers a great platform to test your fundamentals and compete with peers in a dynamic and intellectually stimulating environment.

📅 Date: 30th April 2026
📍 Venue: Civil Department
👥 Team size: 2 members
💰 Registration Fee: ₹100 per team

The event is open to students of all years and branches. Participate, enhance your technical skills, and stand a chance to earn recognition along with exciting prizes and certificates.

📌 Register now by scanning the QR code in the poster or visit:
https://ideeeas-2k26.vercel.app/

📧 E-mail: cnario.ideeeas2k26@gmail.com

📞 For queries, contact:
Varsha Y – 9945376840
Darshan A – 9632544031

We look forward to your participation at C-NARIO✨.
`;

    let sent = 0, skipped = 0, failed = 0;

    for (const number of numbers) {
        console.log(`\n→ Processing: ${number}`);
        try {
            const numberId = await client.getNumberId(number);

            if (!numberId) {
                console.log(`  ⏭ Skipped — not on WhatsApp`);
                skipped++;
                continue;
            }

            console.log(`  ✔ Found: ${numberId._serialized}`);
            const chatId = numberId._serialized;

            await client.sendMessage(chatId, posterImage);
            console.log(`  📷 Poster sent`);
            await delay(1500);

            await client.sendMessage(chatId, message);
            console.log(`  💬 Message sent`);
            await delay(1500);

            await client.sendMessage(chatId, webifyPDF);
            console.log(`  📄 PDF sent`);
            await delay(2500);

            sent++;
            console.log(`  ✅ Done [${sent} sent / ${skipped} skipped / ${failed} failed]`);

        } catch (err) {
            console.error(`  ❌ Failed: ${err.message}`);
            failed++;
            await delay(3000);
        }
    }

    console.log(`\n📨 Complete — ${sent} sent, ${skipped} skipped, ${failed} failed`);
});

client.initialize();












// const fs = require('fs');
// const csv = require('csv-parser');
// const qrcode = require('qrcode-terminal');
// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// const csvFile = 'Cnario-OldData.csv';

// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: {
//         headless: false,
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     },
// });

// const phoneNumbers = new Set();

// function formatPhone(phone) {
//     const cleaned = String(phone || '').replace(/\D/g, '');
//     if (cleaned.length === 10) return '+91' + cleaned;
//     if (cleaned.length === 12 && cleaned.startsWith('91')) return '+' + cleaned;
//     if (String(phone).trim().startsWith('+')) return String(phone).trim();
//     return null;
// }

// function extractPhoneNumbersFromCSV() {
//     return new Promise((resolve, reject) => {
//         fs.createReadStream(csvFile)
//             .pipe(csv())
//             .on('data', (row) => {
//                 const ph = (row['Phone Number'] || row['Phone number'] || row['phone number'] || '').trim();
//                 const x = formatPhone(ph);
//                 if (x) phoneNumbers.add(x);
//             })
//             .on('end', () => {
//                 console.log(`✅ Extracted ${phoneNumbers.size} unique phone numbers.`);
//                 resolve(Array.from(phoneNumbers));
//             })
//             .on('error', reject);
//     });
// }

// client.on('qr', (qr) => {
//     console.log('Scan this QR code:');
//     qrcode.generate(qr, { small: true });
// });

// client.on('ready', async () => {
//     console.log('🟢 WhatsApp client ready');

//     const numbers = await extractPhoneNumbersFromCSV();
//     console.log(numbers);

//     const sendList = numbers;

//     const posterImage = MessageMedia.fromFilePath('./Cnario.jpeg');
//     const webifyPDF = MessageMedia.fromFilePath('./Cnario-2026.pdf');

//     const message = `Hello Coders,

// IEEE SIT SB proudly presents C-nario ✨

// C-NARIO is an engaging programming contest designed to challenge your understanding of C concepts, logical reasoning, and problem-solving skills. It offers a great platform to test your fundamentals and compete with peers in a dynamic and intellectually stimulating environment.

// 📅 Date: 30th April 2026
// 📍 Venue: Civil Department
// 👥 Team size: 2 members
// 💰 Registration Fee: ₹100 per team

// The event is open to students of all years and branches. Participate, enhance your technical skills, and stand a chance to earn recognition along with exciting prizes and certificates.

// 📌 Register now by scanning the QR code in the poster or visit:
// https://ideeeas-2k26.vercel.app/

// 📧 E-mail: cnario.ideeeas2k26@gmail.com

// 📞 For queries, contact:
// Varsha Y – 9945376840
// Darshan A – 9632544031

// We look forward to your participation at C-NARIO✨.
// `;

//     for (const number of sendList) {
//         try {
//             const raw = number.replace('+', '');
//             const numberId = await client.getNumberId(raw);

//             if (!numberId) {
//                 console.log(`Skipping ${number}: not on WhatsApp`);
//                 continue;
//             }

//             const chatId = numberId._serialized; // use resolved id
//             await client.sendMessage(chatId, posterImage);
//             await delay(1200);
//             await client.sendMessage(chatId, message);
//             await delay(1200);
//             await client.sendMessage(chatId, webifyPDF);
//             await delay(2000);
//             console.log(`Sent to ${number}`);
//         } catch (err) {
//             console.error(`Failed ${number}: ${err.message}`);
//         }
//     }

//     console.log('📨 All messages attempted.');
// });

// client.initialize();