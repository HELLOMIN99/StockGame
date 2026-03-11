// =============================================
// stock.js - app.py 로직을 완전히 JS로 포팅
// =============================================

// --- 지표 계산 엔진 ---
function getSMA(prices, n) {
    if (prices.length < n) return new Array(prices.length).fill(0);
    const result = new Array(n - 1).fill(0);
    for (let i = n - 1; i < prices.length; i++) {
        const sum = prices.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / n);
    }
    return result;
}

function getEMA(prices, n) {
    if (!prices.length) return [];
    const alpha = 2 / (n + 1);
    const ema = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * alpha + ema[ema.length - 1] * (1 - alpha));
    }
    return ema;
}

function getRSI(prices, period = 14) {
    if (prices.length < period + 1) return new Array(prices.length).fill(50.0);
    const deltas = prices.slice(1).map((p, i) => p - prices[i]);
    const up = deltas.map(d => d > 0 ? d : 0);
    const down = deltas.map(d => d < 0 ? -d : 0);
    let avgGain = up.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = down.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const rsi = new Array(period + 1).fill(50.0);
    for (let i = period; i < deltas.length; i++) {
        avgGain = (avgGain * (period - 1) + up[i]) / period;
        avgLoss = (avgLoss * (period - 1) + down[i]) / period;
        const rs = avgLoss !== 0 ? avgGain / avgLoss : 100;
        rsi.push(100 - 100 / (1 + rs));
    }
    return rsi.slice(0, prices.length);
}

function getCCI(highs, lows, closes, n = 14) {
    const tp = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    const smaTP = getSMA(tp, n);
    return tp.map((t, i) => {
        if (i < n - 1) return 0.0;
        const slice = tp.slice(i - n + 1, i + 1);
        const avgDev = slice.reduce((a, x) => a + Math.abs(x - smaTP[i]), 0) / n;
        return avgDev !== 0 ? (t - smaTP[i]) / (0.015 * avgDev) : 0;
    });
}

function getBollinger(prices, n = 20, k = 2) {
    const sma = getSMA(prices, n);
    const upper = [], lower = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < n - 1) { upper.push(null); lower.push(null); continue; }
        const slice = prices.slice(i - n + 1, i + 1);
        const std = Math.sqrt(slice.reduce((a, x) => a + (x - prices[i]) ** 2, 0) / n);
        upper.push(prices[i] + k * std);
        lower.push(prices[i] - k * std);
    }
    return { upper, lower };
}

function getMACD(prices, fast = 12, slow = 26, signal = 9) {
    const ef = getEMA(prices, fast);
    const es = getEMA(prices, slow);
    const macd = ef.map((f, i) => f - es[i]);
    const sig = getEMA(macd, signal);
    return { macd, signal: sig };
}

function getStochastic(highs, lows, closes, n = 14, k = 3, d = 3) {
    const pk = closes.map((c, i) => {
        if (i < n - 1) return 50.0;
        const hh = Math.max(...highs.slice(i - n + 1, i + 1));
        const ll = Math.min(...lows.slice(i - n + 1, i + 1));
        return hh !== ll ? (c - ll) / (hh - ll) * 100 : 50.0;
    });
    const sk = getSMA(pk, k);
    const sd = getSMA(sk, d);
    return { k: sk, d: sd };
}

function getIchimoku(highs, lows) {
    function mid(h, l, n) {
        return h.map((_, i) => {
            if (i < n - 1) return h[i];
            return (Math.max(...h.slice(i - n + 1, i + 1)) + Math.min(...l.slice(i - n + 1, i + 1))) / 2;
        });
    }
    const ten = mid(highs, lows, 9);
    const kij = mid(highs, lows, 26);
    const senkouA = new Array(26).fill(null).concat(ten.map((t, i) => (t + kij[i]) / 2)).slice(0, highs.length);
    const senkouB = new Array(26).fill(null).concat(mid(highs, lows, 52)).slice(0, highs.length);
    return { ten, kij, sa: senkouA, sb: senkouB };
}

function getADX(highs, lows, closes, n = 14) {
    const tr = [], pdm = [], mdm = [];
    for (let i = 1; i < closes.length; i++) {
        tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
        const up = highs[i] - highs[i - 1];
        const down = lows[i - 1] - lows[i];
        pdm.push(up > down && up > 0 ? up : 0);
        mdm.push(down > up && down > 0 ? down : 0);
    }
    const st = getEMA(tr, n), sp = getEMA(pdm, n), sm = getEMA(mdm, n);
    const pdi = [0.0].concat(sp.map((p, i) => st[i] ? (p / st[i]) * 100 : 0));
    const mdi = [0.0].concat(sm.map((m, i) => st[i] ? (m / st[i]) * 100 : 0));
    const dx = pdi.map((p, i) => {
        const m = mdi[i];
        return (p + m) ? Math.abs(p - m) / (p + m) * 100 : 0;
    });
    return { pdi, mdi, adx: getEMA(dx, n) };
}

// --- 게임 상태 관리 ---
let gameState = null;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInitialState() {
    const history = [];
    let price = randInt(150, 400);
    for (let i = -7300; i <= 0; i++) {
        const o = price;
        const c = Math.max(10, o + randInt(-15, 15));
        const h = Math.max(o, c) + randInt(0, 10);
        const l = Math.max(10, Math.min(o, c) - randInt(0, 10));
        history.push({ day: i, open: o, high: h, low: l, close: c, vol: randInt(100, 2000) });
        price = c;
    }
    return {
        day: 1,
        money: 10000,
        shares: 0,
        avg_price: 0,
        total_asset: 10000,
        price: price,
        history: history,
        trade_marks: []
    };
}

function resetGame() {
    gameState = generateInitialState();
}

// --- 상태 조회 (타임프레임 집계 + 지표 계산) ---
function getState(tf = 'daily') {
    const BASE_DATE = new Date(2026, 2, 11); // 2026-03-11
    const raw = gameState.history;

    let rawSet;
    if (tf === 'daily') rawSet = raw.slice(-365);
    else if (tf === 'monthly') rawSet = raw.slice(-3650);
    else rawSet = raw;

    const grouped = new Map();
    for (const h of rawSet) {
        const dt = new Date(BASE_DATE);
        dt.setDate(dt.getDate() + h.day);
        let key, label;
        if (tf === 'daily') {
            key = h.day;
            label = `${dt.getMonth() + 1}.${dt.getDate()}`;
        } else if (tf === 'monthly') {
            key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
            label = `${String(dt.getFullYear()).slice(2)}.${dt.getMonth() + 1}`;
        } else {
            key = dt.getFullYear();
            label = `${dt.getFullYear()}년`;
        }
        if (!grouped.has(key)) {
            grouped.set(key, { open: h.open, high: h.high, low: h.low, close: h.close, vol: h.vol, label });
        } else {
            const g = grouped.get(key);
            g.high = Math.max(g.high, h.high);
            g.low = Math.min(g.low, h.low);
            g.close = h.close;
            g.vol += h.vol;
        }
    }

    const hist = Array.from(grouped.values());
    const cl = hist.map(x => x.close);
    const hi = hist.map(x => x.high);
    const lo = hist.map(x => x.low);
    const vl = hist.map(x => x.vol);

    const m5 = getSMA(cl, 5), m20 = getSMA(cl, 20), m60 = getSMA(cl, 60);
    const { upper: bbU, lower: bbL } = getBollinger(cl);
    const { macd, signal: macdS } = getMACD(cl);
    const { k: stK, d: stD } = getStochastic(hi, lo, cl);
    const rsi = getRSI(cl);
    const { ten, kij, sa, sb } = getIchimoku(hi, lo);
    const { pdi, mdi, adx } = getADX(hi, lo, cl);
    const vma = getSMA(vl, 20);
    const cci = getCCI(hi, lo, cl);

    hist.forEach((x, i) => {
        x.ma5 = m5[i]; x.ma20 = m20[i]; x.ma60 = m60[i];
        x.bb_u = bbU[i]; x.bb_l = bbL[i];
        x.macd = macd[i]; x.macd_s = macdS[i];
        x.st_k = stK[i]; x.st_d = stD[i];
        x.rsi = rsi[i]; x.cci = cci[i];
        x.ten = ten[i]; x.kij = kij[i]; x.sa = sa[i]; x.sb = sb[i];
        x.pdi = pdi[i]; x.mdi = mdi[i]; x.adx = adx[i];
        x.vma = vma[i];
    });

    return { ...gameState, display_history: hist };
}

// --- 다음날 진행 ---
function nextDay(days = 1) {
    for (let i = 0; i < days; i++) {
        gameState.day++;
        const o = gameState.price;
        const c = Math.max(10, o + randInt(-20, 20));
        const h = Math.max(o, c) + randInt(0, 15);
        const l = Math.max(10, Math.min(o, c) - randInt(0, 15));
        gameState.price = c;
        gameState.history.push({
            day: gameState.day, open: o, high: h, low: l, close: c, vol: randInt(500, 3000)
        });
    }
    gameState.total_asset = gameState.money + gameState.shares * gameState.price;
}

// --- 매수 ---
function buyStock(amount) {
    const cost = gameState.price * amount;
    if (gameState.money >= cost) {
        const totalSpent = gameState.shares * gameState.avg_price + cost;
        gameState.money -= cost;
        gameState.shares += amount;
        gameState.avg_price = totalSpent / gameState.shares;
        gameState.trade_marks.push({ price: gameState.price, type: 'buy' });
        return { success: true };
    }
    return { success: false, message: '잔액 부족' };
}

// --- 매도 ---
function sellStock(amount) {
    if (gameState.shares >= amount) {
        gameState.money += gameState.price * amount;
        gameState.shares -= amount;
        if (gameState.shares === 0) gameState.avg_price = 0;
        gameState.trade_marks.push({ price: gameState.price, type: 'sell' });
        return { success: true };
    }
    return { success: false, message: '주식 부족' };
}
