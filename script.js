// --- 상태 변수 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, vol: false, macd: false, rsi: false, stoch: false, cci: false, adx: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1, firstBuyAll = true, userShapes = [];

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
    if (themeBtn) { themeBtn.innerText = (currentTheme === 'dark') ? "☀️테마" : "🌙테마"; }
    
    // 테마 변경 시 그리기 모드 색상도 즉시 업데이트
    if (currentDragMode === 'drawline') {
        setDragMode('drawline');
    }
    updateAndDraw();
    checkStageClear();
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
    if (m === 'drawline') {
        // 다크모드: 형광늘색, 라이트모드: 진한 파란색
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
    { stage: 1, days: 30, target: 120000, name: "🌱 튜토리얼" },
    { stage: 2, days: 60, target: 300000, name: "🚗 첫 번째 성공의 맛" },
    { stage: 3, days: 90, target: 700000, name: "🏠 내 집 마련의 꿈" },
    { stage: 4, days: 120, target: 1500000, name: "💼 백만장자의 시작" },
    { stage: 5, days: 160, target: 4000000, name: "🏢 꼬마 빌딩 건물주" },
    { stage: 6, days: 200, target: 10000000, name: "🏗️ 자산가로의 변신" },
    { stage: 7, days: 250, target: 30000000, name: "📈 전업 투자자의 완성" },
    { stage: 8, days: 320, target: 100000000, name: "🏆 억대 자산가 클럽" },
    { stage: 9, days: 400, target: 300000000, name: "🏦 프라이빗 뱅커의 큰손" },
    { stage: 10, days: 500, target: 1000000000, name: "💎 유니콘 기업 사냥꾼" },
    { stage: 11, days: 650, target: 5000000000, name: "🌍 글로벌 시장 지배자" },
    { stage: 12, days: 800, target: 20000000000, name: "👑 경제계의 황태자" },
    { stage: 13, days: 1000, target: 100000000000, name: "🏛️ 국가 경제의 심장" },
    { stage: 14, days: 1300, target: 500000000000, name: "🌌 세계 금융의 거물" },
    { stage: 15, days: 1700, target: 1500000000000, name: "💵 조 단위의 제왕" },
    { stage: 16, days: 2200, target: 10000000000000, name: "🌍 지구의 실질적 주인" },
    { stage: 17, days: 2800, target: 50000000000000, name: "🛰️ 우주 산업의 정점" },
    { stage: 18, days: 3500, target: 200000000000000, name: "🪐 행성 연합 대부호" },
    { stage: 19, days: 4500, target: 1000000000000000, name: "☄️ 우주 화폐의 지배자" },
    { stage: 20, days: 6000, target: 10000000000000000, name: "🕉️ 불멸의 투자의 신" }
];

// --- 100가지 랜덤 뉴스 풀 (다양성 및 몰입감 강화) ---
const NEWS_POOL = [
    // --- 호재 (Bull) ---
    { title: "📢 중앙은행, 전격 금리 인하 단행!", effect: "bull", intensity: 3.5, duration: 5 },
    { title: "🚀 AI 반도체 신기술, 세계 최초 상용화 성공", effect: "bull", intensity: 4.2, duration: 7 },
    { title: "🍀 K-바이오, 췌장암 완치 치료제 임상 3상 통과", effect: "bull", intensity: 5.0, duration: 10 },
    { title: "💰 정부, 100조 규모 경기 부양책 발표", effect: "bull", intensity: 2.8, duration: 6 },
    { title: "📱 차세대 폴더블폰 예약 판매 역대 최고치 경신", effect: "bull", intensity: 2.5, duration: 4 },
    { title: "🤝 글로벌 빅테크 기업 간 '세기의 합병' 성사", effect: "bull", intensity: 3.8, duration: 8 },
    { title: "⚡ 초전도체 상온 가동 데이터 공식 확인", effect: "bull", intensity: 6.0, duration: 12 },
    { title: "🔋 전고체 배터리 주행거리 2,000km 돌파", effect: "bull", intensity: 3.2, duration: 5 },
    { title: "🛰️ 스페이스X 대항마, 국내 위성 발사 성공", effect: "bull", intensity: 2.7, duration: 4 },
    { title: "🎬 K-드라마, 전 세계 시청률 1위 석권", effect: "bull", intensity: 2.2, duration: 3 },
    { title: "🚢 조선 업계, 10년치 일감 한 번에 수주", effect: "bull", intensity: 3.0, duration: 7 },
    { title: "☀️ 태양광 발전 효율 40% 돌파 기적", effect: "bull", intensity: 2.4, duration: 5 },
    { title: "🏥 난치병 유전자 가위 치료법 정부 승인", effect: "bull", intensity: 4.0, duration: 9 },
    { title: "🏎️ 자율주행 레벨 5, 일반 도로 주행 허가", effect: "bull", intensity: 3.5, duration: 6 },
    { title: "🎮 대작 AAA 게임 출시 하루 만에 1,000만 장 판매", effect: "bull", intensity: 2.3, duration: 3 },
    { title: "🤖 가사 도우미 로봇, 가구 보급률 30% 돌파", effect: "bull", intensity: 2.8, duration: 5 },
    { title: "💎 아프리카서 역대 최대 규모 다이아몬드 광산 발견", effect: "bull", intensity: 2.0, duration: 4 },
    { title: "🍔 비건 고기 단가, 실제 소고기보다 낮아졌다", effect: "bull", intensity: 1.8, duration: 3 },
    { title: "🏙️ 스마트 시티 건설 프로젝트 본궤도 진입", effect: "bull", intensity: 2.6, duration: 6 },
    { title: "📉 물가 상승률 1%대 진입, 저물가 시대 복귀", effect: "bull", intensity: 2.4, duration: 5 },
    { title: "🏛️ 상속세 전면 폐지 법안 국회 본회의 통과", effect: "bull", intensity: 3.3, duration: 7 },
    { title: "📡 6G 통신망 세계 최초 전국 구축 완료", effect: "bull", intensity: 2.9, duration: 5 },
    { title: "🐚 해수 담수화 기술 혁신, 물 부족 완전 해결", effect: "bull", intensity: 2.5, duration: 8 },
    { title: "♻️ 플라스틱 분해 박테리아 대량 생산 성공", effect: "bull", intensity: 2.1, duration: 4 },
    { title: "🧠 뇌-컴퓨터 인터페이스(BCI)로 마비 환자 보행 성공", effect: "bull", intensity: 4.5, duration: 10 },
    { title: "🧪 꿈의 에너지 '핵융합' 연속 가동 1시간 돌파", effect: "bull", intensity: 5.5, duration: 15 },
    { title: "📦 글로벌 물류 로봇 표준화로 비용 70% 절감", effect: "bull", intensity: 2.9, duration: 6 },
    { title: "💊 노화 방지 신약, 미 FDA 판매 허가 획득", effect: "bull", intensity: 4.8, duration: 12 },
    { title: "🛸 수직이착륙 비행 택시, 도심 운행 서비스 시작", effect: "bull", intensity: 3.4, duration: 8 },
    { title: "🧱 사막 모래를 건축 자재로 바꾸는 혁신 기술 개발", effect: "bull", intensity: 2.2, duration: 5 },

    // --- 악재 (Bear) ---
    { title: "🚨 소비자 물가 지수 폭등, 인플레이션 공포 재점화", effect: "bear", intensity: 3.0, duration: 5 },
    { title: "🌊 글로벌 1위 투자은행, 유동성 위기로 파산 신청", effect: "bear", intensity: 5.5, duration: 15 },
    { title: "💣 중동 전쟁 확전 위기, 유가 배럴당 $150 돌파", effect: "bear", intensity: 4.8, duration: 12 },
    { title: "☣️ 변종 바이러스 출현, 국가 비상사태 선포", effect: "bear", intensity: 4.2, duration: 10 },
    { title: "⚠️ 대형 IT 기업, 역대 최악의 개인정보 유출 사고", effect: "bear", intensity: 2.8, duration: 4 },
    { title: "📉 대기업 3분기 어닝 쇼크, 실적 반토막", effect: "bear", intensity: 3.5, duration: 6 },
    { title: "🌪️ 기록적인 초강력 태풍, 산업 단지 초토화", effect: "bear", intensity: 3.2, duration: 5 },
    { title: "🔥 데이터 센터 화재로 국가 통신망 일시 마비", effect: "bear", intensity: 2.5, duration: 3 },
    { title: "💀 국민 연금 고갈 시점 10년 앞당겨졌다", effect: "bear", intensity: 3.8, duration: 8 },
    { title: "⚖️ 미 법원, 빅테크 기업에 강제 기업 분할 명령", effect: "bear", intensity: 4.0, duration: 10 },
    { title: "🚫 반도체 핵심 소재 수출 규제 발효", effect: "bear", intensity: 3.4, duration: 7 },
    { title: "🏦 가계 부채 역대 최고, 금리 인상 압박", effect: "bear", intensity: 2.9, duration: 6 },
    { title: "🏭 환경 규제 강화로 제조업 공장 가동 중단 위기", effect: "bear", intensity: 2.4, duration: 5 },
    { title: "📉 부동산 거품 붕괴 시작, 건설사 연쇄 부도", effect: "bear", intensity: 4.5, duration: 12 },
    { title: "😰 청년 실업률 최고치, 내수 소비 급감", effect: "bear", intensity: 2.2, duration: 4 },
    { title: "🧊 북극 빙하 붕괴로 해수면 상승 속도 5배 빨라져", effect: "bear", intensity: 2.0, duration: 8 },
    { title: "🪧 전국 민주노총 총파업, 물류 대란 현실화", effect: "bear", intensity: 2.7, duration: 5 },
    { title: "💊 기대했던 치매 치료제, 임상 부작용으로 전면 중단", effect: "bear", intensity: 4.2, duration: 9 },
    { title: "🌑 기록적인 대정전 사태 발생, 국가 가동률 0%", effect: "bear", intensity: 3.0, duration: 3 },
    { title: "💸 원-달러 환율 1,600원 돌파, 원화 가치 추락", effect: "bear", intensity: 3.6, duration: 7 },
    { title: "🦜 조류 독감 인간 감염 사례 확인, 육류 시장 비상", effect: "bear", intensity: 2.3, duration: 5 },
    { title: "🦟 열대 질병의 습격, 동남아 공장 생산 중단", effect: "bear", intensity: 2.1, duration: 4 },
    { title: "🎭 유명 CEO의 회계 부정 및 횡령 혐의 구속", effect: "bear", intensity: 3.9, duration: 6 },
    { title: "📉 외국인 자금 역대 최대 규모 '셀 코리아' 단행", effect: "bear", intensity: 3.7, duration: 5 },
    { title: "🌋 일본 거대 화산 폭발 징후, 아시아 공급망 비상", effect: "bear", intensity: 4.0, duration: 10 },
    { title: "🕳️ 거대 블랙홀급 사기 수법 발견, 금융 시스템 신뢰 붕괴", effect: "bear", intensity: 5.2, duration: 14 },
    { title: "🌽 전 지구적 흉작으로 식량 가격 300% 폭등", effect: "bear", intensity: 3.8, duration: 10 },
    { title: "🛰️ 국가 기밀 위성 해킹 당해... 안보 및 기술 유출 우려", effect: "bear", intensity: 4.5, duration: 7 },
    { title: "📉 인공지능 알고리즘 오류로 순식간에 증시 $1조 증발", effect: "bear", intensity: 6.0, duration: 2 },
    { title: "🌊 해안가 대도시 침수 피해 심화, 보험 업계 줄파산", effect: "bear", intensity: 4.1, duration: 12 },

    // --- 변동성 (Volatile - 급등락 반복) ---
    { title: "🎢 암호화폐 법안 발표 앞두고 시장 '혼돈'", effect: "volatile", intensity: 5.0, duration: 5 },
    { title: "⚔️ 미-중 무역 협상 극적 타결과 파기 반복", effect: "volatile", intensity: 4.5, duration: 7 },
    { title: "🗳️ 대통령 선거 개표 중, 지지율 0.1%p 박빙 승부", effect: "volatile", intensity: 3.8, duration: 4 },
    { title: "🔍 양자 컴퓨터 보안 해킹 가능성 논란 발생", effect: "volatile", intensity: 4.2, duration: 6 },
    { title: "💬 유명 투자자 '지금이 고점' vs '더 간다' 팽팽한 대립", effect: "volatile", intensity: 3.0, duration: 5 },
    { title: "❓ 정체불명의 괴선박, 영해 침범 보고... 진위 파악 중", effect: "volatile", intensity: 3.5, duration: 3 },
    { title: "💎 희토류 매장량 과장 논란, 광산 기업 조사 착수", effect: "volatile", intensity: 3.2, duration: 5 },
    { title: "🌡️ 기상청 '올해 가장 더운 여름' vs '기록적 폭우' 오보 소동", effect: "volatile", intensity: 2.5, duration: 4 },
    { title: "💊 기적의 비만 치료제, 부작용 루머에 주가 널뛰기", effect: "volatile", intensity: 4.7, duration: 6 },
    { title: "🏛️ 금리 동결 발표 직후 의장의 '매파적' 발언 파장", effect: "volatile", intensity: 3.4, duration: 3 },
    { title: "🌑 달 기지 건설 계획, 예산 삭감 소식에 관련주 요동", effect: "volatile", intensity: 2.8, duration: 5 },
    { title: "📱 신형 스마트폰 발열 이슈 vs 소프트웨어 해결 가능성", effect: "volatile", intensity: 2.2, duration: 4 },
    { title: "🎤 월드스타 은퇴 선언... 소속사 부인 공방전", effect: "volatile", intensity: 3.1, duration: 3 },
    { title: "🏭 로봇 자동화 공장, 노사 갈등으로 생산 조절", effect: "volatile", intensity: 2.6, duration: 5 },
    { title: "🛸 미 국방부 'UFO 실체 인정' 공식 브리핑 준비 중", effect: "volatile", intensity: 5.5, duration: 8 },
    { title: "📉 공매도 세력 vs 개인 투자자, 특정 종목 '전쟁'", effect: "volatile", intensity: 6.0, duration: 10 },
    { title: "🧪 상온 핵융합 재현 실험 중... 내일 결과 발표", effect: "volatile", intensity: 5.8, duration: 2 },
    { title: "📦 배송 드론 추락 사고 발생, 법적 규제 논의 시작", effect: "volatile", intensity: 2.4, duration: 4 },
    { title: "💬 세계 경제 포럼, 'AI 규제'를 둘러싼 국가별 갈등", effect: "volatile", intensity: 2.7, duration: 6 },
    { title: "🌊 해저 터널 굴착 중 대량 침수 사고... 공사 지속 여부 불투명", effect: "volatile", intensity: 3.3, duration: 5 },
    { title: "💰 대형 고래 지갑 이동 포착, 시장 투매 공포 확산", effect: "volatile", intensity: 4.4, duration: 3 },
    { title: "🚧 메타버스 플랫폼 서비스 종료설... 이용자들 반발", effect: "volatile", intensity: 2.9, duration: 4 },
    { title: "🌲 아마존 산불 진화 소식과 재발화 우려 교차", effect: "volatile", intensity: 2.1, duration: 5 },
    { title: "🏦 시중 은행 수수료 인상안 발표... 정부 압박에 재검토", effect: "volatile", intensity: 1.8, duration: 3 },
    { title: "🛒 유통 공룡의 오프라인 매장 매각설... 주주들 반응 엇갈려", effect: "volatile", intensity: 2.5, duration: 5 },

    // --- 안정/횡보 (Calm - 평온한 시장) ---
    { title: "💬 시장 관망세 지속, 뚜렷한 모멘텀 부재", effect: "calm", intensity: 0.2, duration: 10 },
    { title: "☕ 중앙은행 위원들 '신중한 접근' 한목소리", effect: "calm", intensity: 0.3, duration: 15 },
    { title: "📅 분기 실적 발표 앞두고 숨 고르기 장세", effect: "calm", intensity: 0.4, duration: 7 },
    { title: "🧘 계절적 비수기 진입, 거래량 최저 수준", effect: "calm", intensity: 0.1, duration: 12 },
    { title: "💤 대형 악재 해소 이후 평온을 되찾은 시장", effect: "calm", intensity: 0.5, duration: 8 },
    { title: "📊 전문가들 '당분간 큰 변동 없을 것' 전망", effect: "calm", intensity: 0.2, duration: 20 },
    { title: "📉 인플레이션 안정화 단계 진입, 지표 정체", effect: "calm", intensity: 0.3, duration: 14 },
    { title: "🕊️ 평화 협정 논의 시작, 지정학적 위험 감소", effect: "calm", intensity: 0.4, duration: 10 },
    { title: "🏭 공장 가동률 정상 범위 유지, 특이사항 없음", effect: "calm", intensity: 0.2, duration: 18 },
    { title: "📦 재고 수준 적정치 유지, 수급 안정세", effect: "calm", intensity: 0.3, duration: 12 },
    { title: "💬 시장은 차분히 금리 결정 기다리는 중", effect: "calm", intensity: 0.1, duration: 5 },
    { title: "📉 환율 변동 폭 축소, 안정적 흐름 지속", effect: "calm", intensity: 0.2, duration: 15 },
    { title: "🏦 은행권 예금 금리 소폭 하향 조정", effect: "calm", intensity: 0.3, duration: 10 },
    { title: "🚧 인프라 공사 진행 순조, 돌발 변수 제로", effect: "calm", intensity: 0.2, duration: 20 },
    { title: "🌐 글로벌 협약 갱신, 시장 질서 유지 확인", effect: "calm", intensity: 0.1, duration: 30 }
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
    checkStageClear();
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
    checkStageClear();
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
            range: [-300, 300],
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

    // 차트 이벤트 리스너 등록 (한 번만)
    const chartEl = document.getElementById('chart');
    if (chartEl) {
        chartEl.on('plotly_relayout', e => { 
            // X축 범위 저장
            if (e['xaxis.range[0]'] !== undefined) {
                currentRange = [e['xaxis.range[0]'], e['xaxis.range[1]']]; 
            }
            
            // 사용자가 선을 그리거나 수정했을 때 실시간 동기화
            // Plotly 내부 레이아웃에서 선들을 가져와 가이드 선(dot, dash)을 제외하고 저장
            if (chartEl.layout && chartEl.layout.shapes) {
                userShapes = chartEl.layout.shapes.filter(s => 
                    s.line && s.line.dash !== 'dot' && s.line.dash !== 'dash'
                );
            }
        });
    }
};
