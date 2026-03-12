// --- 게임 데이터 및 설정 ---
const STAGES = [
    { stage: 1, days: 15, target: 30000 },
    { stage: 2, days: 35, target: 100000 },
    { stage: 3, days: 60, target: 300000 },
    { stage: 4, days: 100, target: 1000000 },
    { stage: 5, days: 150, target: 3000000 },
    { stage: 6, days: 220, target: 10000000 },
    { stage: 7, days: 300, target: 30000000 },
    { stage: 8, days: 400, target: 100000000 },
    { stage: 9, days: 550, target: 300000000 },
    { stage: 10, days: 730, target: 1000000000 }
];

const NEWS_POOL = [
    { title: "📢 중앙은행, 전격 금리 인하 발표! 시중 유동성 공급 확대 기대", effect: "bull", intensity: 2.5, duration: 5 },
    { title: "📢 대형 우량주 실적 발표, 사상 최대 영업이익 달성", effect: "bull", intensity: 2.0, duration: 4 },
    { title: "📢 핵심 기술 특허 취득 성공! 독점적 시장 지위 확보", effect: "bull", intensity: 3.0, duration: 7 },
    { title: "🚨 소비자 물가 지수(CPI) 예상치 상회... 금리 인상 우려 확산", effect: "bear", intensity: 2.5, duration: 5 },
    { title: "🚨 기업 회계 부정 의혹 제기... 금융감독원 전격 조사 착수", effect: "bear", intensity: 4.0, duration: 7 },
    { title: "⚠️ 중동 지역 지정학적 리스크 고조... 시장 불확실성 증폭", effect: "volatile", intensity: 4.0, duration: 5 },
    { title: "💬 횡보 장세 지속... 특별한 모멘텀 없이 눈치보기 극심", effect: "calm", intensity: 0.3, duration: 5 },
];

// --- 게임 상태 변수 ---
let gameState = null;
let currentTF = 'daily';
let showInd = { ma: true, bb: false, ichimoku: false, vol: false, macd: false, stoch: false, rsi: false, cci: false, adx: false };
let currentRange = null;
let currentDragMode = 'pan';
let selectedLev = 1;

// --- 지표 계산 함수 (JavaScript 이식) ---
function getSMA(prices, n) {
    if (prices.length < n) return new Array(prices.length).fill(0);
    let sma = new Array(n - 1).fill(0);
    for (let i = n - 1; i < prices.length; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) sum += prices[i - j];
        sma.push(sum / n);
    }
    return sma;
}

function getEMA(prices, n) {
    if (prices.length === 0) return [];
    let ema = [prices[0]];
    let alpha = 2 / (n + 1);
    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * alpha + ema[ema.length - 1] * (1 - alpha));
    }
    return ema;
}

function getRSI(prices, period = 14) {
    if (prices.length < period + 1) return new Array(prices.length).fill(50.0);
    let deltas = [];
    for (let i = 0; i < prices.length - 1; i++) deltas.push(prices[i + 1] - prices[i]);
    let up = deltas.map(d => d > 0 ? d : 0);
    let down = deltas.map(d => d < 0 ? -d : 0);
    
    let avgGain = up.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = down.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    let rsi = new Array(period + 1).fill(50.0);
    for (let i = period; i < deltas.length; i++) {
        avgGain = (avgGain * (period - 1) + up[i]) / period;
        avgLoss = (avgLoss * (period - 1) + down[i]) / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
}

function getBollinger(prices, n = 20, k = 1.5) {
    let sma = getSMA(prices, n);
    let upper = [], lower = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < n - 1) {
            upper.push(null); lower.push(null);
            continue;
        }
        let slice = prices.slice(i - n + 1, i + 1);
        let avg = sma[i];
        let std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / n);
        upper.push(avg + k * std);
        lower.push(avg - k * std);
    }
    return { upper, lower };
}

function getMACD(prices, fast = 12, slow = 26, signal = 9) {
    let ef = getEMA(prices, fast);
    let es = getEMA(prices, slow);
    let macd = ef.map((f, i) => f - es[i]);
    let sig = getEMA(macd, signal);
    return { macd, sig };
}

function getStochastic(highs, lows, closes, n = 14, k = 3, d = 3) {
    let pk = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < n - 1) {
            pk.push(50.0);
            continue;
        }
        let hh = Math.max(...highs.slice(i - n + 1, i + 1));
        let ll = Math.min(...lows.slice(i - n + 1, i + 1));
        pk.push(hh === ll ? 50.0 : ((closes[i] - ll) / (hh - ll) * 100));
    }
    let sk = getSMA(pk, k);
    let sd = getSMA(sk, d);
    return { sk, sd };
}

function getIchimoku(highs, lows) {
    function mid(h, l, n) {
        let res = [];
        for (let i = 0; i < h.length; i++) {
            if (i < n - 1) res.push(h[i]);
            else {
                let hh = Math.max(...h.slice(i - n + 1, i + 1));
                let ll = Math.min(...l.slice(i - n + 1, i + 1));
                res.push((hh + ll) / 2);
            }
        }
        return res;
    }
    let ten = mid(highs, lows, 9);
    let kij = mid(highs, lows, 26);
    let sa = new Array(26).fill(null).concat(ten.map((t, i) => (t + kij[i]) / 2));
    let sb = new Array(26).fill(null).concat(mid(highs, lows, 52));
    return { ten, kij, sa: sa.slice(0, highs.length), sb: sb.slice(0, highs.length) };
}

function getADX(highs, lows, closes, n = 14) {
    let tr = [], pdm = [], mdm = [];
    for (let i = 1; i < closes.length; i++) {
        tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
        let up = highs[i] - highs[i - 1];
        let down = lows[i - 1] - lows[i];
        pdm.push(up > down && up > 0 ? up : 0);
        mdm.push(down > up && down > 0 ? down : 0);
    }
    let st = getEMA(tr, n), sp = getEMA(pdm, n), sm = getEMA(mdm, n);
    let pdi = [0.0].concat(sp.map((p, i) => st[i] ? (p / st[i]) * 100 : 0));
    let mdi = [0.0].concat(sm.map((m, i) => st[i] ? (m / st[i]) * 100 : 0));
    let dx = pdi.map((p, i) => (p + mdi[i]) ? Math.abs(p - mdi[i]) / (p + mdi[i]) * 100 : 0);
    let adx = getEMA(dx, n);
    return { pdi, mdi, adx };
}

function getCCI(highs, lows, closes, n = 14) {
    let tp = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    let smaTP = getSMA(tp, n);
    let cci = [];
    for (let i = 0; i < tp.length; i++) {
        if (i < n - 1) { cci.push(0.0); continue; }
        let slice = tp.slice(i - n + 1, i + 1);
        let avgDev = slice.reduce((a, b) => a + Math.abs(b - smaTP[i]), 0) / n;
        cci.push(avgDev === 0 ? 0 : (tp[i] - smaTP[i]) / (0.015 * avgDev));
    }
    return cci;
}

// --- 게임 엔진 로직 ---
function generateInitialState() {
    let state = {
        day: 1, money: 10000, initial_seed: 10000,
        shares: 0, avg_price: 0, debt: 0,
        inv_shares: 0, inv_avg_price: 0, inv_debt: 0,
        total_asset: 10000, history: [], trade_marks: [],
        liquidated: false, current_stage_idx: 0,
        game_over: false, game_clear: false, stage_cleared_flag: false,
        active_news: null, news_remaining: 0, news_history: [],
        new_news_flag: false, skill_points: 0,
        skills: { insight: 0, risk: 0, credit: 0 }
    };
    let price = Math.floor(Math.random() * (400 - 150 + 1)) + 150;
    for (let i = -1000; i <= 0; i++) {
        let o = price;
        let c = Math.max(10, o + (Math.floor(Math.random() * 31) - 15));
        let h = Math.max(o, c) + Math.floor(Math.random() * 11);
        let l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 11));
        state.history.push({ day: i, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 1901) + 100 });
        price = c;
    }
    state.price = price;
    return state;
}

function calculateTotalAsset() {
    let p = gameState.price;
    let longV = (gameState.shares * p) - gameState.debt;
    let invV = gameState.inv_shares > 0 ? (gameState.inv_shares * (2 * gameState.inv_avg_price - p)) - gameState.inv_debt : 0;
    return gameState.money + longV + invV;
}

// --- UI 제어 및 인터랙션 ---
function setLev(val, btn) {
    selectedLev = val;
    document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function setDragMode(mode) {
    currentDragMode = mode;
    Plotly.relayout('chart', { dragmode: mode });
    document.getElementById('btn-pan').style.background = (mode === 'pan') ? '#2980b9' : '#7f8c8d';
    document.getElementById('btn-draw').style.background = (mode === 'drawline') ? '#e74c3c' : '#7f8c8d';
}

function toggleInd(name, btn) {
    showInd[name] = !showInd[name];
    btn.classList.toggle('on');
    updateAndDraw();
}

function changeTF(tf) {
    currentTF = tf;
    currentRange = null;
    document.querySelectorAll('.btn-tf').forEach(b => b.classList.remove('active'));
    document.getElementById(tf).classList.add('active');
    updateAndDraw();
}

function resetGame() {
    if (confirm("초기화하시겠습니까?")) {
        gameState = generateInitialState();
        currentRange = null;
        updateAndDraw();
    }
}

function undoLastShape() {
    const c = document.getElementById('chart');
    if (c.layout && c.layout.shapes) {
        const userShapes = c.layout.shapes.filter(s => s.xref !== 'paper');
        if (userShapes.length > 0) {
            const lastUserShape = userShapes[userShapes.length - 1];
            const newShapes = c.layout.shapes.filter(s => s !== lastUserShape);
            Plotly.relayout('chart', { shapes: newShapes });
        }
    }
}

function clearShapes() {
    const c = document.getElementById('chart');
    if (c.layout && c.layout.shapes) {
        const systemShapes = c.layout.shapes.filter(s => s.xref === 'paper');
        Plotly.relayout('chart', { shapes: systemShapes });
    }
}

function trade(act) {
    const amt = parseInt(document.getElementById('trade-amount').value);
    if (isNaN(amt) || amt <= 0) { alert("수량 입력"); return; }
    
    let success = false, message = "";
    const p = gameState.price;

    if (act === 'buy') {
        let cost = p * amt; let req = cost / selectedLev;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.debt += (cost - req);
            gameState.avg_price = (gameState.shares * gameState.avg_price + cost) / (gameState.shares + amt);
            gameState.shares += amt; success = true;
        } else message = "잔액 부족";
    } else if (act === 'sell') {
        if (gameState.shares >= amt) {
            let val = p * amt; let repay = gameState.debt * (amt / gameState.shares);
            gameState.money += (val - repay); gameState.debt -= repay; gameState.shares -= amt;
            if (gameState.shares <= 0) { gameState.avg_price = 0; gameState.debt = 0; }
            success = true;
        } else message = "수량 부족";
    } else if (act === 'buy_inv') {
        let cost = p * amt; let req = cost / selectedLev;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.inv_debt += (cost - req);
            gameState.inv_avg_price = (gameState.inv_shares * gameState.inv_avg_price + cost) / (gameState.inv_shares + amt);
            gameState.inv_shares += amt; success = true;
        } else message = "잔액 부족";
    } else if (act === 'sell_inv') {
        if (gameState.inv_shares >= amt) {
            let profit = amt * (gameState.inv_avg_price - p);
            let val = (amt * gameState.inv_avg_price) + profit;
            let repay = gameState.inv_debt * (amt / gameState.inv_shares);
            gameState.money += (val - repay); gameState.inv_debt -= repay; gameState.inv_shares -= amt;
            if (gameState.inv_shares <= 0) { gameState.inv_avg_price = 0; gameState.inv_debt = 0; }
            success = true;
        } else message = "수량 부족";
    }

    if (success) updateAndDraw();
    else alert(message);
}

function tradeAll(act) {
    let amt = 0;
    if (act === 'buy' || act === 'buy_inv') amt = Math.floor((gameState.money * selectedLev) / gameState.price);
    else if (act === 'sell') amt = gameState.shares;
    else if (act === 'sell_inv') amt = gameState.inv_shares;
    
    if (amt > 0) trade(act.includes('buy') ? act : act); // trade function logic supports this
    // Since trade() uses the input value, we temporarily set it
    const oldVal = document.getElementById('trade-amount').value;
    document.getElementById('trade-amount').value = amt;
    trade(act);
    document.getElementById('trade-amount').value = oldVal;
}

function nextDay(days) {
    if (gameState.game_over || gameState.game_clear) { updateAndDraw(); return; }
    
    for (let d = 0; d < days; d++) {
        gameState.day++;
        if (gameState.news_remaining > 0) {
            gameState.news_remaining--;
            if (gameState.news_remaining === 0) gameState.active_news = null;
        }
        if (!gameState.active_news && Math.random() < 0.10) {
            let news = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
            gameState.active_news = news; gameState.news_remaining = news.duration;
            gameState.news_history.push({ day: gameState.day, title: news.title });
        }

        let baseChange = Math.floor(Math.random() * 41) - 20;
        if (gameState.active_news) {
            let n = gameState.active_news; let i = n.intensity;
            if (n.effect === 'bull') baseChange = Math.floor(Math.random() * (20 * i + 6)) - 5;
            else if (n.effect === 'bear') baseChange = Math.floor(Math.random() * (20 * i + 6)) - (20 * i);
            else if (n.effect === 'volatile') baseChange = Math.floor(Math.random() * (50 * i + 1)) - (25 * i);
        }

        let o = gameState.price;
        let c = Math.max(10, o + baseChange);
        let h = Math.max(o, c) + Math.floor(Math.random() * 16);
        let l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 16));
        gameState.price = c;
        gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2501) + 500 });

        let threshold = 0.4 - (gameState.skills.risk * 0.1);
        if (calculateTotalAsset() < gameState.initial_seed * threshold) {
            gameState.shares = gameState.inv_shares = gameState.debt = gameState.inv_debt = 0;
            gameState.money = Math.max(0, calculateTotalAsset());
            gameState.liquidated = true; break;
        }

        let stage = STAGES[gameState.current_stage_idx];
        if (stage) {
            if (calculateTotalAsset() >= stage.target) {
                gameState.current_stage_idx++;
                if (gameState.current_stage_idx >= STAGES.length) { gameState.game_clear = true; break; }
            } else if (gameState.day >= stage.days) {
                gameState.game_over = true; break;
            }
        }
    }
    gameState.total_asset = calculateTotalAsset();
    updateAndDraw();
}

function updateAndDraw() {
    const raw = gameState.history;
    let rawSet = [];
    if (currentTF === 'daily') rawSet = raw.slice(-365);
    else if (currentTF === 'monthly') rawSet = raw.slice(-1200);
    else rawSet = raw;

    let grouped = {};
    const baseDate = new Date(2026, 2, 11); // March 11, 2026
    
    rawSet.forEach(h => {
        let dt = new Date(baseDate);
        dt.setDate(dt.getDate() + h.day);
        let key, lbl;
        if (currentTF === 'daily') {
            key = h.day; lbl = `${dt.getMonth() + 1}/${dt.getDate()}`;
        } else if (currentTF === 'monthly') {
            key = `${dt.getFullYear()}-${dt.getMonth()}`;
            lbl = `${String(dt.getFullYear()).slice(2)}.${dt.getMonth() + 1}`;
        } else {
            key = dt.getFullYear(); lbl = `${dt.getFullYear()}Y`;
        }

        if (!grouped[key]) {
            grouped[key] = { open: h.open, high: h.high, low: h.low, close: h.close, vol: h.vol, label: lbl, day: h.day };
        } else {
            let g = grouped[key];
            g.high = Math.max(g.high, h.high);
            g.low = Math.min(g.low, h.low);
            g.close = h.close;
            g.vol += h.vol;
        }
    });

    const hist = Object.values(grouped);
    const cl = hist.map(x => x.close);
    const hi = hist.map(x => x.high);
    const lo = hist.map(x => x.low);

    const m5 = getSMA(cl, 5), m20 = getSMA(cl, 20), m60 = getSMA(cl, 60);
    const bb = getBollinger(cl);
    const macdData = getMACD(cl);
    const stochData = getStochastic(hi, lo, cl);
    const rsi = getRSI(cl);
    const ichi = getIchimoku(hi, lo);
    const adxData = getADX(hi, lo, cl);
    const cci = getCCI(hi, lo, cl);

    hist.forEach((x, i) => {
        x.ma5 = m5[i]; x.ma20 = m20[i]; x.ma60 = m60[i];
        x.bb_u = bb.upper[i]; x.bb_l = bb.lower[i];
        x.macd = macdData.macd[i]; x.macd_s = macdData.sig[i];
        x.st_k = stochData.sk[i]; x.st_d = stochData.sd[i];
        x.rsi = rsi[i];
        x.ten = ichi.ten[i]; x.kij = ichi.kij[i]; x.sa = ichi.sa[i]; x.sb = ichi.sb[i];
        x.adx = adxData.adx[i]; x.cci = cci[i];
    });

    draw(gameState, hist);
}

function draw(data, hist) {
    document.getElementById('liquidation-msg').style.display = data.liquidated ? 'flex' : 'none';
    document.getElementById('gameover-msg').style.display = data.game_over ? 'flex' : 'none';
    document.getElementById('gameclear-msg').style.display = data.game_clear ? 'flex' : 'none';

    const stage = STAGES[data.current_stage_idx] || STAGES[STAGES.length - 1];
    document.getElementById('current-stage-num').innerText = stage.stage;
    document.getElementById('target-money').innerText = `$${stage.target.toLocaleString()}`;
    
    const remaining = stage.days - data.day;
    document.getElementById('remaining-days').innerText = `${remaining}일`;
    
    const prevStageDays = data.current_stage_idx > 0 ? STAGES[data.current_stage_idx - 1].days : 0;
    const progressPercent = Math.min(100, ((data.day - prevStageDays) / (stage.days - prevStageDays)) * 100);
    document.getElementById('stage-progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('stage-progress-bar').style.background = remaining <= 2 ? '#e74c3c' : '#2ecc71';

    const chartDiv = document.getElementById('chart');
    const x = hist.map(h => h.label);
    const traces = [];
    const currentPrice = data.price;

    traces.push({ x: x, open: hist.map(h => h.open), high: hist.map(h => h.high), low: hist.map(h => h.low), close: hist.map(h => h.close), type: 'candlestick', name: 'Price', increasing: { line: { color: '#ff3131', width: 1.5 } }, decreasing: { line: { color: '#2196f3', width: 1.5 } }, yaxis: 'y' });
    if (showInd.ma) {
        traces.push({ x: x, y: hist.map(h => h.ma5), name: 'MA5', line: { color: '#ff9800', width: 2 }, yaxis: 'y' });
        traces.push({ x: x, y: hist.map(h => h.ma20), name: 'MA20', line: { color: '#4caf50', width: 2 }, yaxis: 'y' });
    }
    if (showInd.bb) {
        traces.push({ x: x, y: hist.map(h => h.bb_u), name: 'BB U', line: { color: 'rgba(128,128,128,0.5)', width: 1.5, dash: 'dash' }, yaxis: 'y' });
        traces.push({ x: x, y: hist.map(h => h.bb_l), name: 'BB L', line: { color: 'rgba(128,128,128,0.5)', width: 1.5, dash: 'dash' }, yaxis: 'y' });
    }
    if (showInd.ichimoku) {
        traces.push({ x: x, y: hist.map(h => h.ten), name: 'Tenkan', line: { color: '#ff4081', width: 1.5 }, yaxis: 'y' });
        traces.push({ x: x, y: hist.map(h => h.kij), name: 'Kijun', line: { color: '#795548', width: 1.5 }, yaxis: 'y' });
        traces.push({ x: x, y: hist.map(h => h.sb), name: 'Cloud', fill: 'tonexty', fillcolor: 'rgba(0,188,212,0.1)', line: { width: 0 }, yaxis: 'y' });
    }

    const subOrder = ['vol', 'macd', 'stoch', 'rsi', 'cci', 'adx'];
    const activeSubs = subOrder.filter(s => showInd[s]);
    const subCount = activeSubs.length;
    const subH = 0.15;
    const mainB = subCount === 0 ? 0 : (subH * subCount) + 0.02;

    let finalRange = currentRange || [x.length - (currentTF === 'daily' ? 60 : (currentTF === 'monthly' ? 24 : 12)), x.length - 1];

    const shapes = (chartDiv.layout && chartDiv.layout.shapes) ? [...chartDiv.layout.shapes.filter(s => s.editable !== false)] : [];
    shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: currentPrice, y1: currentPrice, line: { color: 'black', width: 2, dash: 'dash' }, editable: false });
    if (data.shares > 0) shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: data.avg_price, y1: data.avg_price, line: { color: 'red', width: 2 }, editable: false });
    if (data.inv_shares > 0) shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: data.inv_avg_price, y1: data.inv_avg_price, line: { color: 'blue', width: 2 }, editable: false });

    const annotations = [{ xref: 'paper', x: 1.01, yref: 'y', y: currentPrice, text: `<b>$${currentPrice}</b>`, showarrow: false, font: { color: 'white', size: 14 }, bgcolor: 'black', borderpadding: 4 }];
    if (data.shares > 0) annotations.push({ xref: 'paper', x: 1.01, yref: 'y', y: data.avg_price, text: `<b>롱:$${Math.floor(data.avg_price)}</b>`, showarrow: false, font: { color: 'white', size: 12 }, bgcolor: '#e74c3c', borderpadding: 4 });
    if (data.inv_shares > 0) annotations.push({ xref: 'paper', x: 1.01, yref: 'y', y: data.inv_avg_price, text: `<b>인:$${Math.floor(data.inv_avg_price)}</b>`, showarrow: false, font: { color: 'white', size: 12 }, bgcolor: '#3498db', borderpadding: 4 });

    const layout = {
        grid: { rows: subCount + 1, columns: 1, roworder: 'top to bottom' },
        yaxis: { domain: [mainB, 1], side: 'right', autorange: true, fixedrange: false, gridcolor: '#eee' },
        xaxis: { rangeslider: { visible: false }, type: 'category', range: finalRange, gridcolor: '#eee' },
        margin: { t: 30, b: 30, l: 30, r: 100 },
        showlegend: false,
        shapes: shapes,
        annotations: annotations,
        dragmode: currentDragMode,
        newshape: { line: { color: 'red', width: 2 }, editable: true }
    };

    activeSubs.forEach((sub, i) => {
        const yKey = 'y' + (i + 2);
        const start = i * subH;
        layout['yaxis' + (i + 2)] = { domain: [start, start + subH - 0.02], side: 'right', title: { text: sub.toUpperCase(), font: { size: 12, weight: 'bold' } }, fixedrange: true, gridcolor: '#eee' };
        if (sub === 'vol') traces.push({ x: x, y: hist.map(h => h.vol), type: 'bar', marker: { color: 'rgba(158,158,158,0.6)' }, yaxis: yKey });
        else if (sub === 'macd') {
            traces.push({ x: x, y: hist.map(h => h.macd), line: { color: '#2196f3', width: 2 }, yaxis: yKey });
            traces.push({ x: x, y: hist.map(h => h.macd_s), line: { color: '#ff9800', width: 2 }, yaxis: yKey });
        }
        else if (sub === 'stoch') {
            traces.push({ x: x, y: hist.map(h => h.st_k), line: { color: '#2196f3', width: 2 }, yaxis: yKey });
            traces.push({ x: x, y: hist.map(h => h.st_d), line: { color: '#ff9800', width: 2 }, yaxis: yKey });
        }
        else if (sub === 'rsi') {
            traces.push({ x: x, y: hist.map(h => h.rsi), line: { color: '#9c27b0', width: 2.5 }, yaxis: yKey });
            traces.push({ x: x, y: x.map(() => 70), line: { color: 'rgba(244,67,54,0.5)', width: 1, dash: 'dot' }, yaxis: yKey });
            traces.push({ x: x, y: x.map(() => 30), line: { color: 'rgba(33,150,243,0.5)', width: 1, dash: 'dot' }, yaxis: yKey });
        }
        else if (sub === 'cci') {
            traces.push({ x: x, y: hist.map(h => h.cci), line: { color: '#009688', width: 2.5 }, yaxis: yKey });
            traces.push({ x: x, y: x.map(() => 100), line: { color: 'rgba(158,158,158,0.5)', width: 1, dash: 'dot' }, yaxis: yKey });
            traces.push({ x: x, y: x.map(() => -100), line: { color: 'rgba(158,158,158,0.5)', width: 1, dash: 'dot' }, yaxis: yKey });
        }
        else if (sub === 'adx') traces.push({ x: x, y: hist.map(h => h.adx), line: { color: '#212121', width: 2.5 }, yaxis: yKey });
    });

    Plotly.react('chart', traces, layout, { displaylogo: false, editable: true, scrollZoom: true, responsive: true });
    
    chartDiv.on('plotly_relayout', function (eventData) {
        if (eventData['xaxis.range[0]'] !== undefined) {
            currentRange = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
        }
    });

    document.getElementById('money').innerText = Math.floor(data.money);
    document.getElementById('total_asset').innerText = Math.floor(data.total_asset);
    document.getElementById('shares').innerText = data.shares;
    document.getElementById('avg_price').innerText = Math.floor(data.avg_price);
    document.getElementById('inv_shares').innerText = data.inv_shares;
    document.getElementById('inv_avg_price').innerText = Math.floor(data.inv_avg_price);
    document.getElementById('total_debt').innerText = Math.floor(data.debt + data.inv_debt);
}

window.onload = () => {
    gameState = generateInitialState();
    updateAndDraw();
};
