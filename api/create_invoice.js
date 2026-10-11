// api/create_invoice.js
export default async function handler(req, res) {
    // Разрешаем CORS (чтобы index.html мог делать запросы)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('Не настроена переменная BOT_TOKEN');
    return res.status(500).json({
        ok: false,
        error: 'Оплата временно недоступна: сервер не настроен'
    });
}

    const PACKS = {
        small:  { stars: 1, coins: 50  },
        medium: { stars: 10, coins: 600  },
        large:  { stars: 30, coins: 2000 }
    };

    const { pack, user_id } = req.body;

    if (!PACKS[pack] || !user_id) {
        return res.status(400).json({ ok: false, error: 'Invalid pack or user_id' });
    }

    const cfg = PACKS[pack];

    const params = {
        title: 'Монеты Croodle Merge',
        description: `${cfg.coins} монет для игры`,
        payload: JSON.stringify({ pack, user_id }),
        currency: 'XTR',
        prices: [{ label: 'Монеты', amount: cfg.stars }]
    };

    try {
        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await tgRes.json();

        if (data.ok) {
            return res.status(200).json({ ok: true, url: data.result });
        } else {
            return res.status(400).json({ ok: false, error: data.description || 'Telegram error' });
        }
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}