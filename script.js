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
    // --- BULL (호재: 40개) ---
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
    { title: "🛰️ 독자 위성 발사 성공... 우주 항공 산업 골드러시 가시화", effect: "bull", intensity: 2.7, duration: 9 },
    { title: "🌊 해상 풍력 등 신재생 에너지 지원 법안 국회 본회의 통과", effect: "bull", intensity: 1.9, duration: 11 },
    { title: "📦 K-콘텐츠 열풍! 글로벌 OTT 서비스 내 시청률 압도적 1위", effect: "bull", intensity: 2.3, duration: 5 },
    { title: "📱 차세대 폴더블폰 예약 판매 역대 최고치 경신... '품절 대란'", effect: "bull", intensity: 2.1, duration: 4 },
    { title: "🧬 유전자 가위 기술 상용화 임박... 불치병 정복의 길 열리나", effect: "bull", intensity: 3.2, duration: 8 },
    { title: "🖥️ 국산 GPU 칩셋 성능, 세계 1위 업체 90% 수준 도달 확인", effect: "bull", intensity: 3.6, duration: 6 },
    { title: "🚢 초대형 LNG 운반선 20척 싹쓸이 수주... 조선업 슈퍼 사이클", effect: "bull", intensity: 2.4, duration: 10 },
    { title: "🚗 자율주행 레벨 4 승인 완료! 로보택시 서비스 전국 확대", effect: "bull", intensity: 3.3, duration: 7 },
    { title: "💊 난치성 치매 치료제, 식약처 품목 허가 획득", effect: "bull", intensity: 4.2, duration: 5 },
    { title: "🏭 노사 상생 협약 체결로 생산성 대폭 향상... 분규 리스크 해소", effect: "bull", intensity: 1.4, duration: 15 },
    { title: "🛍️ 소비 심리 지수 3년 만에 최고치... 내수 시장 활기", effect: "bull", intensity: 1.7, duration: 9 },
    { title: "💰 국부펀드, 신성장 산업에 50조 원 집중 투자 선언", effect: "bull", intensity: 2.8, duration: 8 },
    { title: "🌾 스마트팜 기술 수출... 식량 안보의 핵심 거점으로 부상", effect: "bull", intensity: 1.6, duration: 13 },
    { title: "🔋 폐배터리 재활용 의무화 법안 통과... 도시 광산 산업 부각", effect: "bull", intensity: 2.5, duration: 10 },
    { title: "🌌 핵융합 에너지 실험 성공! 무한 에너지 시대의 서막", effect: "bull", intensity: 6.0, duration: 5 },
    { title: "🛫 관광 무비자 협정 체결 소식에 여행·항공주 '고공행진'", effect: "bull", intensity: 2.2, duration: 6 },
    { title: "🎨 K-아트 열풍... 글로벌 경매 시장에서 한국 작가 최고가 경신", effect: "bull", intensity: 1.3, duration: 4 },
    { title: "🏗️ 해외 대규모 신도시 건설 프로젝트 수주 성공", effect: "bull", intensity: 3.1, duration: 9 },
    { title: "🧪 꿈의 신소재 '맥신' 대량 생산 공정 개발 완료", effect: "bull", intensity: 4.8, duration: 3 },
    { title: "🎮 대작 게임 글로벌 출시 하루 만에 매출 1,000억 원 돌파", effect: "bull", intensity: 2.6, duration: 5 },
    { title: "🥤 K-푸드 신드롬! 북미 시장 점유율 급격히 상승", effect: "bull", intensity: 1.8, duration: 8 },
    { title: "👗 유명 패션위크에서 K-패션 호평... 명품 브랜드들과 협업", effect: "bull", intensity: 1.5, duration: 7 },
    { title: "🤖 가사 도우미 로봇 보급화 시작... 1가구 1로봇 시대 개막", effect: "bull", intensity: 3.4, duration: 6 },
    { title: "📈 외국인 매수세 20일 연속 유입... 지수 신고가 랠리", effect: "bull", intensity: 2.0, duration: 10 },
    { title: "🔒 사이버 보안 기술 고도화로 해킹 피해 제로 달성 보고", effect: "bull", intensity: 1.9, duration: 8 },
    { title: "🏠 전셋값 안정화 및 주택 거래량 회복... 부동산 경기 연착륙", effect: "bull", intensity: 1.4, duration: 12 },
    { title: "🎁 대규모 정부 지원금 지급 결정... 가계 가용 소득 증대", effect: "bull", intensity: 2.1, duration: 4 },
    { title: "🚇 수도권 광역 급행 철도 조기 개통 발표", effect: "bull", intensity: 1.6, duration: 15 },
    { title: "🌤️ 미세먼지 저감 기술 개발로 공기질 대폭 개선", effect: "bull", intensity: 1.2, duration: 9 },
    { title: "🎖️ 국내 기업, 세계 최고 권위 디자인 어워드 싹쓸이", effect: "bull", intensity: 1.1, duration: 5 },

    // --- BEAR (악재: 40개) ---
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
    { title: "🏢 부동산 PF 부실 위험 확산... 건설사 줄도산 위기", effect: "bear", intensity: 4.2, duration: 14 },
    { title: "🌋 기록적인 자연재해 발생... 주요 공단 생산 중단", effect: "bear", intensity: 2.9, duration: 6 },
    { title: "📉 원자재 가격 폭등으로 인한 제조 원가 부담 가중... 실적 악화", effect: "bear", intensity: 2.4, duration: 11 },
    { title: "🛑 국가 신용등급 하향 조정 검토 소식에 국채 금리 요동", effect: "bear", intensity: 3.1, duration: 8 },
    { title: "💨 투기적 거품 붕괴! 신기술 관련주 무더기 하한가 속출", effect: "bear", intensity: 5.5, duration: 5 },
    { title: "📉 인구 절벽 심화... 노동력 부족으로 잠재 성장률 하락", effect: "bear", intensity: 1.8, duration: 20 },
    { title: "💣 북한의 추가 도발 징후... 지정학적 리스크 최고조", effect: "bear", intensity: 3.8, duration: 4 },
    { title: "⚡ 국가 전력망 과부하로 사상 초유의 블랙아웃 사태 발생", effect: "bear", intensity: 3.4, duration: 3 },
    { title: "🌊 해수면 상승으로 인한 해안 도시 침수 피해 속출", effect: "bear", intensity: 2.6, duration: 15 },
    { title: "📉 주요 수출국 경기 침체 직격탄... 무역 수지 적자 전환", effect: "bear", intensity: 2.3, duration: 12 },
    { title: "🚨 대형 플랫폼 기업에 대한 강력한 반독점 규제 시행", effect: "bear", intensity: 2.9, duration: 9 },
    { title: "💀 가상자산 거래소 대형 해킹 발생... 투심 급격히 냉각", effect: "bear", intensity: 4.1, duration: 5 },
    { title: "🚫 기술 유출 의혹으로 핵심 연구진 무더기 구속", effect: "bear", intensity: 3.2, duration: 7 },
    { title: "📉 가계 부채 임계점 도달... 이자 부담에 소비 절벽 현실화", effect: "bear", intensity: 2.7, duration: 14 },
    { title: "🔥 주요 반도체 공장 유독 가스 누출... 생산 라인 무기한 가동 중단", effect: "bear", intensity: 3.9, duration: 6 },
    { title: "🛑 환경 규제 미달로 수출 선박 무더기 억류", effect: "bear", intensity: 2.1, duration: 8 },
    { title: "📉 사모펀드 운용사의 대규모 환매 중단 사태 발생", effect: "bear", intensity: 4.4, duration: 10 },
    { title: "🚨 글로벌 IT 기업, 국내 하도급 업체 대규모 계약 해지", effect: "bear", intensity: 3.5, duration: 7 },
    { title: "📉 국산 배터리 장착 차량에서 원인 불명의 화재 잇따라 발생", effect: "bear", intensity: 3.8, duration: 5 },
    { title: "💣 미-중 갈등 심화로 인한 공급망 완전 단절 위기", effect: "bear", intensity: 4.6, duration: 9 },
    { title: "🚨 대형 제약사 신약 후보 물질 임상 실패 공식 발표", effect: "bear", intensity: 4.0, duration: 4 },
    { title: "📉 철강 수요 급감 및 중국산 저가 공세에 업황 악화", effect: "bear", intensity: 2.4, duration: 11 },
    { title: "🏢 대형 오피스 빌딩 공실률 급증... 상업용 부동산 위기", effect: "bear", intensity: 2.8, duration: 13 },
    { title: "🚨 유명 플랫폼 기업의 대규모 고객 개인정보 유출 확인", effect: "bear", intensity: 3.1, duration: 6 },
    { title: "📉 교육비 부담 가중 및 사교육 시장 과열로 가계 경제 휘청", effect: "bear", intensity: 1.5, duration: 18 },
    { title: "🛑 정부, 부유세 및 법인세 대폭 인상 검토", effect: "bear", intensity: 2.6, duration: 8 },
    { title: "📉 식량 가격 폭등으로 인한 장바구니 물가 비상", effect: "bear", intensity: 2.2, duration: 10 },
    { title: "🚨 주요 통신망 대규모 장애로 금융 거래 전면 중단", effect: "bear", intensity: 3.3, duration: 2 },
    { title: "📉 스마트폰 시장 포화 및 교체 주기 연장으로 실적 둔화", effect: "bear", intensity: 1.9, duration: 9 },
    { title: "🚨 대규모 횡령 사고 발생 소식에 해당 기업 주가 곤두박질", effect: "bear", intensity: 4.7, duration: 3 },

    // --- VOLATILE (변동성: 10개) ---
    { title: "⚠️ 중동 지역 지정학적 리스크 고조... 불확실성 증폭", effect: "volatile", intensity: 3.5, duration: 5 },
    { title: "⚡ 미-중 무역 분쟁 격화! 보복 관세 난타전에 시장 대혼란", effect: "volatile", intensity: 4.5, duration: 6 },
    { title: "🌪️ 선물 옵션 동시 만기일 도래... 역대급 물량 폭탄 우려", effect: "volatile", intensity: 5.5, duration: 2 },
    { title: "🗳️ 예측 불허의 박빙 대선 결과 발표 임박... '시장은 안갯속'", effect: "volatile", intensity: 3.0, duration: 4 },
    { title: "🪙 가상자산 규제안 발표 예정에 관련 섹터 극심한 변동성", effect: "volatile", intensity: 4.0, duration: 3 },
    { title: "📣 유력 인사의 깜짝 발언 한마디에 시장 방향성 상실", effect: "volatile", intensity: 2.5, duration: 3 },
    { title: "⚡ 양자 컴퓨터 상용화 가시화에 기존 보안 체계 붕괴 우려", effect: "volatile", intensity: 4.8, duration: 4 },
    { title: "🌪️ 전 세계적 이상 기후로 인한 농산물 선물 가격 롤러코스터", effect: "volatile", intensity: 3.2, duration: 7 },
    { title: "📣 금리 동결 결정 직후 향후 방향성에 대한 위원들 의견 갈려", effect: "volatile", intensity: 2.8, duration: 5 },
    { title: "⚡ 대형 헷지펀드의 대규모 공매도 포지션 공개에 공방 치열", effect: "volatile", intensity: 5.0, duration: 3 },

    // --- CALM (횡보/평온: 10개) ---
    { title: "💬 횡보 장세 지속... 특별한 모멘텀 없이 눈치보기 극심", effect: "calm", intensity: 0.3, duration: 5 },
    { title: "☕ 거래량 급감하며 관망세 뚜렷... 폭풍 전야의 정적", effect: "calm", intensity: 0.2, duration: 4 },
    { title: "🍵 대형 이벤트 앞두고 숨고르기 국면... 평온한 흐름", effect: "calm", intensity: 0.4, duration: 6 },
    { title: "☁️ 뚜렷한 주도주 없는 순환매 장세... 박스권 등락 반복", effect: "calm", intensity: 0.5, duration: 7 },
    { title: "💤 시장 참가자들의 연휴 앞둔 조기 퇴근 모드... 한산한 거래", effect: "calm", intensity: 0.1, duration: 3 },
    { title: "🧘 시장 안정화 조치 안정적으로 정착 중... 낮은 변동성", effect: "calm", intensity: 0.3, duration: 10 },
    { title: "🧊 금리 결정 관망세에 숨막히는 박스권 횡보", effect: "calm", intensity: 0.2, duration: 5 },
    { title: "🌳 ESG 경영 정착으로 인한 기업들의 중장기 안정적 경영 기조", effect: "calm", intensity: 0.4, duration: 15 },
    { title: "⛅ 특별한 대내외 뉴스 없는 평이한 경제 지표 발표", effect: "calm", intensity: 0.5, duration: 8 },
    { title: "🥛 우유부단한 투자 심리 지속... 0.1% 내외 등락만 반복", effect: "calm", intensity: 0.1, duration: 6 }
];

// --- 상태 변수 ---
let currentTheme = 'dark', currentTradeMode = 'long', gameState = null, marketEnergy = 1.0;
let currentTF = 'daily', showInd = { ma: true, bb: false, ichimoku: false, vol: false, macd: false, stoch: false, rsi: false, cci: false, adx: false };
let currentRange = null, currentDragMode = 'pan', selectedLev = 1;

// --- 유틸리티: 숫자 롤링 애니메이션 ---
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
    el.style.color = isPositive ? '#2ecc71' : '#e74c3c';
    el.style.left = (window.innerWidth / 2) + 'px'; el.style.top = (window.innerHeight / 3) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
}

// --- 지표 계산 함수 ---
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
            let pool = NEWS_POOL; let newsIdx = Math.floor(Math.random() * pool.length);
            if (gameState.skills.insight > 0 && pool[newsIdx].effect === 'bear' && Math.random() < (gameState.skills.insight * 0.15)) newsIdx = Math.floor(Math.random() * 40);
            let news = pool[newsIdx]; gameState.active_news = news; gameState.news_remaining = news.duration;
            gameState.news_history.push({ day: gameState.day, title: news.title });
            document.getElementById('news-title').innerText = news.title; document.getElementById('news-msg').style.display = 'flex';
            marketEnergy += 1.5; updateAndDraw(); return; 
        }

        let change = 0;
        if (gameState.timeStopperDays > 0) { gameState.timeStopperDays--; }
        else {
            let baseVar = 41; change = Math.floor(Math.random() * (baseVar * marketEnergy)) - (baseVar * marketEnergy / 2);
            if (Math.abs(change) < 10) marketEnergy += 0.15; else marketEnergy = Math.max(1.0, marketEnergy - 0.2);
            if (gameState.active_news) {
                let n = gameState.active_news; let intensity = n.intensity * marketEnergy;
                if (n.effect === 'bull') change = Math.floor(Math.random() * (20 * intensity + 6)) - 5;
                else if (n.effect === 'bear') change = Math.floor(Math.random() * (20 * intensity + 6)) - (20 * intensity);
            }
        }

        let o = gameState.price, c = Math.max(10, o + change);
        let h = Math.max(o, c) + Math.floor(Math.random() * 11), l = Math.max(10, Math.min(o, c) - Math.floor(Math.random() * 11));
        gameState.price = c; gameState.history.push({ day: gameState.day, open: o, high: h, low: l, close: c, vol: Math.floor(Math.random() * 2000) + 500 });

        let total = calculateTotalAsset(); gameState.total_asset = total;
        let maintenanceMargin = Math.max(0.01, 0.05 - (gameState.skills.risk * 0.01));
        if (total <= 0 || (totalDebt > 0 && total < totalDebt * maintenanceMargin)) {
            gameState.shares = gameState.inv_shares = gameState.debt = gameState.inv_debt = 0; gameState.money = Math.max(0, total); gameState.liquidated = true; updateAndDraw(); return;
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
    let viewCount = (currentTF === 'daily') ? 40 : (currentTF === 'monthly' ? 36 : 20);
    if (currentTF === 'daily') hist = hist.slice(-60); else if (currentTF === 'monthly') hist = hist.slice(-84); else hist = hist.slice(-20);
    const cl = hist.map(x => x.close), hi = hist.map(x => x.high), lo = hist.map(x => x.low);
    const m5 = getSMA(cl, 5), m20 = getSMA(cl, 20);
    const bb = getBollinger(cl), macdData = getMACD(cl), stochData = getStoch(hi, lo, cl), rsi = getRSI(cl), ichi = getIchimoku(hi, lo), adx = getADX(hi, lo, cl), cci = getCCI(hi, lo, cl);
    let subOrder = ['vol', 'macd', 'stoch', 'rsi', 'cci', 'adx'].filter(s => showInd[s]);
    let finalRange = currentRange || [hist.length - viewCount - 0.5, hist.length + 1.5];
    drawChart(gameState, hist, m5, m20, bb, macdData, stochData, rsi, ichi, adx, cci, subOrder, finalRange);
    updateUI(gameState);
}

function drawChart(data, hist, m5, m20, bb, macd, stoch, rsi, ichi, adx, cci, subOrder, range) {
    const chartDiv = document.getElementById('chart'); Plotly.purge(chartDiv); 
    const isDark = (currentTheme === 'dark');
    const paperBg = isDark ? '#0a0b10' : '#f7f9f2', textColor = isDark ? '#00f2ff' : '#2d4a22';
    const gridColor = isDark ? 'rgba(0, 242, 255, 0.1)' : 'rgba(45, 74, 34, 0.05)', axisColor = textColor;
    const xIdx = hist.map((_, i) => i);
    const traces = [{ x: xIdx, open: hist.map(h => h.open), high: hist.map(h => h.high), low: hist.map(h => h.low), close: hist.map(h => h.close), type: 'candlestick', name: 'Price', increasing: {line:{color:'#ff3131'}}, decreasing: {line:{color:'#2196f3'}}, yaxis: 'y' }];
    if (showInd.ma) { traces.push({ x: xIdx, y: m5, name: 'MA5', line: {color:'#ff9800'}, yaxis: 'y' }); traces.push({ x: xIdx, y: m20, name: 'MA20', line: {color:'#4caf50'}, yaxis: 'y' }); }
    if (showInd.bb) { traces.push({ x: xIdx, y: bb.u, name: 'BBU', line: {color: isDark ? '#555' : '#ccc', dash:'dash'}, yaxis: 'y' }); traces.push({ x: xIdx, y: bb.l, name: 'BBL', line: {color: isDark ? '#555' : '#ccc', dash:'dash'}, yaxis: 'y' }); }
    if (showInd.ichimoku) { traces.push({ x: xIdx, y: ichi.t, name: 'Tenkan', line: {color:'#ff4081'}, yaxis: 'y' }); traces.push({ x: xIdx, y: ichi.k, name: 'Kijun', line: {color:'#795548'}, yaxis: 'y' }); }
    const subH = 0.20, subCount = subOrder.length, mainB = Math.min(0.45, subCount * subH + 0.05), bottomY = subCount > 0 ? 'y' + (subCount + 1) : 'y';
    const layout = { 
        grid: { rows: subCount + 1, columns: 1, roworder: 'top to bottom', rowgap: 0.06 }, paper_bgcolor: paperBg, plot_bgcolor: paperBg, font: { color: textColor, family: 'Consolas, Malgun Gothic' },
        yaxis: { domain: [mainB, 1], side: 'right', gridcolor: gridColor, zerolinecolor: gridColor, tickfont: {color: axisColor} },
        xaxis: { type: 'linear', tickvals: xIdx, ticktext: hist.map(h => h.label), range: range, gridcolor: gridColor, zerolinecolor: gridColor, tickfont: {color: axisColor}, anchor: bottomY, side: 'bottom', rangeslider: { visible: true, thickness: 0.03, borderwidth: 1, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' } },
        margin: { t: 5, b: 20, l: 5, r: 100 }, showlegend: false, shapes: [], annotations: [], dragmode: currentDragMode 
    };
    subOrder.forEach((s, i) => {
        const yNum = i + 2; const yk = 'yaxis' + yNum; const start = (subCount - 1 - i) * (mainB / subCount); const end = start + (mainB / subCount) - 0.04;
        layout[yk] = { domain: [start, end], side: 'right', fixedrange: true, gridcolor: gridColor, zerolinecolor: gridColor, tickfont: {color: axisColor, size: 9}, title: { text: s.toUpperCase(), font:{size:10, color: axisColor, weight: 'bold'} } };
        if (s === 'vol') traces.push({ x: xIdx, y: hist.map(h => h.vol), type: 'bar', marker: {color: isDark ? '#444' : '#ccc'}, yaxis: 'y' + yNum });
        else if (s === 'macd') { traces.push({ x: xIdx, y: macd.macd, line:{color:'#2196f3'}, yaxis: 'y' + yNum }); traces.push({ x: xIdx, y: macd.signal, line:{color:'#ff9800'}, yaxis: 'y' + yNum }); }
        else if (s === 'stoch') { traces.push({ x: xIdx, y: stoch.sk, line:{color:'#2196f3'}, yaxis: 'y' + yNum }); traces.push({ x: xIdx, y: stoch.sd, line:{color:'#ff9800'}, yaxis: 'y' + yNum }); }
        else if (s === 'rsi') traces.push({ x: xIdx, y: rsi, line:{color:'#9c27b0'}, yaxis: 'y' + yNum });
        else if (s === 'cci') traces.push({ x: xIdx, y: cci, line:{color: isDark ? '#ffca28' : '#009688'}, yaxis: 'y' + yNum });
        else if (s === 'adx') traces.push({ x: xIdx, y: adx, line:{color: isDark ? '#ffffff' : '#455a64'}, yaxis: 'y' + yNum });
    });
    const curP = data.price;
    layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: curP, y1: curP, line: { color: isDark ? '#fff' : '#000', width: 1, dash: 'dash' } });
    layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: curP, text: `$${curP.toLocaleString()}`, showarrow: false, font: { color: isDark ? '#000' : '#fff', size: 11 }, bgcolor: isDark ? '#fff' : '#000', borderpadding: 2 });
    if (data.shares > 0) {
        const avg = Math.floor(data.avg_price);
        layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: avg, y1: avg, line: { color: '#ff3131', width: 1.5, dash: 'dot' } });
        layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: avg, text: `L:$${avg.toLocaleString()}`, showarrow: false, font: { color: 'white', size: 10 }, bgcolor: '#ff3131', borderpadding: 2 });
    }
    if (data.inv_shares > 0) {
        const iAvg = Math.floor(data.inv_avg_price);
        layout.shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: iAvg, y1: iAvg, line: { color: '#2196f3', width: 1.5, dash: 'dot' } });
        layout.annotations.push({ xref: 'paper', x: 1.05, yref: 'y', y: iAvg, text: `S:$${iAvg.toLocaleString()}`, showarrow: false, font: { color: 'white', size: 10 }, bgcolor: '#2196f3', borderpadding: 2 });
    }
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
    document.getElementById('current-stage-num-side').innerText = stage.stage;
    document.getElementById('target-money-side').innerText = `$${stage.target.toLocaleString()}`;
    document.getElementById('remaining-days-side').innerText = `${Math.max(0, stage.days - s.day)}일`;
    document.getElementById('stage-progress-bar-side').style.width = `${Math.min(100, (s.money / stage.target) * 100)}%`;
    document.getElementById('stat-insight-lv').innerText = s.skills.insight; document.getElementById('stat-risk-lv').innerText = s.skills.risk; document.getElementById('stat-credit-lv').innerText = s.skills.credit;
    document.getElementById('player-rank-side').innerText = getRank(total);
    const list = document.getElementById('news-list');
    if (s.news_history.length > 0) { list.innerHTML = s.news_history.slice().reverse().map(n => `<div class="news-item"><span style="font-weight:bold; opacity:0.6; display:block; font-size:10px;">${n.day}일차</span>${n.title}</div>`).join(''); }
    updateInventoryUI();
}

function getRank(t) { if (t >= 100000000000000) return "🌌 우주의 지배자"; if (t >= 1000000000000) return "👑 세계 제1의 갑부"; if (t >= 1000000000) return "💎 투자의 신"; if (t >= 100000000) return "🏆 전설"; if (t >= 10000000) return "🏛️ 지배자"; if (t >= 1000000) return "🎩 슈퍼개미"; return "흙수저"; }
function showShopMenu() { document.getElementById('stageclear-msg').style.display = 'none'; document.getElementById('shop-msg').style.display = 'flex'; document.getElementById('shop-cash').innerText = `$${Math.floor(gameState.money).toLocaleString()}`; }
function closeShopMenu() { document.getElementById('shop-msg').style.display = 'none'; }
function buyItem(type, price) { if (gameState.money >= price) { gameState.money -= price; gameState.items[type]++; document.getElementById('shop-cash').innerText = `$${Math.floor(gameState.money).toLocaleString()}`; updateInventoryUI(); showFloatingText("구매 완료!", true); updateAndDraw(); } else { alert("현금 부족!"); } }
function updateInventoryUI() { for (let item in gameState.items) { const btn = document.getElementById(`item-${item}`); const count = gameState.items[item]; btn.innerText = `${btn.innerText.split(':')[0]}: ${count}`; if (count > 0) { btn.style.opacity = "1"; btn.disabled = false; } else { btn.style.opacity = "0.3"; btn.disabled = true; } } }
function useItem(type) { if (gameState.items[type] <= 0) return; gameState.items[type]--; if (type === 'time_stopper') { gameState.timeStopperDays = 3; showFloatingText("⏳ 시장 정지!", true); } else if (type === 'money_washer') { gameState.debt *= 0.5; gameState.inv_debt *= 0.5; showFloatingText("🧼 부채 탕감!", true); } else if (type === 'future_vision') { let p = gameState.price; let pred = []; for(let i=0; i<3; i++) { p += (Math.random()*40-20); pred.push(Math.floor(p).toLocaleString()); } alert(`🔮 [미래 예보]\n1일후: $${pred[0]}\n2일후: $${pred[1]}\n3일후: $${pred[2]}`); } else if (type === 'news_manipulator') { if (gameState.active_news && gameState.active_news.effect === 'bear') { gameState.active_news.effect = 'bull'; gameState.active_news.title = "📢 [조작] " + gameState.active_news.title.replace('🚨', '🚀'); showFloatingText("📢 조작 성공!", true); } else { alert("악재가 없습니다."); gameState.items[type]++; } } updateInventoryUI(); updateAndDraw(); }
function upgradeSkill(type) { if (gameState.skill_points > 0) { if (gameState.skills[type] >= 5) { alert("MAX!"); return; } gameState.skills[type]++; gameState.skill_points--; updateSkillUI(); updateAndDraw(); } else { alert("포인트 부족"); } }
function updateSkillUI() { document.getElementById('skill-points-val').innerText = gameState.skill_points; for (let s in gameState.skills) { let lv = gameState.skills[s]; document.getElementById(`skill-${s}-lv`).innerText = lv; document.getElementById(`stat-${s}-lv`).innerText = lv; if (lv >= 5) { let mText = ""; if (s === 'insight') mText = "★지표 마스터"; if (s === 'risk') mText = "★숏 전문가"; if (s === 'credit') { mText = "★고래의 피"; document.getElementById('lev-50x').style.display = 'inline-block'; } document.getElementById(`mastery-${s}`).innerText = mText; } } }
function showSkillMenu() { document.getElementById('stageclear-msg').style.display = 'none'; document.getElementById('skill-msg').style.display = 'flex'; updateSkillUI(); }
function closeSkillMenu() { document.getElementById('skill-msg').style.display = 'none'; }
function closeNewsOverlay() { document.getElementById('news-msg').style.display = 'none'; }
function closeStageOverlay() { document.getElementById('stageclear-msg').style.display = 'none'; }
function toggleTheme() { currentTheme = (currentTheme === 'light') ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', currentTheme); const themeBtn = document.getElementById('btn-theme'); if (themeBtn) { themeBtn.innerText = (currentTheme === 'dark') ? "☀️" : "🌓"; themeBtn.style.background = (currentTheme === 'dark') ? "#f1c40f" : "#34495e"; } updateAndDraw(); }
function changeTF(tf) { currentTF = tf; currentRange = null; document.querySelectorAll('.btn-tf').forEach(b => b.classList.remove('active')); document.getElementById(tf).classList.add('active'); updateAndDraw(); }
function setLev(v, btn) { selectedLev = v; document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function setDragMode(m) { currentDragMode = m; Plotly.relayout('chart', { dragmode: m }); }
function toggleInd(n, btn) { showInd[n] = !showInd[n]; btn.classList.toggle('on'); updateAndDraw(); }
function trade(act) { const amtInput = parseInt(document.getElementById('trade-amount').value); if (isNaN(amtInput) || amtInput <= 0) return; const p = gameState.price, feeRate = 0.0015; if (act === 'buy') { let cost = p * amtInput, fee = cost * feeRate, req = (cost / selectedLev) + fee; if (gameState.money >= req) { gameState.money -= req; gameState.debt += (cost - (cost/selectedLev)); gameState.avg_price = (gameState.shares * gameState.avg_price + cost) / (gameState.shares + amtInput); gameState.shares += amtInput; } } else if (act === 'sell' && gameState.shares > 0) { let sellAmt = Math.min(amtInput, gameState.shares), val = p * sellAmt, fee = val * feeRate, repay = gameState.debt * (sellAmt / gameState.shares), profit = (p - gameState.avg_price) * sellAmt; gameState.money += (val - repay - fee); gameState.debt -= repay; gameState.shares -= sellAmt; showFloatingText((profit - fee >= 0 ? '+' : '') + '$' + Math.floor(profit - fee).toLocaleString(), profit - fee >= 0); if (gameState.shares <= 0.01) { gameState.shares = 0; gameState.avg_price = 0; gameState.debt = 0; } } else if (act === 'buy_inv') { let cost = p * amtInput, fee = cost * feeRate, req = (cost / selectedLev) + fee; if (gameState.money >= req) { gameState.money -= req; gameState.inv_debt += (cost - (cost/selectedLev)); gameState.inv_avg_price = (gameState.inv_shares * gameState.inv_avg_price + cost) / (gameState.inv_shares + amtInput); gameState.inv_shares += amtInput; } } else if (act === 'sell_inv' && gameState.inv_shares > 0) { let sellAmt = Math.min(amtInput, gameState.inv_shares), val = p * sellAmt, fee = val * feeRate, profit = sellAmt * (gameState.inv_avg_price - p), repay = gameState.inv_debt * (sellAmt / gameState.inv_shares); let finalProfit = gameState.skills.risk >= 5 ? profit * 1.2 : profit; gameState.money += (sellAmt * gameState.inv_avg_price + finalProfit - repay - fee); gameState.inv_debt -= repay; gameState.inv_shares -= sellAmt; showFloatingText((finalProfit - fee >= 0 ? '+' : '') + '$' + Math.floor(finalProfit - fee).toLocaleString(), finalProfit - fee >= 0); if (gameState.inv_shares <= 0.01) { gameState.inv_shares = 0; gameState.inv_avg_price = 0; gameState.inv_debt = 0; } } checkStageClear(); updateAndDraw(); }
function setTradeMode(m) { currentTradeMode = m; document.getElementById('mode-long').classList.toggle('active', m === 'long'); document.getElementById('mode-inv').classList.toggle('active', m === 'inv'); }
function handleTrade(a) { trade(currentTradeMode === 'long' ? a : a + '_inv'); }
function handleTradeAll(a) { if (!gameState) return; let p = gameState.price, lev = selectedLev, feeRate = 0.0015, amt = 0; if (a === 'buy') { let costPerShare = (p / lev) + (p * feeRate); amt = Math.floor(gameState.money / costPerShare); } else { amt = (currentTradeMode === 'long') ? gameState.shares : gameState.inv_shares; } if (amt <= 0) return; const oldVal = document.getElementById('trade-amount').value; document.getElementById('trade-amount').value = Math.floor(amt); handleTrade(a); document.getElementById('trade-amount').value = oldVal; }
function resetGame() { gameState = generateInitialState(); currentRange = null; marketEnergy = 1.0; const list = document.getElementById('news-list'); if (list) list.innerHTML = `<p style=\"opacity:0.5; font-size:12px;\">뉴스가 없습니다.</p>`; document.querySelectorAll('.liquidation-overlay').forEach(el => el.style.display = 'none'); updateAndDraw(); }
function undoLastShape() { const c = document.getElementById('chart'); if (c.layout && c.layout.shapes) { const userShapes = c.layout.shapes.filter(s => s.xref !== 'paper'); if (userShapes.length > 0) { const lastUserShape = userShapes[userShapes.length - 1]; const newShapes = c.layout.shapes.filter(s => s !== lastUserShape); Plotly.relayout('chart', { shapes: newShapes }); } } }
function clearShapes() { const c = document.getElementById('chart'); if (c.layout && c.layout.shapes) { const systemShapes = c.layout.shapes.filter(s => s.xref === 'paper'); Plotly.relayout('chart', { shapes: systemShapes }); } }
window.onload = () => { gameState = generateInitialState(); updateAndDraw(); };
