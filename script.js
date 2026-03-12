// --- 게임 데이터 설정 ---
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

let gameState = null;
let currentTF = 'daily';
let showInd = { ma: true, bb: false, ichimoku: false, vol: false, macd: false, stoch: false, rsi: false, cci: false, adx: false };
let currentRange = null;
let currentDragMode = 'pan';
let selectedLev = 1;

// --- 지표 계산 함수 ---
function getSMA(p, n) { if (p.length < n) return new Array(p.length).fill(null); let r = new Array(n - 1).fill(null); for (let i = n - 1; i < p.length; i++) { let s = 0; for (let j = 0; j < n; j++) s += p[i - j]; r.push(s / n); } return r; }
function getEMA(p, n) { if (p.length === 0) return []; let r = [p[0]], a = 2 / (n + 1); for (let i = 1; i < p.length; i++) r.push(p[i] * a + r[r.length - 1] * (1 - a)); return r; }
function getRSI(p, n = 14) { if (p.length < n + 1) return new Array(p.length).fill(50); let d = []; for (let i = 0; i < p.length - 1; i++) d.push(p[i + 1] - p[i]); let u = d.map(v => v > 0 ? v : 0), l = d.map(v => v < 0 ? -v : 0); let ag = u.slice(0, n).reduce((a, b) => a + b, 0) / n, al = l.slice(0, n).reduce((a, b) => a + b, 0) / n; let r = new Array(n + 1).fill(50); for (let i = n; i < d.length; i++) { ag = (ag * (n - 1) + u[i]) / n; al = (al * (n - 1) + l[i]) / n; r.push(al === 0 ? 100 : 100 - (100 / (1 + ag / al))); } return r; }
function getBollinger(p, n = 20, k = 2) { let sma = getSMA(p, n); let u = [], l = []; for (let i = 0; i < p.length; i++) { if (sma[i] === null) { u.push(null); l.push(null); continue; } let slice = p.slice(Math.max(0, i - n + 1), i + 1); let std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - sma[i], 2), 0) / n); u.push(sma[i] + k * std); l.push(sma[i] - k * std); } return { u, l }; }
function getMACD(p, f = 12, s = 26, sig = 9) { let emaF = getEMA(p, f), emaS = getEMA(p, s); let macd = emaF.map((v, i) => v - emaS[i]); let signal = getEMA(macd, sig); return { macd, signal }; }
function getStoch(h, l, c, n = 14, k = 3, d = 3) { let pk = []; for (let i = 0; i < c.length; i++) { if (i < n - 1) { pk.push(50); continue; } let hh = Math.max(...h.slice(i - n + 1, i + 1)), ll = Math.min(...l.slice(i - n + 1, i + 1)); pk.push(hh === ll ? 50 : (c[i] - ll) / (hh - ll) * 100); } let sk = getSMA(pk, k), sd = getSMA(sk.map(v => v === null ? 50 : v), d); return { sk, sd }; }
function getIchimoku(h, l) { function mid(hh, ll, n) { let r = []; for (let i = 0; i < hh.length; i++) { if (i < n - 1) r.push(hh[i]); else r.push((Math.max(...hh.slice(i - n + 1, i + 1)) + Math.min(...ll.slice(i - n + 1, i + 1))) / 2); } return r; } let t = mid(h, l, 9), k = mid(h, l, 26); return { t, k }; }
function getADX(h, l, c, n = 14) { let tr = [], pdm = [], mdm = []; for (let i = 1; i < c.length; i++) { tr.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); let up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); } let trE = getEMA(tr, n), pdE = getEMA(pdm, n), mdE = getEMA(mdm, n); let pdi = [0].concat(pdE.map((v, i) => trE[i] ? v / trE[i] * 100 : 0)), mdi = [0].concat(mdE.map((v, i) => trE[i] ? v / trE[i] * 100 : 0)); let dx = pdi.map((v, i) => (v + mdi[i]) ? Math.abs(v - mdi[i]) / (v + mdi[i]) * 100 : 0); return getEMA(dx, n); }
function getCCI(h, l, c, n = 14) { let tp = c.map((v, i) => (h[i] + l[i] + v) / 3); let sma = getSMA(tp, n); let r = []; for (let i = 0; i < tp.length; i++) { if (sma[i] === null) { r.push(0); continue; } let slice = tp.slice(Math.max(0, i - n + 1), i + 1); let mad = slice.reduce((a, b) => a + Math.abs(b - sma[i]), 0) / n; r.push(mad === 0 ? 0 : (tp[i] - sma[i]) / (0.015 * mad)); } return r; }

// --- 게임 엔진 ---
function generateInitialState() {
    let s = {
        day: 1, money: 10000, initial_seed: 10000, shares: 0, avg_price: 0, debt: 0,
        inv_shares: 0, inv_avg_price: 0, inv_debt: 0, total_asset: 10000, history: [],
        liquidated: false, current_stage_idx: 0, game_over: false, game_clear: false,
        active_news: null, news_remaining: 0, news_history: [], 
        skill_points: 0, skills: { insight: 0, risk: 0, credit: 0 }
    };
    let price = Math.floor(Math.random() * 250) + 150;
    for (let i = -7500; i <= 0; i++) {
        let o = price, c = Math.max(10, o + (Math.floor(Math.random() * 31) - 15));
        let h = Math.max(o, c) + Math.floor(Math.random() * 11), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 11));
        s.history.push({ day: i, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 1000) + 500 });
        price = c;
    }
    s.price = price; return s;
}

function calculateTotalAsset() {
    if (!gameState) return 0;
    let p = gameState.price;
    let longV = (gameState.shares * p) - gameState.debt;
    let invV = gameState.inv_shares > 0 ? (gameState.inv_shares * (2 * gameState.inv_avg_price - p)) - gameState.inv_debt : 0;
    return gameState.money + longV + invV;
}

// --- 오버레이 & 스킬 제어 ---
function closeNewsOverlay() { document.getElementById('news-msg').style.display = 'none'; }
function showSkillMenu() {
    document.getElementById('stageclear-msg').style.display = 'none';
    document.getElementById('skill-msg').style.display = 'flex';
    updateSkillUI();
}
function upgradeSkill(type) {
    if (gameState.skill_points > 0) {
        gameState.skills[type]++;
        gameState.skill_points--;
        updateSkillUI();
    } else { alert("스킬 포인트가 부족합니다."); }
}
function updateSkillUI() {
    document.getElementById('skill-points-val').innerText = gameState.skill_points;
    document.getElementById('skill-insight-lv').innerText = gameState.skills.insight;
    document.getElementById('skill-risk-lv').innerText = gameState.skills.risk;
    document.getElementById('skill-credit-lv').innerText = gameState.skills.credit;
    
    // 상시 표시창 업데이트
    document.getElementById('stat-insight-lv').innerText = gameState.skills.insight;
    document.getElementById('stat-risk-lv').innerText = gameState.skills.risk;
    document.getElementById('stat-credit-lv').innerText = gameState.skills.credit;
}
function closeSkillMenu() { document.getElementById('skill-msg').style.display = 'none'; }

function nextDay(days) {
    if (gameState.game_over || gameState.game_clear) return;
    if (document.getElementById('news-msg').style.display === 'flex' || 
        document.getElementById('stageclear-msg').style.display === 'flex' ||
        document.getElementById('skill-msg').style.display === 'flex') return;

    for (let d = 0; d < days; d++) {
        gameState.day++;
        if (gameState.news_remaining > 0) { gameState.news_remaining--; if (gameState.news_remaining === 0) gameState.active_news = null; }

        let newsProb = 0.10;
        if (!gameState.active_news && Math.random() < newsProb) {
            let pool = NEWS_POOL;
            let newsIdx = Math.floor(Math.random() * pool.length);
            if (gameState.skills.insight > 0 && pool[newsIdx].effect === 'bear' && Math.random() < (gameState.skills.insight * 0.15)) {
                newsIdx = Math.floor(Math.random() * 3);
            }
            let news = pool[newsIdx];
            gameState.active_news = news; gameState.news_remaining = news.duration;
            gameState.news_history.push({ day: gameState.day, title: news.title });
            document.getElementById('news-title').innerText = news.title;
            document.getElementById('news-msg').style.display = 'flex';
            gameState.total_asset = calculateTotalAsset(); updateAndDraw(); return; 
        }

        let change = Math.floor(Math.random() * 41) - 20;
        if (gameState.active_news) {
            let n = gameState.active_news;
            if (n.effect === 'bull') change = Math.floor(Math.random() * (20 * n.intensity + 6)) - 5;
            else if (n.effect === 'bear') change = Math.floor(Math.random() * (20 * n.intensity + 6)) - (20 * n.intensity);
        }

        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + Math.floor(Math.random() * 11), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 11));
        gameState.price = c;
        gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) + 500 });

        let total = calculateTotalAsset(); gameState.total_asset = total;

        let threshold = Math.max(0.1, 0.4 - (gameState.skills.risk * 0.05));
        if (total < gameState.initial_seed * threshold) {
            gameState.shares = gameState.inv_shares = gameState.debt = gameState.inv_debt = 0;
            gameState.money = Math.max(0, total); gameState.liquidated = true; updateAndDraw(); return;
        }

        let stage = STAGES[gameState.current_stage_idx];
        if (total >= stage.target) {
            gameState.current_stage_idx++;
            gameState.skill_points++;
            let bonus = gameState.skills.credit * 5000;
            gameState.money += bonus;
            if (gameState.current_stage_idx >= STAGES.length) { gameState.game_clear = true; }
            else { 
                document.getElementById('stage-clear-text').innerText = `STAGE ${gameState.current_stage_idx} 달성! (+보너스 $${bonus})`; 
                document.getElementById('stageclear-msg').style.display = 'flex'; 
            }
            updateAndDraw(); return;
        }
        if (gameState.day >= stage.days) {
            gameState.game_over = true; document.getElementById('fail-reason').innerText = `목표 금액 $${stage.target.toLocaleString()} 달성 실패`; updateAndDraw(); return;
        }
    }
    updateAndDraw();
}

function updateAndDraw() {
    const raw = gameState.history;
    let grouped = {};
    const baseDate = new Date(2026, 2, 11);
    raw.forEach(h => {
        let dt = new Date(baseDate); dt.setDate(dt.getDate() + h.day);
        let key, lbl;
        if (currentTF === 'daily') { key = h.day; lbl = `${dt.getMonth() + 1}/${dt.getDate()}`; }
        else if (currentTF === 'monthly') { key = `${dt.getFullYear()}-${dt.getMonth()}`; lbl = `${String(dt.getFullYear()).slice(2)}.${dt.getMonth() + 1}`; }
        else { key = dt.getFullYear(); lbl = `${dt.getFullYear()}Y`; }
        if (!grouped[key]) grouped[key] = { open: h.open, high: h.high, low: h.low, close: h.close, vol: h.vol, label: lbl, day: h.day };
        else { let g = grouped[key]; g.high = Math.max(g.high, h.high); g.low = Math.min(g.low, h.low); g.close = h.close; g.vol += h.vol; }
    });

    let hist = Object.values(grouped).sort((a, b) => a.day - b.day);
    let viewCount = 60; 
    if (currentTF === 'daily') { hist = hist.slice(-90); viewCount = 45; }
    else if (currentTF === 'monthly') { hist = hist.slice(-84); viewCount = 36; }
    else { hist = hist.slice(-20); viewCount = 20; }

    const cl = hist.map(x => x.close), hi = hist.map(x => x.high), lo = hist.map(x => x.low);
    const m5 = getSMA(cl, 5), m20 = getSMA(cl, 20);
    const bb = getBollinger(cl), macdData = getMACD(cl), stochData = getStoch(hi, lo, cl), rsi = getRSI(cl), ichi = getIchimoku(hi, lo), adx = getADX(hi, lo, cl), cci = getCCI(hi, lo, cl);
    let subOrder = ['vol', 'macd', 'stoch', 'rsi', 'cci', 'adx'].filter(s => showInd[s]);
    let finalRange = currentRange || [hist.length - viewCount - 0.5, hist.length + 1.5];
    drawChart(gameState, hist, m5, m20, bb, macdData, stochData, rsi, ichi, adx, cci, subOrder, finalRange);
    updateUI(gameState);
}

function drawChart(data, hist, m5, m20, bb, macd, stoch, rsi, ichi, adx, cci, subOrder, range) {
    const chartDiv = document.getElementById('chart');
    Plotly.purge(chartDiv); 
    const xIdx = hist.map((_, i) => i);
    const traces = [{ x: xIdx, open: hist.map(h => h.open), high: hist.map(h => h.high), low: hist.map(h => h.low), close: hist.map(h => h.close), type: 'candlestick', name: 'Price', increasing: {line:{color:'#ff3131'}}, decreasing: {line:{color:'#2196f3'}}, yaxis: 'y' }];
    if (showInd.ma) { traces.push({ x: xIdx, y: m5, name: 'MA5', line: {color:'#ff9800'}, yaxis: 'y' }); traces.push({ x: xIdx, y: m20, name: 'MA20', line: {color:'#4caf50'}, yaxis: 'y' }); }
    if (showInd.bb) { traces.push({ x: xIdx, y: bb.u, name: 'BBU', line: {color:'#ccc', dash:'dash'}, yaxis: 'y' }); traces.push({ x: xIdx, y: bb.l, name: 'BBL', line: {color:'#ccc', dash:'dash'}, yaxis: 'y' }); }
    if (showInd.ichimoku) { traces.push({ x: xIdx, y: ichi.t, name: 'Tenkan', line: {color:'#ff4081'}, yaxis: 'y' }); traces.push({ x: xIdx, y: ichi.k, name: 'Kijun', line: {color:'#795548'}, yaxis: 'y' }); }
    const subH = 0.15, mainB = subOrder.length === 0 ? 0.08 : (subH * subOrder.length) + 0.08;
    
    // X축 및 Y축 기본 레이아웃
    const layout = { 
        grid: { rows: subOrder.length + 1, columns: 1, roworder: 'top to bottom' },
        yaxis: { domain: [mainB, 1], side: 'right', gridcolor: '#eee' },
        xaxis: { type: 'linear', tickvals: xIdx, ticktext: hist.map(h => h.label), range: range, gridcolor: '#eee', rangeslider: { visible: true, thickness: 0.02, borderwidth: 1 } },
        margin: { t: 5, b: 5, l: 5, r: 100 }, // 우측 여백 조금 더 확보
        showlegend: false,
        shapes: [],
        annotations: [],
        dragmode: currentDragMode 
    };

    subOrder.forEach((s, i) => {
        const yNum = i + 2; const yk = 'yaxis' + yNum; const st = i * subH;
        layout[yk] = { domain: [st + 0.08, st + subH + 0.05], side: 'right', fixedrange: true, gridcolor: '#eee', title: { text: s.toUpperCase(), font:{size:8} } };
        if (s === 'vol') traces.push({ x: xIdx, y: hist.map(h => h.vol), type: 'bar', marker: {color:'#ccc'}, yaxis: 'y' + yNum });
        else if (s === 'macd') { traces.push({ x: xIdx, y: macd.macd, line:{color:'#2196f3'}, yaxis: 'y' + yNum }); traces.push({ x: xIdx, y: macd.signal, line:{color:'#ff9800'}, yaxis: 'y' + yNum }); }
        else if (s === 'stoch') { traces.push({ x: xIdx, y: stoch.sk, line:{color:'#2196f3'}, yaxis: 'y' + yNum }); traces.push({ x: xIdx, y: stoch.sd, line:{color:'#ff9800'}, yaxis: 'y' + yNum }); }
        else if (s === 'rsi') traces.push({ x: xIdx, y: rsi, line:{color:'#9c27b0'}, yaxis: 'y' + yNum });
        else if (s === 'cci') traces.push({ x: xIdx, y: cci, line:{color:'#009688'}, yaxis: 'y' + yNum });
        else if (s === 'adx') traces.push({ x: xIdx, y: adx, line:{color:'#212121'}, yaxis: 'y' + yNum });
    });

    // 현재가 및 평단가 표시 (선 + 가격 텍스트)
    const curP = data.price;
    layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: curP, y1: curP, line: { color: 'black', width: 1, dash: 'dash' } });
    layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: curP, text: `$${curP.toLocaleString()}`, showarrow: false, font: { color: 'white', size: 11 }, bgcolor: 'black', borderpadding: 2 });

    if (data.shares > 0) {
        const avg = Math.floor(data.avg_price);
        layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: avg, y1: avg, line: { color: 'red', width: 1.5, dash: 'dot' } });
        layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: avg, text: `L:$${avg.toLocaleString()}`, showarrow: false, font: { color: 'white', size: 10 }, bgcolor: 'red', borderpadding: 2 });
    }
    if (data.inv_shares > 0) {
        const iAvg = Math.floor(data.inv_avg_price);
        layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: iAvg, y1: iAvg, line: { color: 'blue', width: 1.5, dash: 'dot' } });
        layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: iAvg, text: `I:$${iAvg.toLocaleString()}`, showarrow: false, font: { color: 'white', size: 10 }, bgcolor: 'blue', borderpadding: 2 });
    }

    Plotly.newPlot('chart', traces, layout, { 
        displaylogo: false, 
        responsive: true, 
        scrollZoom: true // 마우스 휠 줌 활성화
    });
    chartDiv.on('plotly_relayout', e => { if (e['xaxis.range[0]'] !== undefined) currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; });
}

function updateUI(s) {
    document.getElementById('money').innerText = Math.floor(s.money).toLocaleString();
    document.getElementById('total_asset').innerText = Math.floor(s.total_asset).toLocaleString();
    document.getElementById('shares').innerText = Math.floor(s.shares).toLocaleString();
    document.getElementById('avg_price').innerText = Math.floor(s.avg_price).toLocaleString();
    document.getElementById('inv_shares').innerText = Math.floor(s.inv_shares).toLocaleString();
    document.getElementById('inv_avg_price').innerText = Math.floor(s.inv_avg_price).toLocaleString();
    document.getElementById('total_debt').innerText = Math.floor(s.debt + s.inv_debt).toLocaleString();
    const stage = STAGES[s.current_stage_idx] || STAGES[STAGES.length - 1];
    document.getElementById('current-stage-num').innerText = stage.stage;
    document.getElementById('target-money').innerText = `$${stage.target.toLocaleString()}`;
    document.getElementById('remaining-days').innerText = `${Math.max(0, stage.days - s.day)}일`;
    const prevDays = s.current_stage_idx > 0 ? STAGES[s.current_stage_idx - 1].days : 0;
    document.getElementById('stage-progress-bar').style.width = `${Math.min(100, ((s.day - prevDays) / (stage.days - prevDays)) * 100)}%`;
    document.getElementById('liquidation-msg').style.display = s.liquidated ? 'flex' : 'none';
    document.getElementById('gameover-msg').style.display = s.game_over ? 'flex' : 'none';
    document.getElementById('gameclear-msg').style.display = s.game_clear ? 'flex' : 'none';
    const list = document.getElementById('news-list');
    if (s.news_history.length > 0) { list.innerHTML = s.news_history.slice().reverse().map(n => `<div class="news-item"><span class="news-day">${n.day}일차</span>${n.title}</div>`).join(''); }
}

function setLev(v, btn) { selectedLev = v; document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function setDragMode(m) { currentDragMode = m; Plotly.relayout('chart', { dragmode: m }); }
function toggleInd(n, btn) { showInd[n] = !showInd[n]; btn.classList.toggle('on'); updateAndDraw(); }
function changeTF(tf) { currentTF = tf; currentRange = null; document.querySelectorAll('.btn-tf').forEach(b => b.classList.remove('active')); document.getElementById(tf).classList.add('active'); updateAndDraw(); }

function trade(act) {
    const amtInput = parseInt(document.getElementById('trade-amount').value);
    if (isNaN(amtInput) || amtInput <= 0) return;
    const p = gameState.price;

    if (act === 'buy') {
        let cost = p * amtInput, req = cost / selectedLev;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.debt += (cost - req);
            gameState.avg_price = (gameState.shares * gameState.avg_price + cost) / (gameState.shares + amtInput);
            gameState.shares += amtInput;
        }
    } else if (act === 'sell' && gameState.shares > 0) {
        let sellAmt = Math.min(amtInput, gameState.shares);
        let val = p * sellAmt, repay = gameState.debt * (sellAmt / gameState.shares);
        gameState.money += (val - repay); gameState.debt -= repay; gameState.shares -= sellAmt;
        if (gameState.shares <= 0.01) { gameState.shares = 0; gameState.avg_price = 0; gameState.debt = 0; }
    } else if (act === 'buy_inv') {
        let cost = p * amtInput, req = cost / selectedLev;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.inv_debt += (cost - req);
            gameState.inv_avg_price = (gameState.inv_shares * gameState.inv_avg_price + cost) / (gameState.inv_shares + amtInput);
            gameState.inv_shares += amtInput;
        }
    } else if (act === 'sell_inv' && gameState.inv_shares > 0) {
        let sellAmt = Math.min(amtInput, gameState.inv_shares);
        let profit = sellAmt * (gameState.inv_avg_price - p);
        let val = (sellAmt * gameState.inv_avg_price) + profit;
        let repay = gameState.inv_debt * (sellAmt / gameState.inv_shares);
        gameState.money += (val - repay); gameState.inv_debt -= repay; gameState.inv_shares -= sellAmt;
        if (gameState.inv_shares <= 0.01) { gameState.inv_shares = 0; gameState.avg_price = 0; gameState.debt = 0; }
    }
    updateAndDraw();
}

function tradeAll(act) {
    if (!gameState) return;
    let amt = 0;
    if (act.includes('buy')) {
        amt = Math.floor((gameState.money * selectedLev) / gameState.price);
    } else {
        amt = (act === 'sell') ? gameState.shares : gameState.inv_shares;
    }
    if (amt <= 0) return;
    const oldVal = document.getElementById('trade-amount').value;
    document.getElementById('trade-amount').value = Math.floor(amt);
    trade(act);
    document.getElementById('trade-amount').value = oldVal;
}

function resetGame() { 
    if (confirm("초기화하시겠습니까?")) { 
        gameState = generateInitialState(); currentRange = null; 
        const list = document.getElementById('news-list');
        if (list) list.innerHTML = `<p style="color:#7f8c8d; font-size:12px;">발생한 뉴스가 없습니다.</p>`;
        updateAndDraw(); 
    } 
}
window.onload = () => { gameState = generateInitialState(); updateAndDraw(); };
