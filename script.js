// --- 상태 변수 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, vol: false, macd: false, rsi: false, stoch: false, cci: false, adx: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1, firstBuyAll = true;

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

// --- 20단계 스테이지 설정 (시작 자산 $50,000 기준 재설계) ---
const STAGES = [
    { stage: 1, days: 25, target: 150000, name: "튜토리얼: 첫 도약" },
    { stage: 2, days: 50, target: 400000, name: "기초 자산 형성" },
    { stage: 3, days: 80, target: 1000000, name: "백만 달러의 꿈" },
    { stage: 4, days: 120, target: 3000000, name: "슈퍼 개미의 탄생" },
    { stage: 5, days: 180, target: 10000000, name: "프로 투자자" },
    { stage: 6, days: 250, target: 30000000, name: "자산가로 가는 길" },
    { stage: 7, days: 350, target: 100000000, name: "억대 자산가" },
    { stage: 8, days: 500, target: 300000000, name: "지역구 큰 손" },
    { stage: 9, days: 700, target: 1000000000, name: "유니콘 투자자" },
    { stage: 10, days: 900, target: 5000000000, name: "시장 지배자" },
    { stage: 11, days: 1200, target: 20000000000, name: "데카콘 기업주" },
    { stage: 12, days: 1500, target: 100000000000, name: "재벌가" },
    { stage: 13, days: 1800, target: 500000000000, name: "국가급 부호" },
    { stage: 14, days: 2200, target: 2000000000000, name: "조 단위 거부" },
    { stage: 15, days: 2700, target: 10000000000000, name: "대륙급 거물" },
    { stage: 16, days: 3300, target: 50000000000000, name: "지구의 주인" },
    { stage: 17, days: 4000, target: 200000000000000, name: "행성급 부호" },
    { stage: 18, days: 4800, target: 1000000000000000, name: "은하급 거부" },
    { stage: 19, days: 5700, target: 5000000000000000, name: "우주의 제왕" },
    { stage: 20, days: 6800, target: 10000000000000000, name: "투자의 신 (완성)" }
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
        day: 1, money: 50000, shares: 0, avg_price: 0, debt: 0,
        inv_shares: 0, inv_avg_price: 0, inv_debt: 0, total_asset: 50000, history: [],
        current_stage_idx: 0, game_over: false, news_history: [], skill_points: 0, 
        skills: { insight: 0, risk: 0, credit: 0 },
        items: { time_stopper: 0, money_washer: 0, future_vision: 0, news_manipulator: 0 },
        time_stopper_days: 0, active_news: null, news_remaining: 0
    };
    
    // 1. 딱 시작했을 때의 현재가 결정 ($800 ~ $1200)
    const startPrice = Math.floor(Math.random() * 401) + 800; 
    let current = startPrice;
    let tempHistory = [];

    // 2. 현재가로부터 거꾸로 7500일간의 히스토리 생성 (역산)
    for (let i = 0; i >= -7500; i--) {
        let c = current;
        let o = Math.max(10, c - (Math.floor(Math.random() * 41) - 20));
        let h = Math.max(o, c) + Math.floor(Math.random() * 15);
        let l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 15));
        tempHistory.push({ day: i, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 1000) + 500 });
        current = o;
    }
    
    s.history = tempHistory.reverse();
    s.price = startPrice;
    return s;
}

function nextDay(days) {
    if (!gameState || gameState.game_over) return;
    for (let d = 0; d < days; d++) {
        gameState.day++;

        // 스테이지 제한 시간 체크
        let stage = STAGES[gameState.current_stage_idx];
        if (gameState.day > stage.days) {
            gameState.game_over = true;
            document.getElementById('fail-reason').innerText = `제한 시간(${stage.days}일)이 초과되었습니다. 목표 금액($${stage.target.toLocaleString()}) 달성 실패!`;
            document.getElementById('gameover-msg').style.display = 'flex';
            break;
        }

        // 3일 전 경고 알림 (현금화 독려)
        if (stage.days - gameState.day === 3) {
            alert(`⚠️ 스테이지 종료 3일 전입니다!\n\n목표 달성을 위해 보유 중인 주식을 모두 매도하여 현금화하시기 바랍니다.\n(미실현 손익은 클리어 조건에 포함되지 않습니다)`);
        }

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
                if (n.effect === 'bull') change = Math.floor(Math.random() * (25 * n.intensity));
                else if (n.effect === 'bear') {
                    // 주가가 낮을 때는 하락폭을 제한하여 바닥 고착화 방지
                    let dropLimit = (gameState.price < 200) ? 0.5 : 1.0;
                    change = -Math.floor(Math.random() * (20 * n.intensity * dropLimit));
                }
            }
            // 바닥권 탈출 엔진: 가격이 낮을수록 위로 쏘아 올리는 힘이 강력해짐
            if (gameState.price < 150) {
                let thrust = (150 - gameState.price) / 2; // 가격이 낮을수록 커짐
                change += Math.floor(Math.random() * 20) + thrust; 
            }
        }
        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + 5, l = Math.max(10, Math.min(o, c) - 5);
        gameState.price = c;
        gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) });
        let longV = (gameState.shares * c) - gameState.debt;
        let invV = gameState.inv_shares > 0 ? (gameState.inv_shares * (2 * gameState.inv_avg_price - c)) - gameState.inv_debt : 0;
        gameState.total_asset = gameState.money + longV + invV;
        // 청산 조건: 유지 증거금 10% (복구)
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
    if (a === 'buy' && firstBuyAll) {
        alert("💡 [전액 매수 안전 안내]\n\n현재 청산 기준(10%)에서 즉시 청산을 방지하기 위해\n시스템이 레버리지 배율(10x~30x)에 맞춰 '생존 현금'을 자동으로 남깁니다.\n배율이 높을수록 더 많은 현금을 보존하여 변동성을 견디게 합니다.");
        firstBuyAll = false;
    }
    let p = gameState.price, lev = selectedLev, feeRate = 0.0015, amt = 0;
    if (a === 'buy') { 
        let costPerShare = (p / lev) + (p * feeRate); 
        
        // --- 10x, 20x, 30x 레버리지 전용 안전 공식 ---
        // 배율이 높을수록 증거금 대비 여유 현금을 더 많이 남깁니다.
        let safeUsageRate = 1.0 - (lev * 0.02); // 10배:80%, 20배:60%, 30배:40% 근처
        safeUsageRate = Math.max(0.3, Math.min(0.98, safeUsageRate)); 
        
        amt = Math.floor((gameState.money * safeUsageRate) / costPerShare); 
    }
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
        if (gameState.money >= price) { 
            gameState.money -= price; 
            gameState.items[type]++; 
            // 상점 화면 잔액 즉시 갱신
            const shopCashEl = document.getElementById('shop-cash');
            if (shopCashEl) shopCashEl.innerText = `$${Math.floor(gameState.money).toLocaleString()}`;
            updateUI(gameState); 
        }
        else { alert("현금 부족!"); }
    }
}

function upgradeSkill(type) {
    if (gameState.skill_points > 0) {
        if (gameState.skills[type] >= 5) {
            alert("최대 레벨(5)에 도달했습니다!");
            return;
        }
        gameState.skill_points--;
        gameState.skills[type]++;
        updateUI(gameState);
        // 신용도 5레벨 달성 시 50x 레버리지 버튼 처리
        if (type === 'credit' && gameState.skills.credit >= 5) {
             let l50 = document.getElementById('lev-50x'); if(l50) l50.style.display = 'inline-block';
        }
    } else {
        alert("스킬 포인트가 부족합니다!");
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
    let displayHist = [...hist];
    if (currentTF === 'daily') displayHist = hist.slice(-60); 
    else if (currentTF === 'monthly') displayHist = hist.slice(-60); 
    else displayHist = hist.slice(-30); 

    const isDark = (currentTheme === 'dark');
    const isMobile = window.innerWidth < 600;
    const traces = [];
    const startIndex = hist.length - displayHist.length;

    // X축 날짜 겹침 방지: 표시 개수 제한
    const tickCount = isMobile ? 6 : 12;
    const tickStep = Math.ceil(displayHist.length / tickCount);
    const tickIndices = displayHist.map((_, i) => i).filter(i => i % tickStep === 0 || i === displayHist.length - 1);

    // 1. 캔들스틱
    traces.push({
        x: displayHist.map((_, i) => i),
        open: displayHist.map(h => h.open), high: displayHist.map(h => h.high),
        low: displayHist.map(h => h.low), close: displayHist.map(h => h.close),
        type: 'candlestick',
        increasing: {line:{color:'#ff3131', width: 1}, fillcolor: '#ff3131'},
        decreasing: {line:{color:'#2196f3', width: 1}, fillcolor: '#2196f3'},
        yaxis: 'y', name: 'Price'
    });

    // 2. MA
    if (showInd.ma) {
        [5, 20].forEach((period, idx) => {
            const data = [];
            for (let i = startIndex; i < hist.length; i++) {
                const slice = hist.slice(Math.max(0, i - period + 1), i + 1);
                data.push(slice.reduce((a, b) => a + b.close, 0) / slice.length);
            }
            traces.push({ x: displayHist.map((_, i) => i), y: data, type: 'scatter', mode: 'lines', line: { width: 1, color: idx === 0 ? '#ffeb3b' : '#e91e63' }, yaxis: 'y' });
        });
    }

    // 3. BB
    if (showInd.bb) {
        const period = 20; const upper = [], lower = [];
        for (let i = startIndex; i < hist.length; i++) {
            const slice = hist.slice(Math.max(0, i - period + 1), i + 1).map(h => h.close);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            const stdDev = Math.sqrt(slice.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / slice.length);
            upper.push(avg + 2 * stdDev); lower.push(avg - 2 * stdDev);
        }
        const bbColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,102,204,0.4)'; // 다크:연회색, 라이트:진청색
        traces.push({ x: displayHist.map((_, i) => i), y: upper, type: 'scatter', mode: 'lines', line: { width: 1, color: bbColor, dash: 'dot' }, yaxis: 'y', name: 'BB Upper' });
        traces.push({ x: displayHist.map((_, i) => i), y: lower, type: 'scatter', mode: 'lines', line: { width: 1, color: bbColor, dash: 'dot' }, yaxis: 'y', name: 'BB Lower' });
    }

    // 4. Vol
    if (showInd.vol) {
        traces.push({
            x: displayHist.map((_, i) => i), y: displayHist.map(h => h.vol),
            type: 'bar', marker: { color: displayHist.map(h => h.close >= h.open ? 'rgba(255,49,49,0.2)' : 'rgba(33,150,243,0.2)') },
            yaxis: 'y2'
        });
    }

    // 보조지표 계산 및 렌더링
    const renderOscillator = (id, data, color, name) => {
        traces.push({ x: displayHist.map((_, i) => i), y: data, type: 'scatter', mode: 'lines', line: { color: color, width: 1.2 }, yaxis: 'y3', name: name });
    };

    if (showInd.rsi) {
        const period = 14; const rsiData = [];
        for (let i = startIndex; i < hist.length; i++) {
            if (i < period) { rsiData.push(null); continue; }
            let up = 0, down = 0;
            for (let j = i - period + 1; j <= i; j++) {
                const diff = hist[j].close - hist[j-1].close;
                if (diff > 0) up += diff; else down -= diff;
            }
            rsiData.push(100 - (100 / (1 + (up / (down || 1)))));
        }
        renderOscillator('rsi', rsiData, '#00ff00', 'RSI');
    }

    if (showInd.macd) {
        const ema = (data, p) => {
            let res = [data[0]]; const k = 2 / (p + 1);
            for(let i=1; i<data.length; i++) res.push(data[i]*k + res[i-1]*(1-k));
            return res;
        };
        const closes = hist.map(h => h.close);
        const e12 = ema(closes, 12), e26 = ema(closes, 26);
        const macdLine = e12.map((v, i) => v - e26[i]);
        renderOscillator('macd', macdLine.slice(startIndex), '#2196f3', 'MACD');
    }

    if (showInd.stoch) {
        const period = 14; const kLine = [];
        for (let i = startIndex; i < hist.length; i++) {
            const slice = hist.slice(Math.max(0, i - period + 1), i + 1);
            const low = Math.min(...slice.map(h => h.low));
            const high = Math.max(...slice.map(h => h.high));
            kLine.push(100 * (hist[i].close - low) / ((high - low) || 1));
        }
        renderOscillator('stoch', kLine, '#ff3131', 'Stoch %K');
    }

    if (showInd.cci) {
        const period = 20; const cciData = [];
        for (let i = startIndex; i < hist.length; i++) {
            const slice = hist.slice(Math.max(0, i - period + 1), i + 1);
            const tp = slice.map(h => (h.high + h.low + h.close) / 3);
            const avgTp = tp.reduce((a, b) => a + b, 0) / tp.length;
            const md = tp.reduce((a, b) => a + Math.abs(b - avgTp), 0) / tp.length;
            cciData.push((tp[tp.length-1] - avgTp) / (0.015 * (md || 1)));
        }
        renderOscillator('cci', cciData, '#e91e63', 'CCI');
    }

    if (showInd.adx) {
        const period = 14; 
        let trs = [], plusDMs = [], minusDMs = [];
        // 1. TR 및 DM 계산
        for (let i = 1; i < hist.length; i++) {
            const h = hist[i], p = hist[i-1];
            const tr = Math.max(h.high - h.low, Math.abs(h.high - p.close), Math.abs(h.low - p.close));
            const plusDM = (h.high - p.high > p.low - h.low) ? Math.max(h.high - p.high, 0) : 0;
            const minusDM = (p.low - h.low > h.high - p.high) ? Math.max(p.low - h.low, 0) : 0;
            trs.push(tr); plusDMs.push(plusDM); minusDMs.push(minusDM);
        }
        // 2. Smoothing 및 ADX 계산
        let adxFull = new Array(hist.length).fill(null);
        let sTR = 0, sPDM = 0, sMDM = 0;
        for (let i = 0; i < trs.length; i++) {
            sTR += trs[i]; sPDM += plusDMs[i]; sMDM += minusDMs[i];
            if (i >= period - 1) {
                if (i > period - 1) {
                    sTR = sTR - (sTR / period) + trs[i];
                    sPDM = sPDM - (sPDM / period) + plusDMs[i];
                    sMDM = sMDM - (sMDM / period) + minusDMs[i];
                }
                const plusDI = 100 * (sPDM / sTR);
                const minusDI = 100 * (sMDM / sTR);
                const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI || 1);
                // 임시 저장 후 다시 스무딩하여 ADX 산출
                adxFull[i + 1] = dx; 
            }
        }
        // DX를 다시 한 번 스무딩하여 최종 ADX 산출
        const adxData = [];
        for (let i = startIndex; i < hist.length; i++) {
            const slice = adxFull.slice(Math.max(0, i - period + 1), i + 1).filter(v => v !== null);
            const val = slice.length > 0 ? slice.reduce((a, b) => a + b) / slice.length : null;
            adxData.push(val);
        }
        renderOscillator('adx', adxData, '#00f2ff', 'ADX');
    }

    // 지표가 하나라도 켜져 있는지 확인
    const anyInd = showInd.rsi || showInd.macd || showInd.stoch || showInd.cci || showInd.adx;

    // --- 가이드 선 (현재가 및 평단가) 및 라벨 생성 ---
    const shapes = [];
    const annotations = [];
    const lastIdx = displayHist.length - 1;
    
    // 1. 현재가 가이드 선 및 라벨 (우측)
    shapes.push({
        type: 'line', x0: 0, x1: lastIdx, y0: gameState.price, y1: gameState.price,
        line: { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', width: 1, dash: 'dot' }
    });
    annotations.push({
        x: lastIdx, y: gameState.price, text: `$${Math.floor(gameState.price).toLocaleString()}`,
        showarrow: false, xanchor: 'left', yanchor: 'middle',
        font: { size: 10, color: '#fff', weight: 'bold' },
        bgcolor: isDark ? '#444' : '#888',
        bordercolor: '#fff', borderwidth: 1, xshift: 5
    });

    // 2. 롱 평단가 선 및 라벨 (좌측)
    if (gameState.shares > 0) {
        shapes.push({
            type: 'line', x0: 0, x1: lastIdx, y0: gameState.avg_price, y1: gameState.avg_price,
            line: { color: '#ff9800', width: 1.5, dash: 'dash' }
        });
        annotations.push({
            x: 0, y: gameState.avg_price, text: `롱평단: $${Math.floor(gameState.avg_price).toLocaleString()}`,
            showarrow: false, xanchor: 'left', yanchor: 'bottom',
            font: { size: 10, color: '#fff' },
            bgcolor: 'rgba(255, 152, 0, 0.8)', xshift: 5
        });
    }

    // 3. 인버스 평단가 선 및 라벨 (좌측)
    if (gameState.inv_shares > 0) {
        shapes.push({
            type: 'line', x0: 0, x1: lastIdx, y0: gameState.inv_avg_price, y1: gameState.inv_avg_price,
            line: { color: '#9c27b0', width: 1.5, dash: 'dash' }
        });
        annotations.push({
            x: 0, y: gameState.inv_avg_price, text: `숏평단: $${Math.floor(gameState.inv_avg_price).toLocaleString()}`,
            showarrow: false, xanchor: 'left', yanchor: 'top',
            font: { size: 10, color: '#fff' },
            bgcolor: 'rgba(156, 39, 176, 0.8)', xshift: 5
        });
    }

    const layout = {
        paper_bgcolor: isDark ? '#0a0b10' : '#f0f2f5', plot_bgcolor: isDark ? '#0a0b10' : '#f0f2f5',
        font: { color: isDark ? '#00f2ff' : '#1a2a3a', size: 10 },
        showlegend: false, dragmode: currentDragMode, 
        margin: { t: 10, b: 65, l: 10, r: 60 },
        xaxis: { 
            tickvals: tickIndices, 
            ticktext: tickIndices.map(i => displayHist[i].label), 
            gridcolor: 'rgba(128,128,128,0.1)', 
            range: currentRange, 
            fixedrange: false,
            tickfont: { size: isMobile ? 9 : 10 },
            rangeslider: { 
                visible: true, 
                thickness: 0.08,
                bgcolor: isDark ? '#15171e' : '#e0e0e0',
                bordercolor: 'rgba(128,128,128,0.3)',
                borderwidth: 1,
                yaxis: { rangemode: 'fixed' }
            }
        },
        yaxis: { 
            side: 'right', 
            gridcolor: 'rgba(128,128,128,0.1)', 
            domain: anyInd ? [0.4, 1] : [0.1, 1],
            tickfont: { color: isDark ? '#00f2ff' : '#1a2a3a' }
        },
        yaxis2: { 
            overlaying: 'y', 
            showgrid: false, 
            showticklabels: false, 
            domain: anyInd ? [0.4, 0.6] : [0.1, 0.3], 
            opacity: 0.15 
        },
        yaxis3: { 
            side: 'right', 
            gridcolor: 'rgba(128,128,128,0.1)', 
            domain: [0, 0.3], 
            range: [-150, 200],
            visible: anyInd,
            tickfont: { 
                color: isDark ? '#ffca28' : '#e65100',
                size: 11,
                fontweight: 'bold'
            },
            zerolinecolor: isDark ? 'rgba(255,202,40,0.2)' : 'rgba(230,81,0,0.2)'
        },
        shapes: shapes,
        annotations: annotations // 이 부분이 드디어 추가되었습니다.
    };

    const config = { displaylogo: false, responsive: true, scrollZoom: true, modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoom2d'] };
    Plotly.react('chart', traces, layout, config);
    document.getElementById('chart').on('plotly_relayout', e => { if (e['xaxis.range[0]'] !== undefined) currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; });
    updateUI(gameState);
}

function updateUI(s) {
    if (!s) return;
    animateValue('money', Math.floor(s.money)); 
    animateValue('total_asset', Math.floor(s.total_asset));
    const sharesEl = document.getElementById('shares'); if(sharesEl) sharesEl.innerText = Math.floor(s.shares).toLocaleString();
    const invSharesEl = document.getElementById('inv_shares'); if(invSharesEl) invSharesEl.innerText = Math.floor(s.inv_shares).toLocaleString();
    const debtEl = document.getElementById('total_debt'); if(debtEl) debtEl.innerText = Math.floor(s.debt + s.inv_debt).toLocaleString();
    
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

function showStageIntro() {
    const stage = STAGES[gameState.current_stage_idx];
    document.getElementById('intro-stage-num').innerText = `STAGE ${stage.stage}`;
    document.getElementById('intro-stage-name').innerText = stage.name;
    document.getElementById('intro-target').innerText = `$${stage.target.toLocaleString()}`;
    document.getElementById('intro-days').innerText = `${stage.days}일`;
    document.getElementById('stage-intro-msg').style.display = 'flex';
}

function startStage() {
    document.getElementById('stage-intro-msg').style.display = 'none';
    updateAndDraw();
}

function closeStageOverlay() { 
    if (gameState.skill_points > 0) {
        if (!confirm(`아직 ${gameState.skill_points}포인트의 스킬 포인트가 남았습니다.\n사용하지 않고 다음 스테이지로 진행하시겠습니까?\n(남은 포인트는 누적되어 다음 스테이지에서 사용 가능합니다)`)) {
            return;
        }
    }
    document.getElementById('stageclear-msg').style.display = 'none'; 
    showStageIntro(); // 다음 스테이지 이름과 목표를 보여줌
}
function resetGame() { location.reload(); }

window.onload = () => { 
    gameState = generateInitialState(); 
    updateUI(gameState); 
    showStageIntro(); // 시작 시 인트로 표시
};
