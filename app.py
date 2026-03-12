from flask import Flask, render_template, jsonify, request
import random
import math
from datetime import datetime, timedelta

app = Flask(__name__)

# --- 지표 계산 엔진 (복구 완료) ---
def get_sma(prices, n):
    if len(prices) < n: return [0] * len(prices)
    return [0]*(n-1) + [sum(prices[i-n+1:i+1])/n for i in range(n-1, len(prices))]

def get_ema(prices, n):
    if not prices: return []
    ema = [prices[0]]
    alpha = 2 / (n + 1)
    for i in range(1, len(prices)):
        ema.append(prices[i] * alpha + ema[-1] * (1 - alpha))
    return ema

def get_rsi(prices, period=14):
    if len(prices) < period + 1: return [50.0] * len(prices)
    deltas = [prices[i+1] - prices[i] for i in range(len(prices)-1)]
    up = [d if d > 0 else 0 for d in deltas]; down = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(up[:period]) / period; avg_loss = sum(down[:period]) / period
    rsi_results = [50.0] * (period + 1)
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + up[i]) / period
        avg_loss = (avg_loss * (period - 1) + down[i]) / period
        rs = avg_gain / avg_loss if avg_loss != 0 else 100
        rsi_results.append(100 - (100 / (1 + rs)))
    return rsi_results[:len(prices)]

def get_cci(highs, lows, closes, n=14):
    tp = [(h + l + c) / 3 for h, l, c in zip(highs, lows, closes)]
    sma_tp = get_sma(tp, n); cci = []
    for i in range(len(tp)):
        if i < n-1: cci.append(0.0); continue
        slice_tp = tp[i-n+1:i+1]; avg_dev = sum(abs(x - sma_tp[i]) for x in slice_tp) / n
        cci.append((tp[i] - sma_tp[i]) / (0.015 * avg_dev) if avg_dev != 0 else 0)
    return cci

def get_bollinger(prices, n=20, k=1.5):
    sma = get_sma(prices, n); upper, lower = [], []
    for i in range(len(prices)):
        if i < n-1: upper.append(None); lower.append(None); continue
        slice_p = prices[i-n+1:i+1]; std = math.sqrt(sum((x - sma[i])**2 for x in slice_p) / n)
        upper.append(sma[i] + k * std); lower.append(sma[i] - k * std)
    return upper, lower

def get_macd(prices, fast=12, slow=26, signal=9):
    ef = get_ema(prices, fast); es = get_ema(prices, slow)
    macd = [f - s for f, s in zip(ef, es)]; sig = get_ema(macd, signal)
    return macd, sig

def get_stochastic(highs, lows, closes, n=14, k=3, d=3):
    pk = []
    for i in range(len(closes)):
        if i < n-1: pk.append(50.0); continue
        hh, ll = max(highs[i-n+1:i+1]), min(lows[i-n+1:i+1])
        pk.append(((closes[i]-ll)/(hh-ll)*100) if hh!=ll else 50.0)
    sk = get_sma(pk, k); sd = get_sma(sk, d)
    return sk, sd

def get_ichimoku(highs, lows):
    def mid(h, l, n):
        res = []
        for i in range(len(h)):
            if i < n-1: res.append(h[i])
            else: res.append((max(h[i-n+1:i+1]) + min(l[i-n+1:i+1])) / 2)
        return res
    ten = mid(highs, lows, 9); kij = mid(highs, lows, 26)
    sa = [None]*26 + [(t+k)/2 for t, k in zip(ten, kij)]; sb = [None]*26 + mid(highs, lows, 52)
    return ten, kij, sa[:len(highs)], sb[:len(highs)]

def get_adx(highs, lows, closes, n=14):
    tr, pdm, mdm = [], [], []
    for i in range(1, len(closes)):
        tr.append(max(highs[i]-lows[i], abs(highs[i]-closes[i-1]), abs(lows[i]-closes[i-1])))
        up, down = highs[i]-highs[i-1], lows[i-1]-lows[i]
        pdm.append(up if up > down and up > 0 else 0); mdm.append(down if down > up and down > 0 else 0)
    st, sp, sm = get_ema(tr, n), get_ema(pdm, n), get_ema(mdm, n)
    pdi = [0.0] + [(p/t)*100 if t else 0 for p, t in zip(sp, st)]
    mdi = [0.0] + [(m/t)*100 if t else 0 for m, t in zip(sm, st)]
    dx = [abs(p-m)/(p+m)*100 if (p+m) else 0 for p, m in zip(pdi, mdi)]
    return pdi, mdi, get_ema(dx, n)

# --- 스테이지 및 뉴스 데이터 ---
STAGES = [{"stage": i+1, "days": d, "target": t} for i, (d, t) in enumerate([(15, 30000), (35, 100000), (60, 300000), (100, 1000000), (150, 3000000), (220, 10000000), (300, 30000000), (400, 100000000), (550, 300000000), (730, 1000000000)])]
NEWS_POOL = [
    {"title": "📢 중앙은행, 전격 금리 인하 발표! 시중 유동성 공급 확대 기대", "effect": "bull", "intensity": 2.5, "duration": 5},
    {"title": "📢 대형 우량주 실적 발표, 사상 최대 영업이익 달성", "effect": "bull", "intensity": 2.0, "duration": 4},
    {"title": "📢 핵심 기술 특허 취득 성공! 독점적 시장 지위 확보", "effect": "bull", "intensity": 3.0, "duration": 7},
    {"title": "🚨 소비자 물가 지수(CPI) 예상치 상회... 금리 인상 우려 확산", "effect": "bear", "intensity": 2.5, "duration": 5},
    {"title": "🚨 기업 회계 부정 의혹 제기... 금융감독원 전격 조사 착수", "effect": "bear", "intensity": 4.0, "duration": 7},
    {"title": "⚠️ 중동 지역 지정학적 리스크 고조... 시장 불확실성 증폭", "effect": "volatile", "intensity": 4.0, "duration": 5},
    {"title": "💬 횡보 장세 지속... 특별한 모멘텀 없이 눈치보기 극심", "effect": "calm", "intensity": 0.3, "duration": 5},
]

def generate_initial_state():
    state = {
        "day": 1, "money": 10000, "initial_seed": 10000,
        "shares": 0, "avg_price": 0, "debt": 0,
        "inv_shares": 0, "inv_avg_price": 0, "inv_debt": 0,
        "total_asset": 10000, "history": [], "trade_marks": [],
        "liquidated": False, "current_stage_idx": 0,
        "game_over": False, "game_clear": False, "stage_cleared_flag": False,
        "active_news": None, "news_remaining": 0, "news_history": [],
        "new_news_flag": False, "skill_points": 0,
        "skills": {"insight": 0, "risk": 0, "credit": 0}
    }
    price = random.randint(150, 400)
    for i in range(-1000, 1):
        o = price; c = max(10, o + random.randint(-15, 15))
        h = max(o, c) + random.randint(0, 10); l = max(10, min(o, c) - random.randint(0, 10))
        state["history"].append({"day": i, "open": o, "high": h, "low": l, "close": c, "vol": random.randint(100, 2000)})
        price = c
    state["price"] = price; return state

game_state = generate_initial_state()

@app.route('/')
def home(): return render_template('index.html')

@app.route('/reset_game')
def reset_game():
    global game_state; game_state = generate_initial_state()
    return jsonify({"success": True})

@app.route('/get_state')
def get_state():
    tf = request.args.get('tf', 'daily')
    raw = game_state['history']
    if tf == 'daily': raw_set = raw[-365:]
    elif tf == 'monthly': raw_set = raw[-1200:] # 대략 10년
    else: raw_set = raw # 년봉은 전체

    # 타임프레임 그룹화 로직 (복구)
    grouped = {}
    for h in raw_set:
        dt = datetime(2026, 3, 11) + timedelta(days=h['day'])
        key = h['day'] if tf == 'daily' else ((dt.year, dt.month) if tf == 'monthly' else dt.year)
        if key not in grouped:
            lbl = f"{dt.month}/{dt.day}" if tf == 'daily' else (f"{str(dt.year)[2:]}.{dt.month}" if tf == 'monthly' else f"{dt.year}Y")
            grouped[key] = {"open": h['open'], "high": h['high'], "low": h['low'], "close": h['close'], "vol": h['vol'], "label": lbl, "day": h['day']}
        else:
            g = grouped[key]; g["high"] = max(g["high"], h['high']); g["low"] = min(g["low"], h['low']); g["close"] = h['close']; g["vol"] += h['vol']
    
    hist = list(grouped.values())
    cl, hi, lo, vl = [x['close'] for x in hist], [x['high'] for x in hist], [x['low'] for x in hist], [x['vol'] for x in hist]
    m5, m20, m60 = get_sma(cl, 5), get_sma(cl, 20), get_sma(cl, 60)
    bu, bl = get_bollinger(cl); macd, ms = get_macd(cl); sk, sd = get_stochastic(hi, lo, cl); rsi = get_rsi(cl)
    ten, kij, sa, sb = get_ichimoku(hi, lo); pdi, mdi, adx = get_adx(hi, lo, cl); cci = get_cci(hi, lo, cl)
    
    for i, x in enumerate(hist):
        x.update({"ma5":m5[i], "ma20":m20[i], "ma60":m60[i], "bb_u":bu[i], "bb_l":bl[i], "macd":macd[i], "st_k":sk[i], "st_d":sd[i], "rsi":rsi[i], "ten":ten[i], "kij":kij[i], "sa":sa[i], "sb":sb[i], "pdi":pdi[i], "mdi":mdi[i], "adx":adx[i], "cci":cci[i]})

    idx = game_state['current_stage_idx']
    stage_info = STAGES[idx] if idx < len(STAGES) else STAGES[-1]
    return jsonify({**game_state, "display_history": hist, "stage_info": stage_info, "stages": STAGES})

def calculate_total_asset():
    p = game_state['price']
    long_v = (game_state['shares'] * p) - game_state['debt']
    inv_v = (game_state['inv_shares'] * (2 * game_state['inv_avg_price'] - p)) - game_state['inv_debt'] if game_state['inv_shares'] > 0 else 0
    return game_state['money'] + long_v + inv_v

@app.route('/next_day')
def next_day():
    if game_state['game_over'] or game_state['game_clear'] or game_state['new_news_flag']: return get_state()
    days = int(request.args.get('days', 1))
    for _ in range(days):
        game_state['day'] += 1
        if game_state['news_remaining'] > 0:
            game_state['news_remaining'] -= 1
            if game_state['news_remaining'] == 0: game_state['active_news'] = None
        if not game_state['active_news'] and random.random() < 0.10:
            news = random.choice(NEWS_POOL)
            game_state['active_news'] = news; game_state['news_remaining'] = news['duration']
            game_state['news_history'].append({"day": game_state['day'], "title": news['title']}); game_state['new_news_flag'] = True
        
        base_change = random.randint(-20, 20)
        if game_state['active_news']:
            n = game_state['active_news']; i = n['intensity']
            if n['effect'] == 'bull': base_change = random.randint(-5, int(20 * i))
            elif n['effect'] == 'bear': base_change = random.randint(int(-20 * i), 5)
            elif n['effect'] == 'volatile': base_change = random.randint(int(-25 * i), int(25 * i))
        
        o = game_state['price']; c = max(10, o + base_change); h = max(o, c) + random.randint(0, 15); l = max(10, min(o, c) - random.randint(0, 15))
        game_state['price'] = c; game_state['history'].append({"day": game_state['day'], "open": o, "high": h, "low": l, "close": c, "vol": random.randint(500, 3000)})
        
        threshold = 0.4 - (game_state['skills']['risk'] * 0.1)
        if calculate_total_asset() < game_state['initial_seed'] * threshold:
            game_state['shares'] = game_state['inv_shares'] = game_state['debt'] = game_state['inv_debt'] = 0
            game_state['money'] = max(0, calculate_total_asset()); game_state['liquidated'] = True; break
        
        idx = game_state['current_stage_idx']
        if idx < len(STAGES):
            if calculate_total_asset() >= STAGES[idx]['target']:
                game_state['current_stage_idx'] += 1; game_state['stage_cleared_flag'] = True; game_state['skill_points'] += 1
                if game_state['current_stage_idx'] >= len(STAGES): game_state['game_clear'] = True
                break
            if game_state['day'] >= STAGES[idx]['days']: game_state['game_over'] = True; break
        if game_state['new_news_flag']: break
    game_state['total_asset'] = calculate_total_asset()
    return get_state()

@app.route('/buy')
def buy():
    amt = int(request.args.get('amount', 0)); lev = int(request.args.get('lev', 1))
    if amt <= 0: return jsonify({"success": False, "message": "수량 입력"})
    cost = game_state['price'] * amt; req = cost / lev
    if game_state['money'] >= req:
        game_state['money'] -= req; game_state['debt'] += (cost - req)
        avg = (game_state['shares'] * game_state['avg_price'] + cost) / (game_state['shares'] + amt)
        game_state['shares'] += amt; game_state['avg_price'] = avg
        game_state['trade_marks'].append({"day": game_state['day'], "price": game_state['price'], "type": "buy"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "잔액 부족"})

@app.route('/sell')
def sell():
    amt = int(request.args.get('amount', 0))
    if amt <= 0 or game_state['shares'] < amt: return jsonify({"success": False, "message": "수량 부족"})
    val = game_state['price'] * amt; repay = game_state['debt'] * (amt / game_state['shares'])
    game_state['money'] += (val - repay); game_state['debt'] -= repay; game_state['shares'] -= amt
    if game_state['shares'] <= 0: game_state['avg_price'] = game_state['debt'] = 0
    game_state['trade_marks'].append({"day": game_state['day'], "price": game_state['price'], "type": "sell"})
    return jsonify({"success": True})

@app.route('/buy_inv')
def buy_inv():
    amt = int(request.args.get('amount', 0)); lev = int(request.args.get('lev', 1))
    if amt <= 0: return jsonify({"success": False, "message": "수량 입력"})
    cost = game_state['price'] * amt; req = cost / lev
    if game_state['money'] >= req:
        game_state['money'] -= req; game_state['inv_debt'] += (cost - req)
        avg = (game_state['inv_shares'] * game_state['inv_avg_price'] + cost) / (game_state['inv_shares'] + amt)
        game_state['inv_shares'] += amt; game_state['inv_avg_price'] = avg
        game_state['trade_marks'].append({"day": game_state['day'], "price": game_state['price'], "type": "buy_inv"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "잔액 부족"})

@app.route('/sell_inv')
def sell_inv():
    amt = int(request.args.get('amount', 0))
    if amt <= 0 or game_state['inv_shares'] < amt: return jsonify({"success": False, "message": "수량 부족"})
    profit = amt * (game_state['inv_avg_price'] - game_state['price'])
    val = (amt * game_state['inv_avg_price']) + profit; repay = game_state['inv_debt'] * (amt / game_state['inv_shares'])
    game_state['money'] += (val - repay); game_state['inv_debt'] -= repay; game_state['inv_shares'] -= amt
    if game_state['inv_shares'] <= 0: game_state['inv_avg_price'] = game_state['inv_debt'] = 0
    game_state['trade_marks'].append({"day": game_state['day'], "price": game_state['price'], "type": "sell_inv"})
    return jsonify({"success": True})

@app.route('/upgrade_skill')
def upgrade_skill():
    name = request.args.get('skill')
    if game_state['skill_points'] > 0 and game_state['skills'][name] < 3:
        game_state['skills'][name] += 1; game_state['skill_points'] -= 1
        return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/ack_news')
def ack_news(): game_state['new_news_flag'] = False; return jsonify({"success": True})
@app.route('/ack_stage_clear')
def ack_stage_clear(): game_state['stage_cleared_flag'] = False; return jsonify({"success": True})

if __name__ == '__main__': app.run(host='0.0.0.0', port=5000, debug=True)
