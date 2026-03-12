// --- 상태 변수 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, ichimoku: false, vol: false, macd: false, stoch: false, rsi: false, cci: false, adx: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1;

// --- 탭 전환 함수 ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    setTimeout(() => { Plotly.Plots.resize('chart'); }, 100);
}

// --- 테마 전환 함수 ---
function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
        themeBtn.innerText = (currentTheme === 'dark') ? "☀️" : "🌙";
    }
    updateAndDraw();
}

// --- 게임 데이터 설정 (20단계 스테이지) ---
const STAGES = [
    { stage: 1, days: 22, target: 30000 },
    { stage: 2, days: 50, target: 100000 },
    { stage: 3, days: 90, target: 300000 },
    { stage: 4, days: 150, target: 1000000 },
    { stage: 5, days: 220, target: 3000000 },
    { stage: 6, days: 330, target: 10000000 },
    { stage: 7, days: 450, target: 35000000 },
    { stage: 8, days: 600, target: 100000000 },
    { stage: 9, days: 850, target: 400000000 },
    { stage: 10, days: 1200, target: 1000000000 },
    { stage: 11, days: 1500, target: 3000000000 },
    { stage: 12, days: 1800, target: 10000000000 },
    { stage: 13, days: 2200, target: 30000000000 },
    { stage: 14, days: 2600, target: 100000000000 },
    { stage: 15, days: 3000, target: 300000000000 },
    { stage: 16, days: 3500, target: 1000000000000 },
    { stage: 17, days: 4000, target: 3000000000000 },
    { stage: 18, days: 4500, target: 10000000000000 },
    { stage: 19, days: 5000, target: 30000000000000 },
    { stage: 20, days: 6000, target: 100000000000000 }
];

const NEWS_POOL = [
    { title: "📢 중앙은행, 전격 금리 인하 발표! 시중 유동성 공급 확대 기대", effect: "bull", intensity: 2.2, duration: 5 },
    { title: "📢 대형 우량주 실적 발표, 사상 최대 영업이익 달성", effect: "bull", intensity: 1.8, duration: 4 },
    { title: "📢 핵심 기술 특허 취득 성공! 독점적 시장 지위 확보", effect: "bull", intensity: 2.5, duration: 7 },
    { title: "🔥 AI 혁명 가속화! 전 산업군 생산성 폭발적 증대 전망", effect: "bull", intensity: 4.5, duration: 10 },
    { title: "🚀 글로벌 대형 펀드, 국내 시장 '비중 확대' 리포트 발간", effect: "bull", intensity: 2.0, duration: 6 },
    { title: "💎 자사주 1조 원 규모 소각 발표! 주주가치 제고 기대", effect: "bull", intensity: 3.5, duration: 3 },
    { title: "🍀 신약 임상 3상 통과! 글로벌 제약사와 수조 원대 기술 수출", effect: "bull", intensity: 4.0, duration: 8 },
    { title: "🏗️ 정부 주도 대규모 SOC 국책 사업 발표... 경기 부양 신호탄", effect: "bull", intensity: 1.5, duration: 12 },
    { title: "🤝 글로벌 IT 공룡, 국내 유망 기업 전격 인수 합병(M&A)", effect: "bull", intensity: 5.0, duration: 4 },
    { title: "⚡ 차세대 전고체 배터리 양산 성공! 에너지 패러다임 전환", effect: "bull", intensity: 3.8, duration: 7 },
    { title: "🚨 소비자 물가 지수(CPI) 예상치 상회... 금리 인상 우려", effect: "bear", intensity: 2.2, duration: 5 },
    { title: "🚨 기업 회계 부정 의혹 제기... 금융감독원 전격 조사 착수", effect: "bear", intensity: 3.5, duration: 7 },
    { title: "🌊 글로벌 금융 위기 재현? 대형 은행 연쇄 파산 위기설", effect: "bear", intensity: 5.0, duration: 15 },
    { title: "📉 반도체 수요 급감... '업황의 겨울' 현실화 우려", effect: "bear", intensity: 2.8, duration: 8 },
    { title: "⚠️ 대규모 유상증자 결정 소식에 투심 급격히 위축", effect: "bear", intensity: 3.2, duration: 3 },
    { title: "💀 대주주 경영권 분쟁 및 배임 혐의... 신뢰도 바닥", effect: "bear", intensity: 4.0, duration: 6 },
    { title: "📉 환율 폭등! 외국인 매도세 거세지며 지수 방어선 붕괴", effect: "bear", intensity: 2.5, duration: 10 },
    { title: "🔥 데이터 센터 화재 발생... 국내 주요 서비스 무더기 먹통", effect: "bear", intensity: 3.0, duration: 4 },
    { title: "🦠 신종 변이 바이러스 확산... 다시 강화되는 봉쇄 조치", effect: "bear", intensity: 4.5, duration: 12 },
    { title: "🚫 무역 규제 강화... 핵심 소재 수출입 금지에 공급망 비상", effect: "bear", intensity: 3.7, duration: 9 },
    { title: "⚠️ 중동 지역 지정학적 리스크 고조... 불확실성 증폭", effect: "volatile", intensity: 3.5, duration: 5 },
    { title: "⚡ 미-중 무역 분쟁 격화! 보복 관세 난타전에 시장 대혼란", effect: "volatile", intensity: 4.5, duration: 6 },
    { title: "💬 횡보 장세 지속... 특별한 모멘텀 없이 눈치보기 극심", effect: "calm", intensity: 0.3, duration: 5 }
];

// --- 유틸리티 ---
function animateValue(id, end) {
    const obj = document.getElementById(id); if (!obj) return;
    const start = parseInt(obj.innerText.replace(/,/g, '')) || 0;
    const range = end - start; if (range === 0) return;
    const duration = 400; let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        obj.innerText = Math.floor(progress * range + start).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

function showFloatingText(text, isPositive) {
    const el = document.createElement('div'); el.className = 'floating-text'; el.innerText = text;
    el.style.position = 'fixed'; el.style.zIndex = '3000'; el.style.pointerEvents = 'none';
    el.style.fontWeight = '900'; el.style.fontSize = '24px';
    el.style.color = isPositive ? '#2ecc71' : '#e74c3c';
    el.style.left = (window.innerWidth / 2) + 'px'; el.style.top = (window.innerHeight / 3) + 'px';
    document.body.appendChild(el);
    let start = null;
    function anim(t) {
        if (!start) start = t; let prog = (t - start) / 1200;
        el.style.transform = `translate(-50%, -${prog * 100}px)`; el.style.opacity = 1 - prog;
        if (prog < 1) requestAnimationFrame(anim); else el.remove();
    }
    requestAnimationFrame(anim);
}

// --- 지표 계산 ---
function getSMA(p, n) { if (p.length < n) return new Array(p.length).fill(null); let r = new Array(n - 1).fill(null); for (let i = n - 1; i < p.length; i++) { let s = 0; for (let j = 0; j < n; j++) s += p[i - j]; r.push(s / n); } return r; }
function getEMA(p, n) { if (p.length === 0) return []; let r = [p[0]], a = 2 / (n + 1); for (let i = 1; i < p.length; i++) r.push(p[i] * a + r[r.length - 1] * (1 - a)); return r; }
function getRSI(p, n = 14) { if (p.length < n + 1) return new Array(p.length).fill(50); let d = []; for (let i = 0; i < p.length - 1; i++) d.push(p[i + 1] - p[i]); let u = d.map(v => v > 0 ? v : 0), l = d.map(v => v < 0 ? -v : 0); let ag = u.slice(0, n).reduce((a, b) => a + b, 0) / n, al = l.slice(0, n).reduce((a, b) => a + b, 0) / n; let r = new Array(n + 1).fill(50); for (let i = n; i < d.length; i++) { ag = (ag * (n - 1) + u[i]) / n; al = (al * (n - 1) + l[i]) / n; r.push(al === 0 ? 100 : 100 - (100 / (1 + ag / al))); } return r; }
function getBollinger(p, n = 20, k = 2) { let sma = getSMA(p, n); let u = [], l = []; for (let i = 0; i < p.length; i++) { if (sma[i] === null) { u.push(null); l.push(null); continue; } let slice = p.slice(Math.max(0, i - n + 1), i + 1); let std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - sma[i], 2), 0) / n); u.push(sma[i] + k * std); l.push(sma[i] - k * std); } return { u, l }; }
function getMACD(p, f = 12, s = 26, sig = 9) { let emaF = getEMA(p, f), emaS = getEMA(p, s); let macd = emaF.map((v, i) => v - emaS[i]); let signal = getEMA(macd, sig); return { macd, signal }; }
function getStoch(h, l, c, n = 14, k = 3, d = 3) { let pk = []; for (let i = 0; i < c.length; i++) { if (i < n - 1) { pk.push(50); continue; } let hh = Math.max(...h.slice(i - n + 1, i + 1)), ll = Math.min(...l.slice(i - n + 1, i + 1)); pk.push(hh === ll ? 50 : (c[i] - ll) / (hh - ll) * 100); } let sk = getSMA(pk, k), sd = getSMA(sk.map(v => v === null ? 50 : v), d); return { sk, sd }; }
function getIchimoku(h, l) { function mid(hh, ll, n) { let r = []; for (let i = 0; i < hh.length; i++) { if (i < n - 1) r.push(hh[i]); else r.push((Math.max(...hh.slice(i - n + 1, i + 1)) + Math.min(...ll.slice(i - n + 1, i + 1))) / 2); } return r; } let t = mid(h, l, 9), k = mid(h, l, 26); return { t, k }; }
function getADX(h, l, c, n = 14) { let tr = [], pdm = [], mdm = []; for (let i = 1; i < c.length; i++) { tr.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); let up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); } let trE = getEMA(tr, n), pdE = getEMA(pdm, n), mdE = getEMA(mdm, n); let pdi = [0].concat(pdE.map((v, i) => trE[i] ? v / trE[i] * 100 : 0)), mdi = [0].concat(mdE.map((v, i) => trE[i] ? v / trE[i] * 100 : 0)), dx = pdi.map((v, i) => (v + mdi[i]) ? Math.abs(v - mdi[i]) / (v + mdi[i]) * 100 : 0); return getEMA(dx, n); }
function getCCI(h, l, c, n = 14) { let tp = c.map((v, i) => (h[i] + l[i] + v) / 3); let sma = getSMA(tp, n); let r = []; for (let i = 0; i < tp.length; i++) { if (sma[i] === null) { r.push(0); continue; } let slice = tp.slice(Math.max(0, i - n + 1), i + 1); let mad = slice.reduce((a, b) => a + Math.abs(b - sma[i]), 0) / n; r.push(mad === 0 ? 0 : (tp[i] - sma[i]) / (0.015 * mad)); } return r; }

// --- 게임 엔진 ---
function generateInitialState() {
    let s = {
        day: 1, money: 10000, shares: 0, avg_price: 0, debt: 0,
        inv_shares: 0, inv_avg_price: 0, inv_debt: 0, total_asset: 10000, history: [],
        liquidated: false, current_stage_idx: 0, game_over: false, game_clear: false,
        active_news: null, news_remaining: 0, news_history: [], skill_points: 0, 
        skills: { insight: 0, risk: 0, credit: 0 },
        items: { time_stopper: 0, money_washer: 0, future_vision: 0, news_manipulator: 0 },
        timeStopperDays: 0
    };
    let price = Math.floor(Math.random() * 601) + 200;
    for (let i = -7500; i <= 0; i++) {
        let o = price, c = Math.max(10, o + (Math.floor(Math.random() * 41) - 20));
        let h = Math.max(o, c) + Math.floor(Math.random() * 15), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 15));
        s.history.push({ day: i, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 1000) + 500 }); price = c;
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

function checkStageClear() {
    if (!gameState || gameState.game_over || gameState.game_clear) return false;
    let stage = STAGES[gameState.current_stage_idx];
    if (gameState.money >= stage.target) {
        gameState.current_stage_idx++;
        gameState.skill_points++;
        gameState.money += (gameState.skills.credit * 5000);
        document.getElementById('stage-clear-text').innerText = `STAGE ${gameState.current_stage_idx} 달성! (현금 목표 돌파!)`;
        document.getElementById('stageclear-msg').style.display = 'flex';
        if (gameState.current_stage_idx >= STAGES.length) { gameState.game_clear = true; }
        updateAndDraw();
        return true;
    }
    return false;
}

function nextDay(days) {
    if (!gameState || gameState.game_over || gameState.game_clear) return;
    if (document.getElementById('news-msg').style.display === 'flex' || document.getElementById('stageclear-msg').style.display === 'flex' || document.getElementById('skill-msg').style.display === 'flex' || document.getElementById('shop-msg').style.display === 'flex') return;

    for (let d = 0; d < days; d++) {
        gameState.day++;
        if (gameState.news_remaining > 0) { gameState.news_remaining--; if (gameState.news_remaining === 0) gameState.active_news = null; }

        let totalDebt = gameState.debt + gameState.inv_debt;
        if (totalDebt > 0 && gameState.skills.risk < 5) gameState.money -= (totalDebt * 0.0005);
        if (gameState.shares > 0) gameState.money += (gameState.shares * gameState.price * 0.001);

        if (!gameState.active_news && Math.random() < 0.10) {
            let newsIdx = Math.floor(Math.random() * NEWS_POOL.length);
            let news = NEWS_POOL[newsIdx]; gameState.active_news = news; gameState.news_remaining = news.duration;
            gameState.news_history.push({ day: gameState.day, title: news.title });
            document.getElementById('news-title').innerText = news.title; document.getElementById('news-msg').style.display = 'flex';
            marketEnergy += 1.5; updateAndDraw(); return; 
        }

        let change = 0;
        if (gameState.timeStopperDays > 0) { gameState.timeStopperDays--; }
        else {
            let baseVar = 41; change = Math.floor(Math.random() * (baseVar * marketEnergy)) - (baseVar * marketEnergy / 2);
            if (gameState.active_news) {
                let n = gameState.active_news; let intensity = n.intensity * marketEnergy;
                if (n.effect === 'bull') change = Math.floor(Math.random() * (20 * intensity));
                else if (n.effect === 'bear') change = -Math.floor(Math.random() * (20 * intensity));
            }
        }

        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + Math.floor(Math.random() * 11), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 11));
        gameState.price = c; gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) + 500 });

        let total = calculateTotalAsset(); gameState.total_asset = total;
        let maintenanceMargin = 0.05;
        if (total <= 0 || (totalDebt > 0 && total < totalDebt * maintenanceMargin)) {
            gameState.shares = gameState.inv_shares = gameState.debt = gameState.inv_debt = 0; gameState.money = Math.max(0, total); gameState.liquidated = true; 
            document.getElementById('liquidation-msg').style.display = 'flex'; updateAndDraw(); return;
        }

        if (checkStageClear()) return;

        let stage = STAGES[gameState.current_stage_idx];
        if (gameState.day >= stage.days) { 
            gameState.game_over = true; document.getElementById('fail-reason').innerText = `STAGE ${stage.stage} 기한 내 현금 확보 실패`;
            document.getElementById('gameover-msg').style.display = 'flex'; updateAndDraw(); return; 
        }
    }
    updateAndDraw();
}

function updateAndDraw() {
    if (!gameState) return;
    const raw = gameState.history; let grouped = {}; const baseDate = new Date(2026, 2, 11);
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
    if (currentTF === 'daily') hist = hist.slice(-60); else if (currentTF === 'monthly') hist = hist.slice(-84); else hist = hist.slice(-20);
    const cl = hist.map(x => x.close), hi = hist.map(x => x.high), lo = hist.map(x => x.low);
    const m5 = getSMA(cl, 5), m20 = getSMA(cl, 20);
    const bb = getBollinger(cl), macdData = getMACD(cl), stochData = getStoch(hi, lo, cl), rsi = getRSI(cl), ichi = getIchimoku(hi, lo), adx = getADX(hi, lo, cl), cci = getCCI(hi, lo, cl);
    let subOrder = ['vol', 'macd', 'stoch', 'rsi', 'cci', 'adx'].filter(s => showInd[s]);
    drawChart(gameState, hist, m5, m20, bb, macdData, stochData, rsi, ichi, adx, cci, subOrder, currentRange);
    updateUI(gameState);
}

function drawChart(data, hist, m5, m20, bb, macd, stoch, rsi, ichi, adx, cci, subOrder, range) {
    const chartDiv = document.getElementById('chart');
    const isDark = (currentTheme === 'dark');
    const paperBg = isDark ? '#0a0b10' : '#f0f2f5', textColor = isDark ? '#00f2ff' : '#1a2a3a';
    const gridColor = isDark ? 'rgba(0, 242, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const xIdx = hist.map((_, i) => i);
    const traces = [{ x: xIdx, open: hist.map(h => h.open), high: hist.map(h => h.high), low: hist.map(h => h.low), close: hist.map(h => h.close), type: 'candlestick', name: 'Price', increasing: {line:{color:'#ff3131'}}, decreasing: {line:{color:'#2196f3'}}, yaxis: 'y' }];
    
    if (showInd.ma) { traces.push({ x: xIdx, y: m5, name: 'MA5', line: {color:'#ff9800'}, yaxis: 'y' }); traces.push({ x: xIdx, y: m20, name: 'MA20', line: {color:'#4caf50'}, yaxis: 'y' }); }
    
    const subH = 0.20, subCount = subOrder.length, mainB = Math.min(0.45, subCount * subH + 0.05);
    const layout = { 
        grid: { rows: subCount + 1, columns: 1, roworder: 'top to bottom', rowgap: 0.06 }, paper_bgcolor: paperBg, plot_bgcolor: paperBg, font: { color: textColor, family: 'Consolas, Malgun Gothic' },
        yaxis: { domain: [mainB, 1], side: 'right', gridcolor: gridColor, zerolinecolor: gridColor },
        xaxis: { type: 'linear', tickvals: xIdx, ticktext: hist.map(h => h.label), range: range, gridcolor: gridColor, zerolinecolor: gridColor, rangeslider: { visible: false } },
        margin: { t: 5, b: 20, l: 5, r: 50 }, showlegend: false, dragmode: currentDragMode 
    };

    subOrder.forEach((s, i) => {
        const yNum = i + 2; const yk = 'yaxis' + yNum;
        layout[yk] = { domain: [(subCount - 1 - i) * (mainB / subCount), (subCount - i) * (mainB / subCount) - 0.02], side: 'right', gridcolor: gridColor };
        if (s === 'vol') traces.push({ x: xIdx, y: hist.map(h => h.vol), type: 'bar', marker: {color: isDark ? '#444' : '#ccc'}, yaxis: 'y' + yNum });
    });

    Plotly.newPlot('chart', traces, layout, { displaylogo: false, responsive: true, scrollZoom: true });
    chartDiv.on('plotly_relayout', e => { if (e['xaxis.range[0]'] !== undefined) currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; });
}

function updateUI(s) {
    const total = Math.floor(s.total_asset); animateValue('total_asset', total); animateValue('money', Math.floor(s.money));
    document.getElementById('shares').innerText = Math.floor(s.shares).toLocaleString();
    document.getElementById('avg_price').innerText = Math.floor(s.avg_price).toLocaleString();
    document.getElementById('inv_shares').innerText = Math.floor(s.inv_shares).toLocaleString();
    document.getElementById('inv_avg_price').innerText = Math.floor(s.inv_avg_price).toLocaleString();
    document.getElementById('total_debt').innerText = Math.floor(s.debt + s.inv_debt).toLocaleString();
    
    const stage = STAGES[s.current_stage_idx] || STAGES[STAGES.length - 1];
    
    // Update Elements
    const elements = {
        'current-stage-num-side': stage.stage,
        'current-stage-num-mobile': stage.stage,
        'target-money-side': `$${stage.target.toLocaleString()}`,
        'target-money-mobile': stage.target.toLocaleString(),
        'remaining-days-side': `${Math.max(0, stage.days - s.day)}일`,
        'remaining-days-mobile': Math.max(0, stage.days - s.day),
        'stat-insight-lv': s.skills.insight,
        'stat-risk-lv': s.skills.risk,
        'stat-credit-lv': s.skills.credit,
        'stat-insight-bar': `${s.skills.insight * 20}%`,
        'stat-risk-bar': `${s.skills.risk * 20}%`,
        'stat-credit-bar': `${s.skills.credit * 20}%`
    };

    for (let id in elements) {
        let el = document.getElementById(id);
        if (el) {
            if (id.includes('bar')) el.style.width = elements[id];
            else el.innerText = elements[id];
        }
    }

    const rankText = getRank(total);
    if (document.getElementById('player-rank-side')) document.getElementById('player-rank-side').innerText = rankText;
    if (document.getElementById('player-rank-mobile')) document.getElementById('player-rank-mobile').innerText = rankText;

    const list = document.getElementById('news-list');
    if (list && s.news_history.length > 0) {
        list.innerHTML = s.news_history.slice().reverse().map(n => `<div class="news-item"><b>${n.day}일:</b> ${n.title}</div>`).join('');
    }
    updateInventoryUI();
}

function getRank(t) { if (t >= 1000000000) return "💎 투자의 신"; if (t >= 100000000) return "🏆 전설"; if (t >= 1000000) return "🎩 슈퍼개미"; return "흙수저"; }
function showShopMenu() { document.getElementById('stageclear-msg').style.display = 'none'; document.getElementById('shop-msg').style.display = 'flex'; document.getElementById('shop-cash').innerText = `$${Math.floor(gameState.money).toLocaleString()}`; }
function closeShopMenu() { document.getElementById('shop-msg').style.display = 'none'; }
function buyItem(type, price) { if (gameState.money >= price) { gameState.money -= price; gameState.items[type]++; document.getElementById('shop-cash').innerText = `$${Math.floor(gameState.money).toLocaleString()}`; updateInventoryUI(); updateAndDraw(); } else { alert("현금 부족!"); } }
function updateInventoryUI() { for (let item in gameState.items) { const btn = document.getElementById(`item-${item}`); if (btn) btn.innerText = `${item === 'time_stopper' ? '⏳' : item === 'money_washer' ? '🧼' : item === 'future_vision' ? '🔮' : '📢'} ${gameState.items[item]}`; } }
function useItem(type) { /* 아이템 효과 로직 */ updateInventoryUI(); updateAndDraw(); }
function upgradeSkill(type) { if (gameState.skill_points > 0 && gameState.skills[type] < 5) { gameState.skills[type]++; gameState.skill_points--; updateUI(gameState); } }
function showSkillMenu() { document.getElementById('stageclear-msg').style.display = 'none'; document.getElementById('skill-msg').style.display = 'flex'; document.getElementById('skill-points-val').innerText = gameState.skill_points; }
function closeSkillMenu() { document.getElementById('skill-msg').style.display = 'none'; }
function closeNewsOverlay() { document.getElementById('news-msg').style.display = 'none'; }
function closeStageOverlay() { document.getElementById('stageclear-msg').style.display = 'none'; }
function changeTF(tf) { currentTF = tf; updateAndDraw(); }
function setLev(v, btn) { selectedLev = v; document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function setDragMode(m) { currentDragMode = m; Plotly.relayout('chart', { dragmode: m }); }
function toggleInd(n, btn) { showInd[n] = !showInd[n]; btn.classList.toggle('on'); updateAndDraw(); }
function setTradeMode(m) { currentTradeMode = m; document.getElementById('mode-long').classList.toggle('active', m === 'long'); document.getElementById('mode-inv').classList.toggle('active', m === 'inv'); }
function handleTrade(a) { trade(currentTradeMode === 'long' ? a : a + '_inv'); }
function handleTradeAll(a) { /* 전량 매매 로직 */ }
function trade(act) { 
    const amtInput = parseInt(document.getElementById('trade-amount').value);
    if (isNaN(amtInput) || amtInput <= 0) return;
    const p = gameState.price;
    if (act === 'buy') {
        let cost = p * amtInput;
        if (gameState.money >= cost / selectedLev) {
            gameState.money -= (cost / selectedLev);
            gameState.avg_price = (gameState.shares * gameState.avg_price + cost) / (gameState.shares + amtInput);
            gameState.shares += amtInput;
        }
    } else if (act === 'sell' && gameState.shares > 0) {
        let sellAmt = Math.min(amtInput, gameState.shares);
        gameState.money += (p * sellAmt);
        gameState.shares -= sellAmt;
    }
    updateAndDraw();
}
function resetGame() { location.reload(); }
function undoLastShape() { /* 취소 로직 */ }
function clearShapes() { /* 삭제 로직 */ }

window.onload = () => { gameState = generateInitialState(); updateAndDraw(); };
