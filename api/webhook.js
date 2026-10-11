// api/webhook.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('Не настроена переменная BOT_TOKEN');
    return res.status(500).send('Server configuration error');
}

    const update = req.body;

    // 1. Подтверждение предоплаты (обязательно в течение 10 секунд)
    if (update.pre_checkout_query) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pre_checkout_query_id: update.pre_checkout_query.id,
                ok: true
            })
        });
    }

    // 2. Успешная оплата
    if (update.message && update.message.successful_payment) {
        const payment = update.message.successful_payment;
        const payload = JSON.parse(payment.invoice_payload);
        const pack = payload.pack;
        const userId = payload.user_id;

        // Здесь мы сохраняем информацию об оплате.
        // Поскольку Vercel не хранит файлы, мы используем Vercel KV (базу данных).
        // Но для простоты пока просто логируем в консоль Vercel.
        console.log(`ОПЛАТА: Пользователь ${userId} купил пакет ${pack} за ${payment.total_amount} звезд`);
    }

    res.status(200).send('ok');
}