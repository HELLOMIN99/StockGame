// --- 상태 변수 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, vol: true, macd: false, rsi: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1;

// --- 탭 전환 ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    setTimeout(() => { Plotly.Plots.resize('chart'); }, 150);
}

// --- 설명 팝업 ---
function showSkillDesc(type) {
    const descs = {
        'insight': "🔍 [통찰력]\n레벨당 뉴스 발생 확률 +2%, 호재 확률이 증가합니다.",
        'risk': "🛡️ [위험 관리]\n레벨당 일일 이자 -10%, 청산 유지 증거금이 완화됩니다.",
        'credit': "💳 [신용도]\n레벨당 클리어 보너스 +$10,000, 5레벨 달성 시 50x 레버리지 해제!"
    };
    alert(descs[type]);
}

// --- 테마 및 설정 ---
function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) { themeBtn.innerText = (currentTheme === 'dark') ? "☀️테마" : "🌙테마"; }
    updateAndDraw();
}
function toggleInd(n, btn) { showInd[n] = !showInd[n]; btn.classList.toggle('on', showInd[n]); updateAndDraw(); }
function changeTF(tf) { 
    currentTF = tf; currentRange = null;
    document.querySelectorAll('.btn-tf').forEach(b => { if(['daily','monthly','yearly'].includes(b.id)) b.classList.remove('active'); });
    const target = document.getElementById(tf); if(target) target.classList.add('active');
    updateAndDraw(); 
}
function setLev(v, btn) { selectedLev = v; document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function setDragMode(m) { currentDragMode = m; Plotly.relayout('chart', { dragmode: m }); }

// --- 20단계 스테이지 설정 ---
const STAGES = [
    { stage: 1, days: 22, target: 30000, name: "튜토리얼" },
    { stage: 2, days: 45, target: 100000, name: "기초 자산" },
    { stage: 3, days: 70, target: 300000, name: "종잣돈 마련" },
    { stage: 4, days: 100, target: 1000000, name: "슈퍼 개미" },
    { stage: 5, days: 150, target: 3000000, name: "프로 투자자" },
    { stage: 6, days: 200, target: 10000000, name: "자산가" },
    { stage: 7, days: 300, target: 50000000, name: "자본가" },
    { stage: 8, days: 450, target: 200000000, name: "큰 손" },
    { stage: 9, days: 600, target: 1000000000, name: "억만장자" },
    { stage: 10, days: 800, target: 5000000000, name: "유니콘" },
    { stage: 11, days: 1000, target: 20000000000, name: "데카콘" },
    { stage: 12, days: 1300, target: 100000000000, name: "재벌" },
    { stage: 13, days: 1600, target: 500000000000, name: "시장 지배자" },
    { stage: 14, days: 2000, target: 2000000000000, name: "조 단위 부호" },
    { stage: 15, days: 2500, target: 10000000000000, name: "국가급 부호" },
    { stage: 16, days: 3000, target: 50000000000000, name: "대륙급 부호" },
    { stage: 17, days: 3600, target: 200000000000000, name: "행성급 부호" },
    { stage: 18, days: 4300, target: 1000000000000000, name: "은하급 부호" },
    { stage: 19, days: 5100, target: 5000000000000000, name: "우주급 부호" },
    { stage: 20, days: 6000, target: 10000000000000000, name: "투자의 신" }
];

// --- 100가지 랜덤 뉴스 풀 (대표 항목) ---
const NEWS_POOL = [
    { title: "📢 중앙은행 금리 인하 발표!", effect: "bull", intensity: 2.5, duration: 5 },
    { title: "🚀 AI 반도체 수요 폭발적 증가", effect: "bull", intensity: 3.2, duration: 7 },
    { title: "🍀 신약 임상 3상 최종 통과", effect: "bull", intensity: 4.5, duration: 8 },
    { title: "🚨 소비자 물가 폭등, 인플레이션 비상", effect: "bear", intensity: 2.5, duration: 5 },
    { title: "🌊 글로벌 대형 은행 파산 위기", effect: "bear", intensity: 4.8, duration: 15 },
    { title: "💣 지정학적 리스크, 전쟁 발발 위기", effect: "bear", intensity: 5.0, duration: 20 },
    { title: "⚠️ 미-중 무역 협상 진전과 난항 반복", effect: "volatile", intensity: 3.5, duration: 5 },
    { title: "💬 시장 관망세 지속, 거래량 급감", effect: "calm", intensity: 0.3, duration: 10 }
];

// --- 유틸리티 및 엔진 ---
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
    el.style.fontWeight = '900'; el.style.fontSize = '28px';
    el.style.color = isPositive ? '#2ecc71' : '#e74c3c';
    el.style.left = '50%'; el.style.top = '40%';
    document.body.appendChild(el);
    let start = null;
    function anim(t) {
        if (!start) start = t; let prog = (t - start) / 1000;
        el.style.transform = `translate(-50%, -${prog * 150}px)`; el.style.opacity = 1 - prog;
        if (prog < 1) requestAnimationFrame(anim); else el.remove();
    }
    requestAnimationFrame(anim);
}

function generateInitialState() {
    let s = {
        day: 1, money: 10000, shares: 0, avg_price: 0, debt: 0,
        inv_shares: 0, inv_avg_price: 0, inv_debt: 0, total_asset: 10000, history: [],
        current_stage_idx: 0, game_over: false, news_history: [], skill_points: 0, 
        skills: { insight: 0, risk: 0, credit: 0 },
        items: { time_stopper: 0, money_washer: 0, future_vision: 0, news_manipulator: 0 },
        time_stopper_days: 0, active_news: null, news_remaining: 0
    };
    let price = Math.floor(Math.random() * 601) + 200;
    for (let i = -7500; i <= 0; i++) {
        let o = price, c = Math.max(10, o + (Math.floor(Math.random() * 41) - 20));
        let h = Math.max(o, c) + Math.floor(Math.random() * 15), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 15));
        s.history.push({ day: i, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 1000) + 500 }); price = c;
    }
    s.price = price; return s;
}

function nextDay(days) {
    if (!gameState || gameState.game_over) return;
    for (let d = 0; d < days; d++) {
        gameState.day++;
        if (gameState.news_remaining > 0) { gameState.news_remaining--; if (gameState.news_remaining === 0) gameState.active_news = null; }
        let interestRate = 0.001 * (1 - (gameState.skills.risk * 0.1));
        let totalDebt = gameState.debt + gameState.inv_debt;
        if (totalDebt > 0) gameState.money -= (totalDebt * interestRate);
        if (!gameState.active_news && Math.random() < (0.05 + gameState.skills.insight * 0.02)) {
            let n = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
            gameState.active_news = n; gameState.news_remaining = n.duration;
            gameState.news_history.push({ day: gameState.day, title: n.title });
            document.getElementById('news-title').innerText = n.title;
            document.getElementById('news-msg').style.display = 'flex';
            if (days > 1) { updateAndDraw(); return; }
        }
        let change = 0;
        if (gameState.time_stopper_days > 0) { gameState.time_stopper_days--; } 
        else {
            change = Math.floor(Math.random() * 41) - 20;
            if (gameState.active_news) {
                let n = gameState.active_news;
                if (n.effect === 'bull') change = Math.floor(Math.random() * (20 * n.intensity));
                else if (n.effect === 'bear') change = -Math.floor(Math.random() * (20 * n.intensity));
            }
        }
        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + 5, l = Math.max(10, Math.min(o, c) - 5);
        gameState.price = c;
        gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) });
        let longV = (gameState.shares * c) - gameState.debt;
        let invV = gameState.inv_shares > 0 ? (gameState.inv_shares * (2 * gameState.inv_avg_price - c)) - gameState.inv_debt : 0;
        gameState.total_asset = gameState.money + longV + invV;
        let marginLimit = 0.1 * (1 - (gameState.skills.risk * 0.1));
        if (totalDebt > 0 && gameState.total_asset < totalDebt * marginLimit) {
            gameState.shares = 0; gameState.inv_shares = 0; gameState.debt = 0; gameState.inv_debt = 0;
            document.getElementById('liquidation-msg').style.display = 'flex'; break;
        }
        if (gameState.total_asset <= 0) { gameState.game_over = true; document.getElementById('gameover-msg').style.display = 'flex'; break; }
        checkStageClear();
    }
    updateAndDraw();
}

function checkStageClear() {
    let stage = STAGES[gameState.current_stage_idx];
    if (gameState.money >= stage.target) {
        gameState.current_stage_idx++; gameState.skill_points++;
        let bonus = 10000 + (gameState.skills.credit * 10000);
        gameState.money += bonus;
        document.getElementById('stage-clear-text').innerText = `STAGE ${gameState.current_stage_idx} 클리어!\n보너스 $${bonus.toLocaleString()} 획득!`;
        document.getElementById('stageclear-msg').style.display = 'flex';
        if (gameState.skills.credit >= 5) { let l50 = document.getElementById('lev-50x'); if(l50) l50.style.display = 'inline-block'; }
    }
}

// --- 매매 및 블랙마켓 ---
function setTradeMode(m) { currentTradeMode = m; document.getElementById('mode-long').classList.toggle('active', m === 'long'); document.getElementById('mode-inv').classList.toggle('active', m === 'inv'); }
function handleTrade(act) { trade(currentTradeMode === 'long' ? act : act + '_inv'); }
function handleTradeAll(a) {
    if (!gameState) return;
    let p = gameState.price, lev = selectedLev, feeRate = 0.0015, amt = 0;
    if (a === 'buy') { let costPerShare = (p / lev) + (p * feeRate); amt = Math.floor(gameState.money / costPerShare); }
    else { amt = (currentTradeMode === 'long') ? gameState.shares : gameState.inv_shares; }
    if (amt <= 0) return;
    document.getElementById('trade-amount').value = Math.floor(amt);
    handleTrade(a);
}

function trade(act) {
    const amt = parseInt(document.getElementById('trade-amount').value);
    if (isNaN(amt) || amt <= 0) return;
    const p = gameState.price, feeRate = 0.0015;
    if (act === 'buy') {
        let cost = p * amt, fee = cost * feeRate, req = (cost / selectedLev) + fee;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.debt += (cost - (cost/selectedLev));
            gameState.avg_price = (gameState.shares * gameState.avg_price + cost) / (gameState.shares + amt);
            gameState.shares += amt;
        }
    } else if (act === 'sell' && gameState.shares > 0) {
        let sAmt = Math.min(amt, gameState.shares), val = p * sAmt, fee = val * feeRate;
        let profit = (p - gameState.avg_price) * sAmt - fee;
        let repay = gameState.debt * (sAmt / gameState.shares);
        gameState.money += (val - repay - fee); gameState.debt -= repay; gameState.shares -= sAmt;
        showFloatingText((profit >= 0 ? '+' : '') + '$' + Math.floor(profit).toLocaleString(), profit >= 0);
        if (gameState.shares <= 0) { gameState.shares = 0; gameState.avg_price = 0; gameState.debt = 0; }
    } else if (act === 'buy_inv') {
        let cost = p * amt, fee = cost * feeRate, req = (cost / selectedLev) + fee;
        if (gameState.money >= req) {
            gameState.money -= req; gameState.inv_debt += (cost - (cost/selectedLev));
            gameState.inv_avg_price = (gameState.inv_shares * gameState.inv_avg_price + cost) / (gameState.inv_shares + amt);
            gameState.inv_shares += amt;
        }
    } else if (act === 'sell_inv' && gameState.inv_shares > 0) {
        let sAmt = Math.min(amt, gameState.inv_shares), val = p * sAmt, fee = val * feeRate;
        let profit = (gameState.inv_avg_price - p) * sAmt - fee;
        let repay = gameState.inv_debt * (sAmt / gameState.inv_shares);
        gameState.money += (sAmt * gameState.inv_avg_price + profit - repay - fee);
        gameState.inv_debt -= repay; gameState.inv_shares -= sAmt;
        showFloatingText((profit >= 0 ? '+' : '') + '$' + Math.floor(profit).toLocaleString(), profit >= 0);
        if (gameState.inv_shares <= 0) { gameState.inv_shares = 0; gameState.inv_avg_price = 0; gameState.inv_debt = 0; }
    }
    updateAndDraw();
}

const ITEM_INFO = {
    'time_stopper': { name: "⏳ 타임 스토퍼", desc: "3일간 주가 변동 정지" },
    'money_washer': { name: "🧼 머니 워셔", desc: "모든 부채 50% 탕감" },
    'future_vision': { name: "🔮 미래 예보", desc: "3일간의 예상 주가 확인" },
    'news_manipulator': { name: "📢 언론 조작", desc: "현재 악재를 호재로 전환" }
};

function buyItem(type, price) {
    const item = ITEM_INFO[type];
    if (confirm(`${item.name}\n${item.desc}\n\n가격: $${price.toLocaleString()}\n구매하시겠습니까?`)) {
        if (gameState.money >= price) { gameState.money -= price; gameState.items[type]++; updateUI(gameState); }
        else { alert("현금 부족!"); }
    }
}

function useItem(type) {
    if (gameState.items[type] <= 0) return;
    gameState.items[type]--;
    if (type === 'time_stopper') { gameState.time_stopper_days = 3; alert("⏳ 3일간 시장 정지!"); }
    else if (type === 'money_washer') { gameState.debt *= 0.5; gameState.inv_debt *= 0.5; alert("🧼 부채 50% 탕감!"); }
    else if (type === 'future_vision') {
        let res = "🔮 [미래 예보]\n"; let p = gameState.price;
        for(let i=1; i<=3; i++) { p += (Math.random()*40-20); res += `${i}일후: $${Math.floor(p).toLocaleString()}\n`; }
        alert(res);
    }
    else if (type === 'news_manipulator') {
        if (gameState.active_news && gameState.active_news.effect === 'bear') {
            gameState.active_news.effect = 'bull'; gameState.active_news.title = "📢 [조작] " + gameState.active_news.title;
            alert("📢 악재가 호재로 조작되었습니다!");
        } else { alert("조작할 악재 뉴스가 없습니다."); gameState.items[type]++; }
    }
    updateUI(gameState); updateAndDraw();
}

// --- 차트 및 UI 업데이트 ---
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
    if (currentTF === 'daily') hist = hist.slice(-60); 
    else if (currentTF === 'monthly') hist = hist.slice(-60); // 10년(120개)에서 5년(60개)으로 축소
    else hist = hist.slice(-30); 
    const isDark = (currentTheme === 'dark');
    const traces = [{ x: hist.map((_, i) => i), open: hist.map(h => h.open), high: hist.map(h => h.high), low: hist.map(h => h.low), close: hist.map(h => h.close), type: 'candlestick', increasing: {line:{color:'#ff3131'}}, decreasing: {line:{color:'#2196f3'}}, yaxis: 'y' }];
    const layout = {
        paper_bgcolor: isDark ? '#0a0b10' : '#f0f2f5', plot_bgcolor: isDark ? '#0a0b10' : '#f0f2f5', font: { color: isDark ? '#00f2ff' : '#1a2a3a', size: 10 },
        yaxis: { side: 'right', gridcolor: 'rgba(128,128,128,0.1)', fixedrange: false },
        xaxis: { tickvals: hist.map((_, i) => i), ticktext: hist.map(h => h.label), gridcolor: 'rgba(128,128,128,0.1)', range: currentRange, fixedrange: false },
        margin: { t: 10, b: 20, l: 10, r: 50 }, showlegend: false, dragmode: currentDragMode, shapes: []
    };

    const config = {
        displaylogo: false,
        responsive: true,
        scrollZoom: true, // 핀치 줌 및 휠 줌 통합 활성화
        doubleClick: 'reset+autosize',
        staticPlot: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoom2d']
    };

    Plotly.react('chart', traces, layout, config);
    document.getElementById('chart').on('plotly_relayout', e => { if (e['xaxis.range[0]'] !== undefined) currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; });
    updateUI(gameState);
}

function updateUI(s) {
    animateValue('money', Math.floor(s.money)); animateValue('total_asset', Math.floor(s.total_asset));
    document.getElementById('shares').innerText = Math.floor(s.shares).toLocaleString();
    document.getElementById('inv_shares').innerText = Math.floor(s.inv_shares).toLocaleString();
    document.getElementById('total_debt').innerText = Math.floor(s.debt + s.inv_debt).toLocaleString();
    const stage = STAGES[s.current_stage_idx] || STAGES[STAGES.length - 1];
    const newsHTML = s.news_history.slice().reverse().map(n => `<div class="news-item"><b>${n.day}일:</b> ${n.title}</div>`).join('');
    const elements = {
        'current-stage-num-side': stage.stage, 'current-stage-num-mobile': stage.stage,
        'target-money-side': `$${stage.target.toLocaleString()}`, 'target-money-mobile': stage.target.toLocaleString(),
        'remaining-days-mobile': Math.max(0, stage.days - s.day), 'news-list': newsHTML, 'news-list-mobile': newsHTML,
        'stat-insight-lv': s.skills.insight, 'stat-risk-lv': s.skills.risk, 'stat-credit-lv': s.skills.credit,
        'skill-insight-lv': s.skills.insight, 'skill-risk-lv': s.skills.risk, 'skill-credit-lv': s.skills.credit,
        'skill-points-val': s.skill_points,
        'stat-insight-bar': `${s.skills.insight * 20}%`, 'stat-risk-bar': `${s.skills.risk * 20}%`, 'stat-credit-bar': `${s.skills.credit * 20}%`,
        'stage-progress-bar-mobile': `${Math.min(100, (s.money / stage.target) * 100)}%`
    };
    for (let id in elements) { let el = document.getElementById(id); if (el) { if (id.includes('bar')) el.style.width = elements[id]; else if (id.includes('news-list')) el.innerHTML = elements[id]; else el.innerText = elements[id]; } }
    for (let item in s.items) { const btn = document.getElementById(`item-${item}`); if (btn) { btn.innerText = `${ITEM_INFO[item].name.split(' ')[0]} ${s.items[item]}`; btn.disabled = (s.items[item] <= 0); btn.style.opacity = (s.items[item] > 0) ? "1" : "0.3"; } }
    const rank = s.total_asset >= 1000000000000 ? "💎 투자의 신" : s.total_asset >= 100000000 ? "🏆 전설" : s.total_asset >= 1000000 ? "🎩 슈퍼개미" : "흙수저";
    if(document.getElementById('player-rank-mobile')) document.getElementById('player-rank-mobile').innerText = rank;
}

function showShopMenu() { 
    document.getElementById('stageclear-msg').style.display = 'none';
    document.getElementById('shop-msg').style.display = 'flex'; 
    document.getElementById('shop-cash').innerText = `$${Math.floor(gameState.money).toLocaleString()}`;
}
function closeShopMenu() { 
    document.getElementById('shop-msg').style.display = 'none'; 
    document.getElementById('stageclear-msg').style.display = 'flex'; 
}
function showSkillMenu() { 
    document.getElementById('stageclear-msg').style.display = 'none';
    document.getElementById('skill-msg').style.display = 'flex'; 
    updateUI(gameState);
}
function closeSkillMenu() { 
    document.getElementById('skill-msg').style.display = 'none'; 
    document.getElementById('stageclear-msg').style.display = 'flex'; 
}
function closeNewsOverlay() { document.getElementById('news-msg').style.display = 'none'; }
function closeStageOverlay() { 
    if (gameState.skill_points > 0) {
        if (!confirm(`아직 ${gameState.skill_points}포인트의 스킬 포인트가 남았습니다.\n사용하지 않고 다음 스테이지로 진행하시겠습니까?\n(남은 포인트는 누적되어 다음 스테이지에서 사용 가능합니다)`)) {
            return;
        }
    }
    document.getElementById('stageclear-msg').style.display = 'none'; 
}
function resetGame() { location.reload(); }

window.onload = () => { gameState = generateInitialState(); updateAndDraw(); };
