<?php
// ============ НАСТРОЙКИ ============
// ВСТАВЬ СВОЙ ТОКЕН БОТА СЮДА:
$BOT_TOKEN = '8975616188:AAH-uUZUVwZMy4nBcEv1QJmfI_zG9NC4lMA';


// Цены в звёздах за пакеты монет
$PACKS = [
    'small'  => ['stars' => 1,   'coins' => 50],
    'medium' => ['stars' => 20,  'coins' => 650],
    'large'  => ['stars' => 40,  'coins' => 1000],
];

// ============ ОБРАБОТКА ЗАПРОСОВ ============
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input  = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// Универсальный вызов Telegram Bot API
function tg($method, $params = []) {
    global $BOT_TOKEN;
    $url = "https://api.telegram.org/bot{$BOT_TOKEN}/{$method}";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($params),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 15,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

// Создать ссылку на оплату пакета монет
if ($action === 'create_invoice') {
    $pack  = $input['pack'] ?? '';
    $userId = (int)($input['user_id'] ?? 0);

    if (!isset($PACKS[$pack])) {
        echo json_encode(['ok' => false, 'error' => 'unknown pack']);
        exit;
    }

    $cfg = $PACKS[$pack];

    $res = tg('createInvoiceLink', [
        'title'       => 'Монеты Croodle Merge',
        'description' => "{$cfg['coins']} монет для игры",
        'payload'     => json_encode(['pack' => $pack, 'user_id' => $userId]),
        'currency'    => 'XTR',
        'prices'      => [
            ['label' => 'Монеты', 'amount' => $cfg['stars']]
        ],
    ]);

    if (!empty($res['ok'])) {
        echo json_encode(['ok' => true, 'url' => $res['result']]);
    } else {
        echo json_encode(['ok' => false, 'error' => $res['description'] ?? 'tg error']);
    }
    exit;
}

// Вебхук Telegram — сюда приходят события оплаты
if ($action === 'webhook') {
    $update = json_decode(file_get_contents('php://input'), true);

    // Предоплата: подтверждаем в течение 10 секунд
    if (isset($update['pre_checkout_query'])) {
        tg('answerPreCheckoutQuery', [
            'pre_checkout_query_id' => $update['pre_checkout_query']['id'],
            'ok' => true
        ]);
    }

    // Успешная оплата: зачисляем монеты
    if (isset($update['message']['successful_payment'])) {
        $payment = $update['message']['successful_payment'];
        $payload = json_decode($payment['invoice_payload'], true);
        $pack    = $payload['pack'] ?? '';
        $userId  = (int)($payload['user_id'] ?? 0);

        if (isset($PACKS[$pack]) && $userId) {
            // Сохраняем в файл (можно заменить на БД)
            $file = __DIR__ . '/payments.json';
            $data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
            $data[] = [
                'user_id' => $userId,
                'pack'    => $pack,
                'coins'   => $PACKS[$pack]['coins'],
                'stars'   => $PACKS[$pack]['stars'],
                'date'    => date('c'),
            ];
            file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE));
        }
    }

    http_response_code(200);
    echo 'ok';
    exit;
}

// Проверить, приходили ли монеты для игрока
if ($action === 'check_coins') {
    $userId = (int)($input['user_id'] ?? 0);
    $file = __DIR__ . '/payments.json';
    $data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

    $total = 0;
    foreach ($data as $row) {
        if ((int)$row['user_id'] === $userId) {
            $total += (int)$row['coins'];
        }
    }
    echo json_encode(['ok' => true, 'coins' => $total]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'unknown action']);