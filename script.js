// --- 글로벌 상태 관리 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, vol: false, macd: false, rsi: false, stoch: false, cci: false, adx: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1, firstBuyAll = true, userShapes = [];

// --- UI 엘리먼트 캐싱 (성능 최적화) ---
const UI = {
    money: null, totalAsset: null, shares: null, invShares: null, totalDebt: null,
    stageNum: null, stageTarget: null, remainingDays: null, newsList: null,
    skillLvs: { insight: null, risk: null, credit: null },
    skillBars: { insight: null, risk: null, credit: null },
    skillPoints: null, items: {}
};

function initUICache() {
    UI.money = document.getElementById('money');
    UI.totalAsset = document.getElementById('total_asset');
    UI.shares = document.getElementById('shares');
    UI.invShares = document.getElementById('inv_shares');
    UI.totalDebt = document.getElementById('total_debt');
    UI.stageNum = document.getElementById('current-stage-num-side');
    UI.stageTarget = document.getElementById('target-money-side');
    UI.remainingDays = document.getElementById('remaining-days-mobile');
    UI.newsList = document.getElementById('news-list');
    UI.skillPoints = document.getElementById('skill-points-val');
    
    ['insight', 'risk', 'credit'].forEach(sk => {
        UI.skillLvs[sk] = document.getElementById(`stat-${sk}-lv`) || document.getElementById(`skill-${sk}-lv`);
        UI.skillBars[sk] = document.getElementById(`stat-${sk}-bar`);
    });
}

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
        'insight': "🔍 [통찰력]\n레벨당 뉴스 발생 확률 +4%! 더 많은 시장 정보(호재/악재)를 남들보다 빠르게 접하여 매매 기회를 창출합니다.",
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
    if (themeBtn) { themeBtn.innerText = (currentTheme === 'dark') ? "☀️" : "🌙"; }
    
    // 테마 변경 시 그리기 모드 색상도 즉시 업데이트
    if (currentDragMode === 'drawline') {
        setDragMode('drawline');
    }
    updateAndDraw();
    checkStageClear();
    saveGame();
}
function toggleInd(n, btn) { showInd[n] = !showInd[n]; btn.classList.toggle('on', showInd[n]); updateAndDraw(); }
function changeTF(tf) { 
    currentTF = tf; currentRange = null;
    document.querySelectorAll('.btn-tf').forEach(b => { if(['daily','monthly','yearly'].includes(b.id)) b.classList.remove('active'); });
    const target = document.getElementById(tf); if(target) target.classList.add('active');
    updateAndDraw(); 
}
function setLev(v, btn) { selectedLev = v; document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

function setDragMode(m) { 
    currentDragMode = m; 
    let config = { dragmode: m };
    
    // 버튼 활성화 상태 업데이트
    const panBtn = document.getElementById('btn-drag-pan');
    const drawBtn = document.getElementById('btn-drag-draw');
    if (panBtn && drawBtn) {
        panBtn.classList.toggle('active', m === 'pan');
        drawBtn.classList.toggle('active', m === 'drawline');
    }

    if (m === 'drawline') {
        config.newshape = { line: { color: currentTheme === 'dark' ? '#00f2ff' : '#0040ff', width: 2 } };
    }
    Plotly.relayout('chart', config); 
}

function undoLastShape() {
    const chartEl = document.getElementById('chart');
    if (!chartEl || !chartEl.layout || !chartEl.layout.shapes) return;

    // 현재 차트에서 가이드 선(dash/dot)을 제외한 사용자 선만 추출
    let allShapes = chartEl.layout.shapes;
    let userShapeIndices = [];
    allShapes.forEach((s, i) => {
        if (!s.line || (s.line.dash !== 'dot' && s.line.dash !== 'dash')) {
            userShapeIndices.push(i);
        }
    });

    if (userShapeIndices.length > 0) {
        const lastIdx = userShapeIndices[userShapeIndices.length - 1];
        allShapes.splice(lastIdx, 1); // 마지막 사용자 선 제거
        userShapes = allShapes.filter(s => !s.line || (s.line.dash !== 'dot' && s.line.dash !== 'dash'));
        Plotly.relayout('chart', { shapes: allShapes }); // 차트에 즉시 반영
    }
}

function clearShapes() {
    const chartEl = document.getElementById('chart');
    if (!chartEl || !chartEl.layout || !chartEl.layout.shapes) return;

    // 가이드 선(dash/dot)만 남기고 나머지 모두 제거
    let remainingShapes = chartEl.layout.shapes.filter(s => 
        s.line && (s.line.dash === 'dot' || s.line.dash === 'dash')
    );
    
    userShapes = []; // 전역 변수 초기화
    Plotly.relayout('chart', { shapes: remainingShapes }); // 차트 즉시 쇄신
}

// --- 20단계 스테이지 설정 (명칭 및 밸런스 최적화) ---
const STAGES = [
    { stage: 1, days: 30, target: 100000, name: "🌱 튜토리얼" },
    { stage: 2, days: 60, target: 300000, name: "🏠 내 집 마련의 꿈" },
    { stage: 3, days: 100, target: 700000, name: "🚗 중산층으로의 진입" },
    { stage: 4, days: 150, target: 1500000, name: "💼 은퇴 자금 완성" },
    { stage: 5, days: 200, target: 4000000, name: "🏢 꼬마 빌딩 건물주" },
    { stage: 6, days: 300, target: 10000000, name: "📈 전업 투자자의 길" },
    { stage: 7, days: 450, target: 30000000, name: "👔 헤지펀드 설립" },
    { stage: 8, days: 600, target: 70000000, name: "🏦 프라이빗 뱅커의 큰손" },
    { stage: 9, days: 800, target: 150000000, name: "🦄 유니콘 기업 투자자" },
    { stage: 10, days: 1000, target: 500000000, name: "🌎 글로벌 시장 지배자" },
    { stage: 11, days: 1300, target: 1000000000, name: "💎 억만장자 클럽 가입" },
    { stage: 12, days: 1600, target: 4000000000, name: "👑 재계의 황태자" },
    { stage: 13, days: 2000, target: 10000000000, name: "🏛️ 국가 경제의 심장" },
    { stage: 14, days: 2500, target: 50000000000, name: "💵 조 단위의 제왕" },
    { stage: 15, days: 3000, target: 100000000000, name: "🌌 대륙을 넘어서" },
    { stage: 16, days: 3600, target: 500000000000, name: "🌍 지구의 실질적 주인" },
    { stage: 17, days: 4300, target: 1300000000000, name: "🛰️ 우주 산업의 정점" },
    { stage: 18, days: 5100, target: 3000000000000, name: "🪐 행성 연합 대부호" },
    { stage: 19, days: 6000, target: 10000000000000, name: "☄️ 우주 화폐의 지배자" },
    { stage: 20, days: 7000, target: 100000000000000, name: "🕉️ 불멸의 투자의 신" }
];

// --- 100가지 랜덤 뉴스 풀 ---
const NEWS_POOL = [
    { title: "📢 중앙은행 금리 인하 발표! 시장에 돈이 풀린다", effect: "bull", intensity: 2.5, duration: 3 },
    { title: "🚨 인플레이션 쇼크! 금리 인상 공포 확산", effect: "bear", intensity: 2.8, duration: 4 },
    { title: "📉 CPI 지수 예상치 하회, 긴축 종료 기대", effect: "bull", intensity: 2.0, duration: 3 },
    { title: "🏦 글로벌 대형 은행 파산 위기설 발생", effect: "bear", intensity: 4.5, duration: 6 },
    { title: "💸 국채 금리 폭등, 위험 자산 투매 발생", effect: "bear", intensity: 3.0, duration: 4 },
    { title: "🌍 IMF, 세계 경제 성장률 전망치 상향", effect: "bull", intensity: 1.8, duration: 5 },
    { title: "📊 고용 지표 역대급 호조, 경기 과열 우려", effect: "bull", intensity: 1.5, duration: 3 },
    { title: "🏚️ 부동산 버블 붕괴 조짐, 금융권 부실 비상", effect: "bear", intensity: 3.8, duration: 7 },
    { title: "💵 달러 인덱스 폭등, 신흥국 자금 유출 가속", effect: "bear", intensity: 2.8, duration: 5 },
    { title: "⚡ 에너지 가격 폭등으로 전 세계 인플레 비상", effect: "bear", intensity: 3.5, duration: 4 },
    { title: "🚀 AI 반도체 수요 폭발적 증가, 공급 부족", effect: "bull", intensity: 3.8, duration: 5 },
    { title: "🧠 세계 최초 인간형 AI 상용화 성공 소식", effect: "bull", intensity: 4.2, duration: 4 },
    { title: "🛰️ 초미세 공정 한계 돌파, 수율 90% 달성", effect: "bull", intensity: 3.0, duration: 3 },
    { title: "💻 차세대 양자 컴퓨터 양산 소식 발표", effect: "bull", intensity: 5.0, duration: 6 },
    { title: "🛠️ 핵심 반도체 소재 수출 규제 발효", effect: "bear", intensity: 2.5, duration: 4 },
    { title: "📵 스마트폰 출하량 급감, 업계 성장 둔화", effect: "bear", intensity: 2.2, duration: 5 },
    { title: "☁️ 클라우드 서버 대규모 먹통 사태 발생", effect: "bear", intensity: 3.0, duration: 2 },
    { title: "👓 혁신적 VR/AR 기기 전격 출시", effect: "bull", intensity: 2.5, duration: 4 },
    { title: "🔒 국가급 사이버 보안 공격 방어 성공", effect: "bull", intensity: 1.8, duration: 3 },
    { title: "📉 메모리 가격 폭락, 반도체 업계 위기론", effect: "bear", intensity: 2.5, duration: 5 },
    { title: "🍀 암 정복 가능한 혁신 신약 임상 3상 통과", effect: "bull", intensity: 4.8, duration: 7 },
    { title: "🧬 유전자 가위 기술로 유전병 치료 성공", effect: "bull", intensity: 3.8, duration: 5 },
    { title: "🦠 신종 변이 바이러스 발견, 전 세계 비상", effect: "bear", intensity: 4.2, duration: 6 },
    { title: "🏥 원격 진료 플랫폼 가입자 폭증 소식", effect: "bull", intensity: 2.2, duration: 4 },
    { title: "⚠️ 대형 제약사 신약 부작용 은폐 의혹 폭로", effect: "bear", intensity: 4.0, duration: 5 },
    { title: "💊 비만 치료제 품귀 현상, 주문 폭주", effect: "bull", intensity: 3.2, duration: 4 },
    { title: "🧪 치매 치료제 동물 실험 획기적 결과", effect: "bull", intensity: 2.8, duration: 5 },
    { title: "📉 항암제 가격 강제 인하 정책 발표", effect: "bear", intensity: 2.5, duration: 4 },
    { title: "🚫 복제약 난립으로 수익성 악화 우려", effect: "bear", intensity: 1.8, duration: 3 },
    { title: "🦷 임플란트 신소재 승인 및 수출 호재", effect: "bull", intensity: 2.0, duration: 4 },
    { title: "🔋 전고체 배터리 주행거리 1,200km 달성", effect: "bull", intensity: 4.5, duration: 6 },
    { title: "⚡ 전기차 보조금 전격 확대 결정", effect: "bull", intensity: 2.8, duration: 5 },
    { title: "♻️ 탄소 중립 규제 강화로 친환경주 급등", effect: "bull", intensity: 2.5, duration: 7 },
    { title: "🔥 리튬 및 핵심 광물 가격 폭락 발생", effect: "bear", intensity: 3.2, duration: 4 },
    { title: "🛢️ 유가 급등으로 정유 및 배터리 수혜 기대", effect: "bull", intensity: 2.2, duration: 5 },
    { title: "🌊 해상 풍력 대단지 상업 가동 시작", effect: "bull", intensity: 2.0, duration: 6 },
    { title: "☀️ 태양광 패널 효율 세계 최고치 경신", effect: "bull", intensity: 1.8, duration: 4 },
    { title: "⚠️ 수소차 상용화 계획 보류 소식", effect: "bear", intensity: 3.0, duration: 5 },
    { title: "🌬️ 대기 오염 규제 강화로 관련 업종 강세", effect: "bull", intensity: 1.5, duration: 3 },
    { title: "🌲 아마존 산림 보호를 위한 대규모 펀드 조성", effect: "bull", intensity: 1.2, duration: 5 },
    { title: "💣 지정학적 리스크 심화, 전쟁 긴장 고조", effect: "bear", intensity: 5.0, duration: 8 },
    { title: "🤝 적대적 국가 간 극적인 평화 협상 타결", effect: "bull", intensity: 4.8, duration: 7 },
    { title: "🛑 강력한 무역 제재 조치 전격 발표", effect: "bear", intensity: 3.8, duration: 5 },
    { title: "🗳️ 대선 결과 확정, 시장 친화 정책 예고", effect: "bull", intensity: 2.8, duration: 4 },
    { title: "🚢 해상 물류 마비, 글로벌 공급 대란", effect: "bear", intensity: 3.2, duration: 6 },
    { title: "⚠️ 원자재 생산국 내전 발생으로 수급 비상", effect: "bear", intensity: 3.5, duration: 7 },
    { title: "🌐 글로벌 자유무역협정(FTA) 서명 소식", effect: "bull", intensity: 2.2, duration: 5 },
    { title: "🚫 해외 공장 자산 몰수 조치 뉴스 발생", effect: "bear", intensity: 4.5, duration: 6 },
    { title: "💬 정치인의 금리 개입 발언으로 시장 요동", effect: "volatile", intensity: 3.5, duration: 2 },
    { title: "📜 법인세 인하 법안 전격 통과", effect: "bull", intensity: 2.0, duration: 4 },
    { title: "👑 업계 1위 기업 간 대규모 M&A 소식", effect: "bull", intensity: 3.5, duration: 5 },
    { title: "💔 핵심 연구진 집단 이직 소문 확산", effect: "bear", intensity: 3.2, duration: 4 },
    { title: "📉 1분기 실적 '어닝 쇼크' 발표", effect: "bear", intensity: 3.0, duration: 3 },
    { title: "💎 세계 최초 신소재 상용화 라인 가동", effect: "bull", intensity: 4.0, duration: 6 },
    { title: "🛑 경영진 횡령 의혹으로 검찰 압수수색", effect: "bear", intensity: 4.2, duration: 7 },
    { title: "💸 역대 최고 수준의 배당금 지급 공시", effect: "bull", intensity: 2.5, duration: 3 },
    { title: "📦 물류 로봇 도입으로 수익성 극대화", effect: "bull", intensity: 2.0, duration: 5 },
    { title: "⚠️ 품질 결함으로 인한 글로벌 대규모 리콜", effect: "bear", intensity: 3.8, duration: 5 },
    { title: "🏢 유명 스타 CEO 영입 소식 발생", effect: "bull", intensity: 2.8, duration: 4 },
    { title: "🌟 브랜드 가치 세계 1위 달성 기념", effect: "bull", intensity: 2.0, duration: 3 },
    { title: "🎮 전 세계 열풍인 대작 게임 정식 출시", effect: "bull", intensity: 2.8, duration: 5 },
    { title: "🍿 OTT 서비스 구독자 급증 신기록 달성", effect: "bull", intensity: 2.2, duration: 4 },
    { title: "✈️ 해외여행 수요 팬데믹 이전 수준 추월", effect: "bull", intensity: 2.5, duration: 6 },
    { title: "📉 명품 시장 거품 붕괴 소식에 유통주 폭락", effect: "bear", intensity: 3.0, duration: 5 },
    { title: "🍔 글로벌 식품 체인 위생 논란 발생", effect: "bear", intensity: 3.2, duration: 3 },
    { title: "🛍️ 쇼핑 축제 매출액 역대 최고치 경신", effect: "bull", intensity: 1.8, duration: 3 },
    { title: "🚛 물류 대란 해소로 유통망 정상화", effect: "bull", intensity: 1.5, duration: 4 },
    { title: "💳 개인 연체율 급증으로 소비 위축 우려", effect: "bear", intensity: 3.0, duration: 6 },
    { title: "🎨 K-콘텐츠 글로벌 흥행으로 관련주 강세", effect: "bull", intensity: 2.5, duration: 5 },
    { title: "🛋️ 1인 가구 증가로 소형 가전 판매 폭주", effect: "bull", intensity: 1.5, duration: 4 },
    { title: "🪐 화성 탐사선 착륙 및 생명체 흔적 발견", effect: "bull", intensity: 4.8, duration: 8 },
    { title: "🛰️ 저궤도 위성 인터넷 전 세계 개통 완료", effect: "bull", intensity: 3.2, duration: 5 },
    { title: "🚀 소행성 광물 채굴 로봇 개발 완료", effect: "bull", intensity: 5.0, duration: 7 },
    { title: "🛸 미확인 비행체 공개 정부 공식 브리핑", effect: "bull", intensity: 2.8, duration: 4 },
    { title: "🧬 노화 방지 신기술 인간 임상 개시", effect: "bull", intensity: 4.0, duration: 6 },
    { title: "🌊 해저 도시 건설 프로젝트 첫 삽", effect: "bull", intensity: 2.5, duration: 8 },
    { title: "🚁 플라잉카 시내 시범 운행 성공", effect: "bull", intensity: 3.0, duration: 5 },
    { title: "📉 스타트업 투자 고갈로 기술주 위기설", effect: "bear", intensity: 3.5, duration: 6 },
    { title: "⚠️ 이상 기후로 인한 글로벌 식량 위기", effect: "bear", intensity: 2.8, duration: 5 },
    { title: "🧪 실험실 배양육 시판 허가 획득", effect: "bull", intensity: 1.8, duration: 4 },
    { title: "💬 시장 관망세 지속, 거래량 급감", effect: "calm", intensity: 0.3, duration: 10 },
    { title: "🌋 유명 투자 전문가의 폭락 경보 발령", effect: "bear", intensity: 3.8, duration: 3 },
    { title: "💰 포모(FOMO) 현상 가속, 개인 매수세 폭발", effect: "bull", intensity: 3.5, duration: 4 },
    { title: "⚠️ 숏 스퀴즈 발생! 인버스 투자자 비상", effect: "bull", intensity: 4.5, duration: 2 },
    { title: "🚫 과도한 레버리지 집중 단속 공지", effect: "bear", intensity: 2.8, duration: 4 },
    { title: "📰 주가 조작 세력 검거 소식에 신뢰 회복", effect: "bull", intensity: 1.5, duration: 3 },
    { title: "📊 연말 산타 랠리 기대감 고조", effect: "bull", intensity: 2.2, duration: 4 },
    { title: "❄️ 겨울 혹한 예보에 난방 관련주 급등", effect: "bull", intensity: 1.8, duration: 4 },
    { title: "📣 워렌 버핏의 대규모 추가 매수 소식", effect: "bull", intensity: 2.8, duration: 3 },
    { title: "📅 분기 말 수익률 관리 장세 시작", effect: "bull", intensity: 1.5, duration: 2 }
];

// --- 랜덤 선택지 이벤트 풀 (Sudden Encounters) ---
const EVENT_POOL = [
    {
        id: 'insider_info',
        title: "🤫 은밀한 제안",
        icon: "🕵️",
        desc: "익명의 정보원이 다가와 다음 뉴스에 대한 정보를 팔겠다고 제안합니다. 가격은 $20,000입니다.",
        options: [
            { 
                text: "정보를 구매한다 (-$20,000)", 
                action: (s) => {
                    if (s.money >= 20000) {
                        s.money -= 20000;
                        s.skills.insight += 1;
                        return { msg: "정보가 정확했습니다! 통찰력이 상승하고 시장 흐름을 더 잘 읽게 되었습니다.", success: true };
                    }
                    return { msg: "잔액이 부족하여 정보원이 떠나갔습니다.", success: false };
                }
            },
            { text: "거절한다 (아무 일 없음)", action: () => ({ msg: "안전이 최고입니다. 제안을 거절했습니다.", success: true }) }
        ]
    },
    {
        id: 'crypto_wallet',
        title: "💾 유실된 지갑",
        icon: "🗝️",
        desc: "오래전 잊고 있던 암호화폐 지갑의 복구 키를 찾았습니다! 도박을 해보시겠습니까?",
        options: [
            { 
                text: "지갑을 연다 (확률적 잭팟)", 
                action: (s) => {
                    if (Math.random() > 0.5) {
                        const gain = Math.floor(s.total_asset * 0.2) + 50000;
                        s.money += gain;
                        return { msg: `대박! 지갑 안에 $${gain.toLocaleString()} 가치의 코인이 들어있었습니다!`, success: true };
                    } else {
                        return { msg: "안타깝게도 지갑은 비어있거나 이미 해킹당한 상태였습니다.", success: false };
                    }
                }
            },
            { 
                text: "자선단체에 기부한다 (신용도 상승)", 
                action: (s) => {
                    s.skills.credit += 1;
                    return { msg: "지갑을 기부하여 사회적 평판이 좋아졌습니다! 신용도가 상승합니다.", success: true };
                }
            }
        ]
    },
    {
        id: 'leverage_temptation',
        title: "🏦 은행의 특별 대출",
        icon: "💸",
        desc: "주거래 은행에서 당신의 투자 실력을 인정하여 즉시 대출을 제안합니다. 단, 이자가 높습니다.",
        options: [
            { 
                text: "대출 수락 (현금 +$100,000, 부채 증가)", 
                action: (s) => {
                    s.money += 100000;
                    s.debt += 120000;
                    return { msg: "공격적인 투자를 위한 자금을 확보했습니다. 하지만 갚아야 할 돈도 늘어났습니다.", success: true };
                }
            },
            { text: "무시한다", action: () => ({ msg: "빚은 지지 않는 것이 상책입니다.", success: true }) }
        ]
    },
    {
        id: 'black_market_visit',
        title: "📦 의문의 택배",
        icon: "🎁",
        desc: "발신인 불명의 택배가 도착했습니다. 블랙마켓의 냄새가 납니다. 열어보시겠습니까?",
        options: [
            { 
                text: "열어본다 (랜덤 아이템)", 
                action: (s) => {
                    const items = Object.keys(s.items);
                    const randItem = items[Math.floor(Math.random() * items.length)];
                    s.items[randItem]++;
                    return { msg: `상자 안에는 [${ITEM_INFO[randItem].name}]이(가) 들어있었습니다!`, success: true };
                }
            },
            { text: "반송한다", action: () => ({ msg: "의심스러운 물건은 멀리하는 것이 좋습니다.", success: true }) }
        ]
    }
];

// --- 업적 데이터 정의 ---
const ACHIEVEMENTS = [
    { id: 'first_profit', name: "첫 수익", desc: "매도를 통해 처음으로 수익을 실현하세요.", icon: "💰" },
    { id: 'stage_5_clear', name: "건물주 등극", desc: "STAGE 5를 클리어하세요.", icon: "🏢" },
    { id: 'billionaire', name: "억만장자", desc: "총자산 10억 달러를 달성하세요.", icon: "💎" },
    { id: 'leverage_master', name: "하이 리스크 하이 리턴", desc: "30배 레버리지로 매수하세요.", icon: "🔥" },
    { id: 'news_victim', name: "뉴스 매니아", desc: "뉴스를 10번 확인하세요.", icon: "📰" },
    { id: 'skill_max', name: "마스터", desc: "하나의 기술을 만렙(5)까지 올리세요.", icon: "🎓" },
    { id: 'trader_god', name: "투자의 신", desc: "마지막 스테이지(20)를 클리어하세요.", icon: "🕉️" },
    { id: 'survival', name: "생존자", desc: "누적 1,000일을 생존하세요.", icon: "⏳" }
];

// --- 영구 기록 관리 (Hall of Fame) ---
const HOF_STORAGE_KEY = "ZTI_HALL_OF_FAME";
const SAVE_DATA_KEY = "ZTI_SAVE_PROGRESS";

function getHOF() {
    const saved = localStorage.getItem(HOF_STORAGE_KEY);
    const defaultHOF = { bestAsset: 0, totalDays: 0, maxStage: 0, unlockedAchievements: [], playCount: 0 };
    if (!saved) return defaultHOF;
    try {
        return { ...defaultHOF, ...JSON.parse(saved) };
    } catch (e) { return defaultHOF; }
}
function saveHOF(data) { localStorage.setItem(HOF_STORAGE_KEY, JSON.stringify(data)); }

// 실시간 최고 기록 및 업적 체크
function updateHOFRecords() {
    if (!gameState) return;
    let hof = getHOF();
    let changed = false;

    if (gameState.total_asset > hof.bestAsset) { hof.bestAsset = gameState.total_asset; changed = true; }
    if (gameState.current_stage_idx + 1 > hof.maxStage) { hof.maxStage = gameState.current_stage_idx + 1; changed = true; }
    
    if (changed) saveHOF(hof);
}

// 게임 종료 시 누적 통계 저장 (중복 합산 방지)
function finalizeHOFStats() {
    if (!gameState) return;
    let hof = getHOF();
    hof.totalDays += gameState.day;
    // 최고 기록 마지막 확인
    hof.bestAsset = Math.max(hof.bestAsset, gameState.total_asset);
    hof.maxStage = Math.max(hof.maxStage, gameState.current_stage_idx + 1);
    saveHOF(hof);
}

// --- 진행 상황 저장 및 불러오기 ---
function saveGame() {
    if (!gameState || gameState.game_over) return;
    localStorage.setItem(SAVE_DATA_KEY, JSON.stringify(gameState));
    updateHOFRecords(); // 최고 기록 실시간 갱신 추가
}

// 페이지 이탈 방지 및 자동 저장
window.addEventListener('beforeunload', (event) => {
    if (gameState && !gameState.game_over) {
        saveGame(); // 나가는 순간 마지막으로 한 번 더 저장
        event.preventDefault();
        event.returnValue = ''; // 브라우저 기본 경고창 활성화
    }
});

function manualSave() {
    if (!gameState || gameState.game_over) {
        alert("게임 진행 중일 때만 저장 가능합니다.");
        return;
    }
    saveGame();
    showFloatingText("💾 데이터가 저장되었습니다!", true);
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_DATA_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && !parsed.game_over) return parsed;
        } catch (e) { console.error("Save data error", e); }
    }
    return null;
}

function clearSave() {
    localStorage.removeItem(SAVE_DATA_KEY);
}

function checkAchievement(id) {
    let hof = getHOF();
    if (!hof.unlockedAchievements.includes(id)) {
        hof.unlockedAchievements.push(id);
        saveHOF(hof);
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        showAchievementToast(ach);
    }
}

// --- 업적 알림 토스트 실행 ---
function showAchievementToast(ach) {
    const toast = document.getElementById('achievement-toast');
    document.getElementById('ach-toast-icon').innerText = ach.icon;
    document.getElementById('ach-toast-name').innerText = ach.name;
    document.getElementById('ach-toast-desc').innerText = ach.desc;

    toast.classList.add('show');
    
    // 효과음 대신 시각적 강조를 위해 잠시 지연 후 제거
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// --- 랜덤 이벤트 실행 엔진 ---
function triggerRandomEvent() {
    const ev = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    document.getElementById('event-icon').innerText = ev.icon;
    document.getElementById('event-title').innerText = ev.title;
    document.getElementById('event-desc').innerText = ev.desc;
    
    const container = document.getElementById('event-options');
    container.innerHTML = '';
    ev.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-event-option';
        btn.innerHTML = `<span class="option-icon">➔</span> ${opt.text}`;
        btn.onclick = () => {
            const res = opt.action(gameState);
            alert(res.msg);
            document.getElementById('event-msg').style.display = 'none';
            updateUI(gameState);
        };
        container.appendChild(btn);
    });
    document.getElementById('event-msg').style.display = 'flex';
}

// --- 명예의 전당 UI 렌더링 ---
function showHallOfFame() {
    const hof = getHOF();
    // 기록 업데이트 (게임 진행 중일 때만 임시 업데이트)
    if (gameState) {
        hof.bestAsset = Math.max(hof.bestAsset, gameState.total_asset);
        hof.maxStage = Math.max(hof.maxStage, gameState.current_stage_idx + 1);
    }

    // 다른 모든 오버레이 숨기기
    document.querySelectorAll('.liquidation-overlay').forEach(el => el.style.display = 'none');
    document.getElementById('hall-of-fame-msg').style.display = 'flex';

    // 버튼 상태 제어: 게임이 끝난 상태(청산, 기간만료 등)면 '다시 시작'만, 진행 중이면 '이어하기'만 표시
    const isGameOver = !gameState || gameState.game_over === true;
    
    const closeBtn = document.getElementById('hof-close-btn');
    const resetBtn = document.getElementById('hof-reset-btn');

    if (closeBtn && resetBtn) {
        closeBtn.style.display = isGameOver ? 'none' : 'block';
        resetBtn.style.display = isGameOver ? 'block' : 'none';
    }

    // 스탯 렌더링
    document.getElementById('hof-stats').innerHTML = `
        <div class="hof-stat-card"><div class="hof-stat-label">최고 자산</div><div class="hof-stat-value">$${Math.floor(hof.bestAsset).toLocaleString()}</div></div>
        <div class="hof-stat-card"><div class="hof-stat-label">최고 스테이지</div><div class="hof-stat-value">STAGE ${hof.maxStage}</div></div>
        <div class="hof-stat-card"><div class="hof-stat-label">누적 투자일</div><div class="hof-stat-value">${hof.totalDays}일</div></div>
        <div class="hof-stat-card"><div class="hof-stat-label">플레이 횟수</div><div class="hof-stat-value">${hof.playCount}회</div></div>
    `;

    // 업적 렌더링
    const unlockedCount = hof.unlockedAchievements.length;
    const totalCount = ACHIEVEMENTS.length;
    
    // 섹션 제목에 달성도 추가
    const achHeader = document.querySelector('.hof-section h3:nth-of-type(1)'); 
    // 실제로는 innerHTML로 그리드를 그리므로 매번 새로 그리는 방식 유지
    
    document.getElementById('hof-achievements').innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = hof.unlockedAchievements.includes(ach.id);
        if (isUnlocked) {
            return `
                <div class="achievement-card unlocked">
                    <div class="achievement-icon" style="font-size:24px; margin-bottom:5px;">${ach.icon}</div>
                    <div class="achievement-name" style="font-size:12px; font-weight:800; margin-bottom:2px;">${ach.name}</div>
                    <div class="achievement-desc" style="font-size:10px; opacity:0.7; line-height:1.2;">${ach.desc}</div>
                </div>
            `;
        } else {
            return `
                <div class="achievement-card locked">
                    <div class="achievement-icon" style="font-size:24px; margin-bottom:5px;">🔒</div>
                    <div class="achievement-name" style="font-size:12px; font-weight:800; margin-bottom:2px;">???</div>
                    <div class="achievement-desc" style="font-size:10px; opacity:0.5; line-height:1.2;">달성 시 공개됩니다</div>
                </div>
            `;
        }
    }).join('');

    // 업적 섹션 제목 업데이트 (DOM 직접 조작이 어려울 수 있으니 상단에 추가 정보 렌더링)
    const statsContainer = document.getElementById('hof-stats');
    statsContainer.innerHTML += `
        <div class="hof-stat-card" style="grid-column: span 2; border-color: var(--neon-yellow);">
            <div class="hof-stat-label">업적 수집도</div>
            <div class="hof-stat-value" style="color: var(--neon-yellow);">${unlockedCount} / ${totalCount} (${Math.floor(unlockedCount/totalCount*100)}%)</div>
        </div>
    `;
}

function closeHallOfFame() {
    document.getElementById('hall-of-fame-msg').style.display = 'none';
}

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
        time_stopper_days: 0, active_news: null, news_remaining: 0, news_count: 0
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
        if (gameState.day >= 1000) checkAchievement('survival');

        // 1. 스테이지 제한 시간 체크
        let stage = STAGES[gameState.current_stage_idx];
        if (gameState.day > stage.days) {
            gameState.game_over = true;
            finalizeHOFStats(); // 누적 통계 저장
            clearSave();
            document.getElementById('fail-reason').innerText = `제한 시간(${stage.days}일)이 초과되었습니다. 목표 금액($${stage.target.toLocaleString()}) 달성 실패!`;
            document.getElementById('gameover-msg').style.display = 'flex';
            break;
        }

        // 2. 이자 계산
        let interestRate = 0.001 * (1 - (gameState.skills.risk * 0.1));
        let totalDebt = gameState.debt + gameState.inv_debt;
        if (totalDebt > 0) gameState.money -= (totalDebt * interestRate);

        // 3. 주가 변동 계산 (현재 활성화된 뉴스 효과 적용)
        let change = 0;
        if (gameState.time_stopper_days > 0) { 
            gameState.time_stopper_days--; 
        } else {
            change = Math.floor(Math.random() * 41) - 20;
            if (gameState.active_news) {
                let n = gameState.active_news;
                if (n.effect === 'bull') change = Math.floor(Math.random() * (25 * n.intensity));
                else if (n.effect === 'bear') {
                    let dropLimit = (gameState.price < 200) ? 0.5 : 1.0;
                    change = -Math.floor(Math.random() * (20 * n.intensity * dropLimit));
                }
            }
            if (gameState.price < 150) {
                let thrust = (150 - gameState.price) / 2;
                change += Math.floor(Math.random() * 20) + thrust; 
            }
        }

        // 4. 주가 및 히스토리 업데이트
        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + 5, l = Math.max(10, Math.min(o, c) - 5);
        gameState.price = c;
        gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) });

        // 5. 자산 및 청산 체크
        let longV = (gameState.shares * c) - gameState.debt;
        let invV = gameState.inv_shares > 0 ? (gameState.inv_shares * (2 * gameState.inv_avg_price - c)) - gameState.inv_debt : 0;
        gameState.total_asset = gameState.money + longV + invV;

        let marginLimit = 0.1 * (1 - (gameState.skills.risk * 0.1));
        if (totalDebt > 0 && gameState.total_asset < totalDebt * marginLimit) {
            gameState.game_over = true; clearSave();
            gameState.shares = 0; gameState.inv_shares = 0; gameState.debt = 0; gameState.inv_debt = 0;
            document.getElementById('liquidation-msg').style.display = 'flex'; break;
        }
        if (gameState.total_asset <= 0) { gameState.game_over = true; clearSave(); document.getElementById('gameover-msg').style.display = 'flex'; break; }

        // 6. 뉴스 기간 차감 (반영이 끝난 후 차감)
        if (gameState.active_news) {
            gameState.news_remaining--;
            if (gameState.news_remaining <= 0) gameState.active_news = null;
        }

        // 7. [핵심] 새로운 뉴스 또는 이벤트 발생 체크 (내일을 위한 예고)
        // 돌발 이벤트 (2%)
        if (Math.random() < 0.02) {
            triggerRandomEvent();
            updateAndDraw(); return; // 이벤트 발생 시 즉시 중단하여 대응 기회 제공
        }

        // 뉴스 발생 (통찰력 비례)
        if (!gameState.active_news && Math.random() < (0.05 + gameState.skills.insight * 0.02)) {
            let n = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
            gameState.active_news = n; 
            gameState.news_remaining = n.duration;
            gameState.news_count++;
            if (gameState.news_count >= 10) checkAchievement('news_victim');
            gameState.news_history.push({ day: gameState.day, title: n.title });
            document.getElementById('news-title').innerText = n.title;
            document.getElementById('news-msg').style.display = 'flex';
            updateAndDraw(); return; // 뉴스 발생 시 즉시 중단하여 대응 기회 제공
        }

        checkStageClear();
    }
    updateAndDraw();
    checkStageClear();
    saveGame();
}

function checkStageClear() {
    let stage = STAGES[gameState.current_stage_idx];
    if (gameState.total_asset >= 1000000000) checkAchievement('billionaire');
    
    if (gameState.money >= stage.target) {
        gameState.current_stage_idx++; gameState.skill_points++;
        if (gameState.current_stage_idx === 5) checkAchievement('stage_5_clear');
        if (gameState.current_stage_idx >= STAGES.length) {
            checkAchievement('trader_god');
            gameState.game_over = true;
            clearSave(); // 올 클리어했으므로 저장 데이터 삭제
            document.getElementById('clear-final-asset').innerText = `최종 자산: $${Math.floor(gameState.total_asset).toLocaleString()}`;
            document.getElementById('gameclear-msg').style.display = 'flex';
            return;
        }
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
        // --- 개선된 안전 전액 매수 로직 (중복 매수 방지 및 자산 기반 계산) ---
        // 1. 목표 안전 사용률 결정 (배율이 높을수록 더 많은 현금을 남김)
        let safeUsageRate = 1.0 - (lev * 0.02); // 10배:0.8, 20배:0.6, 30배:0.4
        safeUsageRate = Math.max(0.3, Math.min(0.98, safeUsageRate));
        
        // 2. 현재 선택된 모드(롱/숏)의 포지션 가치 확인
        let currentPosVal = (currentTradeMode === 'long') ? (gameState.shares * p) : (gameState.inv_shares * p);
        
        // 3. 목표로 하는 '안전한' 총 포지션 가치 계산 (내 총자산 기준)
        let targetTotalPosVal = gameState.total_asset * lev * safeUsageRate;
        
        // 4. 추가로 더 살 수 있는 가치 계산
        let additionalValNeeded = targetTotalPosVal - currentPosVal;
        
        if (additionalValNeeded <= 0) {
            // 이미 안전 한도만큼 샀거나, 그 이상 보유 중인 경우
            showFloatingText("⚠️ 이미 안전 한도까지 매수되었습니다.", false);
            return;
        }
        
        // 5. 필요한 수량 계산 및 보유 현금 한도 내에서 최종 결정
        let costPerShare = (p / lev) + (p * feeRate);
        amt = Math.floor(additionalValNeeded / p);
        
        // 실제 현금으로 살 수 있는 최대치와 비교 (이중 안전장치)
        let maxByCash = Math.floor(gameState.money / costPerShare);
        amt = Math.min(amt, maxByCash);
        
        if (amt <= 0) {
            showFloatingText("⚠️ 추가 매수 가능한 현금이 부족합니다.", false);
            return;
        }
    }
    else { 
        amt = (currentTradeMode === 'long') ? gameState.shares : gameState.inv_shares; 
    }
    
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
            if (selectedLev >= 30) checkAchievement('leverage_master');
        }
    } else if (act === 'sell' && gameState.shares > 0) {
        let sAmt = Math.min(amt, gameState.shares), val = p * sAmt, fee = val * feeRate;
        let profit = (p - gameState.avg_price) * sAmt - fee;
        if (profit > 0) checkAchievement('first_profit');
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
    checkStageClear();
    saveGame();
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
        if (gameState.skills[type] === 5) checkAchievement('skill_max');
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

    // --- 0. 현재 차트에 있는 사용자 선들 백업 (사라짐 방지) ---
    const chartEl = document.getElementById('chart');
    if (chartEl && chartEl.layout && chartEl.layout.shapes) {
        const currentOnChart = chartEl.layout.shapes.filter(s => 
            !s.line || (s.line.dash !== 'dot' && s.line.dash !== 'dash')
        );
        if (currentOnChart.length > 0) {
            userShapes = currentOnChart;
        }
    }

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
        x: displayHist.map(h => h.day),
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
            traces.push({ x: displayHist.map(h => h.day), y: data, type: 'scatter', mode: 'lines', line: { width: 1, color: idx === 0 ? '#ffeb3b' : '#e91e63' }, yaxis: 'y' });
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
        traces.push({ x: displayHist.map(h => h.day), y: upper, type: 'scatter', mode: 'lines', line: { width: 1, color: bbColor, dash: 'dot' }, yaxis: 'y', name: 'BB Upper' });
        traces.push({ x: displayHist.map(h => h.day), y: lower, type: 'scatter', mode: 'lines', line: { width: 1, color: bbColor, dash: 'dot' }, yaxis: 'y', name: 'BB Lower' });
    }

    // 4. Vol
    if (showInd.vol) {
        traces.push({
            x: displayHist.map(h => h.day), y: displayHist.map(h => h.vol),
            type: 'bar', marker: { color: displayHist.map(h => h.close >= h.open ? 'rgba(255,49,49,0.2)' : 'rgba(33,150,243,0.2)') },
            yaxis: 'y2'
        });
    }

    // 보조지표 계산 및 렌더링
    const renderOscillator = (id, data, color, name) => {
        traces.push({ x: displayHist.map(h => h.day), y: data, type: 'scatter', mode: 'lines', line: { color: color, width: 1.2 }, yaxis: 'y3', name: name });
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
            if (data.length === 0) return [];
            let res = [data[0]]; const k = 2 / (p + 1);
            for(let i=1; i<data.length; i++) res.push(data[i]*k + res[i-1]*(1-k));
            return res;
        };
        const closes = hist.map(h => h.close);
        const e12 = ema(closes, 12), e26 = ema(closes, 26);
        const macdLine = e12.map((v, i) => v - e26[i]);
        const signalLine = ema(macdLine, 9);
        const histLine = macdLine.map((v, i) => v - signalLine[i]);

        const xDays = displayHist.map(h => h.day);
        renderOscillator('macd', macdLine.slice(startIndex), '#2196f3', 'MACD');
        traces.push({ x: xDays, y: signalLine.slice(startIndex), type: 'scatter', mode: 'lines', line: { color: '#ff9800', width: 1, dash: 'dot' }, yaxis: 'y3', name: 'Signal' });
        traces.push({ x: xDays, y: histLine.slice(startIndex), type: 'bar', marker: { color: histLine.slice(startIndex).map(v => v >= 0 ? 'rgba(255,49,49,0.3)' : 'rgba(33,150,243,0.3)') }, yaxis: 'y3', name: 'Hist' });
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
        for (let i = 1; i < hist.length; i++) {
            const h = hist[i], p = hist[i-1];
            const tr = Math.max(h.high - h.low, Math.abs(h.high - p.close), Math.abs(h.low - p.close));
            const plusDM = (h.high - p.high > p.low - h.low) ? Math.max(h.high - p.high, 0) : 0;
            const minusDM = (p.low - h.low > h.high - p.high) ? Math.max(p.low - h.low, 0) : 0;
            trs.push(tr); plusDMs.push(plusDM); minusDMs.push(minusDM);
        }
        
        let adxFull = new Array(hist.length).fill(null);
        let sTR = 0, sPDM = 0, sMDM = 0;
        for (let i = 0; i < trs.length; i++) {
            if (i < period) {
                sTR += trs[i]; sPDM += plusDMs[i]; sMDM += minusDMs[i];
            } else {
                sTR = sTR - (sTR / period) + trs[i];
                sPDM = sPDM - (sPDM / period) + plusDMs[i];
                sMDM = sMDM - (sMDM / period) + minusDMs[i];
            }
            if (i >= period - 1) {
                const plusDI = 100 * (sPDM / (sTR || 1));
                const minusDI = 100 * (sMDM / (sTR || 1));
                const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI || 1);
                adxFull[i + 1] = dx; 
            }
        }
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
    const firstDay = displayHist[0].day;
    const lastDay = displayHist[displayHist.length - 1].day;
    
    // 1. 현재가 가이드 선 및 라벨 (우측)
    shapes.push({
        type: 'line', x0: firstDay, x1: lastDay, y0: gameState.price, y1: gameState.price,
        line: { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', width: 1, dash: 'dot' }
    });
    annotations.push({
        x: lastDay, y: gameState.price, text: `$${Math.floor(gameState.price).toLocaleString()}`,
        showarrow: false, xanchor: 'left', yanchor: 'middle',
        font: { size: 10, color: '#fff', weight: 'bold' },
        bgcolor: isDark ? '#444' : '#888',
        bordercolor: '#fff', borderwidth: 1, xshift: 5
    });

    // 2. 롱 평단가 선 및 라벨 (좌측)
    if (gameState.shares > 0) {
        shapes.push({
            type: 'line', x0: firstDay, x1: lastDay, y0: gameState.avg_price, y1: gameState.avg_price,
            line: { color: '#ff9800', width: 1.5, dash: 'dash' }
        });
        annotations.push({
            x: firstDay, y: gameState.avg_price, text: `롱평단: $${Math.floor(gameState.avg_price).toLocaleString()}`,
            showarrow: false, xanchor: 'left', yanchor: 'bottom',
            font: { size: 10, color: '#fff' },
            bgcolor: 'rgba(255, 152, 0, 0.8)', xshift: 5
        });
    }

    // 3. 인버스 평단가 선 및 라벨 (좌측)
    if (gameState.inv_shares > 0) {
        shapes.push({
            type: 'line', x0: firstDay, x1: lastDay, y0: gameState.inv_avg_price, y1: gameState.inv_avg_price,
            line: { color: '#9c27b0', width: 1.5, dash: 'dash' }
        });
        annotations.push({
            x: firstDay, y: gameState.inv_avg_price, text: `숏평단: $${Math.floor(gameState.inv_avg_price).toLocaleString()}`,
            showarrow: false, xanchor: 'left', yanchor: 'top',
            font: { size: 10, color: '#fff' },
            bgcolor: 'rgba(156, 39, 176, 0.8)', xshift: 5
        });
    }

    // 4. 사용자 정의 선 추가
    userShapes.forEach(s => shapes.push(s));

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: isDark ? '#e0f2f1' : '#2c3e50', size: 10, family: 'Inter, sans-serif' },
        showlegend: false, dragmode: currentDragMode, 
        margin: { t: 10, b: 40, l: 10, r: 50 },
        xaxis: { 
            tickvals: tickIndices.map(i => displayHist[i].day), 
            ticktext: tickIndices.map(i => displayHist[i].label), 
            gridcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
            linecolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            range: currentRange, 
            fixedrange: false,
            tickfont: { size: isMobile ? 9 : 10, color: isDark ? 'rgba(224,242,241,0.6)' : '#2c3e50' },
            rangeslider: { visible: false } // 공간 확보를 위해 슬라이더 숨김 (필요시 true)
        },
        yaxis: { 
            side: 'right', 
            gridcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
            linecolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            domain: anyInd ? [0.4, 1] : [0.05, 1],
            tickfont: { color: isDark ? '#00ffa3' : '#2e7d32', weight: 'bold' },
            tickformat: '$,.0f'
        },
        yaxis2: { 
            overlaying: 'y', 
            showgrid: false, 
            showticklabels: false, 
            domain: anyInd ? [0.4, 0.55] : [0.05, 0.2], 
            opacity: 0.1 
        },
        yaxis3: { 
            side: 'right', 
            gridcolor: 'rgba(128,128,128,0.05)', 
            domain: [0, 0.3], 
            visible: anyInd,
            tickfont: { 
                color: isDark ? '#ffcc00' : '#f57c00',
                size: 10,
                fontweight: 'bold'
            },
            zerolinecolor: 'rgba(255,255,255,0.1)'
        },
        shapes: shapes,
        annotations: annotations
    };

    const config = { displaylogo: false, responsive: true, scrollZoom: true, modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoom2d'] };
    Plotly.react('chart', traces, layout, config);
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
    
    // 텍스트 정보 업데이트
    const textUpdates = {
        'current-stage-num-side': stage.stage, 
        'current-stage-num-mobile': stage.stage,
        'target-money-side': `$${stage.target.toLocaleString()}`, 
        'target-money-mobile': stage.target.toLocaleString(),
        'remaining-days-mobile': Math.max(0, stage.days - s.day), 
        'news-list': newsHTML, 
        'news-list-mobile': newsHTML,
        'stat-insight-lv': s.skills.insight, 
        'stat-risk-lv': s.skills.risk, 
        'stat-credit-lv': s.skills.credit,
        'skill-insight-lv': s.skills.insight, 
        'skill-risk-lv': s.skills.risk, 
        'skill-credit-lv': s.skills.credit,
        'skill-points-val': s.skill_points
    };
    
    for (let id in textUpdates) {
        let el = document.getElementById(id);
        if (el) {
            if (id.includes('news-list')) el.innerHTML = textUpdates[id];
            else el.innerText = textUpdates[id];
        }
    }

    // --- 진행도 게이지(Progress Bar) 업데이트 ---
    // 현금 보유량 기준으로 목표 달성률 계산
    const progressPercent = Math.min(100, (s.money / stage.target) * 100);
    
    // 1. 모바일 상단 게이지
    const mobileBar = document.getElementById('stage-progress-bar-mobile');
    if (mobileBar) {
        mobileBar.style.setProperty('width', progressPercent + '%', 'important');
    }
    
    // 2. 사이드바 게이지
    const sideBar = document.getElementById('stage-progress-bar-side');
    if (sideBar) {
        sideBar.style.setProperty('width', progressPercent + '%', 'important');
    }

    // 3. 능력치 바 게이지
    const skillBars = {
        'stat-insight-bar': s.skills.insight * 20,
        'stat-risk-bar': s.skills.risk * 20,
        'stat-credit-bar': s.skills.credit * 20
    };
    for (let id in skillBars) {
        let el = document.getElementById(id);
        if (el) el.style.width = skillBars[id] + '%';
    }

    // 아이템 수량 업데이트
    for (let item in s.items) { 
        const btn = document.getElementById(`item-${item}`); 
        if (btn) { 
            btn.innerText = `${ITEM_INFO[item].name.split(' ')[0]} ${s.items[item]}`; 
            btn.disabled = (s.items[item] <= 0); 
            btn.style.opacity = (s.items[item] > 0) ? "1" : "0.3"; 
        } 
    }

    // 계급 업데이트
    const rank = s.total_asset >= 1000000000000 ? "💎 투자의 신" : s.total_asset >= 100000000 ? "🏆 전설" : s.total_asset >= 1000000 ? "🎩 슈퍼개미" : "흙수저";
    const rankMobile = document.getElementById('player-rank-mobile');
    if(rankMobile) rankMobile.innerText = rank;
    const rankSide = document.getElementById('player-rank-side');
    if(rankSide) rankSide.innerText = rank;
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
    checkStageClear();
    saveGame();
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
function resetGame() { 
    if (confirm("정말 처음부터 다시 시작하시겠습니까?\n모든 현재 진행 상황이 삭제됩니다.")) {
        clearSave(); 
        location.reload(); 
    }
}

window.onload = () => { 
    const savedData = loadGame();
    if (savedData) {
        // ... (중략) ...
        document.getElementById('continue-msg').style.display = 'flex';
    } else {
        startNewGame();
    }

    // 초기 모드를 '이동'으로 설정
    setDragMode('pan');

    // 차트 이벤트 리스너 등록
    const chartEl = document.getElementById('chart');
    if (chartEl) {
        chartEl.on('plotly_relayout', e => { 
            if (e['xaxis.range[0]'] !== undefined) {
                currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; 
            }
            if (chartEl.layout && chartEl.layout.shapes) {
                userShapes = chartEl.layout.shapes.filter(s => 
                    s.line && s.line.dash !== 'dot' && s.line.dash !== 'dash'
                );
            }
        });
    }
};

function confirmContinue(isContinue) {
    document.getElementById('continue-msg').style.display = 'none';
    if (isContinue) {
        gameState = loadGame();
        updateUI(gameState);
        updateAndDraw();
    } else {
        startNewGame();
    }
}

function startNewGame() {
    clearSave();
    gameState = generateInitialState(); 
    
    // 플레이 횟수 증가 및 영구 저장
    let hof = getHOF();
    hof.playCount++;
    saveHOF(hof);
    
    updateUI(gameState); 
    showStageIntro(); 
}
