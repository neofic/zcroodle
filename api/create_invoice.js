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

    const BOT_TOKEN = '8975616188:AAHMmX91N8qSO9D0gSNB4HSeBIWR9Grb8nE'; // Твой токен

    const PACKS = {
        small:  { stars: 1,  coins: 100  },
        medium: { stars: 2, coins: 500  },
        large:  { stars: 50, coins: 1500 }
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