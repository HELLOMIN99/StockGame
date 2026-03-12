from flask import Flask, render_template, jsonify, request
import random
import math
from datetime import datetime, timedelta

app = Flask(__name__)

# --- 지표 계산 엔진 ---
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
        slice_tp = tp[i-n+1:i+1]
        avg_dev = sum(abs(x - sma_tp[i]) for x in slice_tp) / n
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

# --- 초기 데이터 생성 ---
def generate_initial_state():
    state = {
        "day": 1, 
        "money": 10000, 
        "shares": 0, "avg_price": 0, "debt": 0,
        "inv_shares": 0, "inv_avg_price": 0, "inv_debt": 0,
        "total_asset": 10000, "history": [], "trade_marks": []
    }
    price = random.randint(150, 400)
    for i in range(-7300, 1):
        o = price; c = max(10, o + random.randint(-15, 15))
        h = max(o, c) + random.randint(0, 10); l = max(10, min(o, c) - random.randint(0, 10))
        state["history"].append({"day": i, "open": o, "high": h, "low": l, "close": c, "vol": random.randint(100, 2000)})
        price = c
    state["price"] = price; return state

game_state = generate_initial_state()

@app.route('/')
def home():
    global game_state
    game_state = generate_initial_state()
    return render_template('index.html')

@app.route('/reset_game')
def reset_game():
    global game_state
    game_state = generate_initial_state()
    return jsonify({"success": True})

def calculate_total_asset():
    price = game_state['price']
    long_value = (game_state['shares'] * price) - game_state['debt']
    # 인버스 가치 계산: (진입가 * 2 - 현재가) * 수량 - 부채
    inv_value = (game_state['inv_shares'] * (2 * game_state['inv_avg_price'] - price)) - game_state['inv_debt'] if game_state['inv_shares'] > 0 else 0
    return game_state['money'] + long_value + inv_value

@app.route('/get_state')
def get_state():
    tf = request.args.get('tf', 'daily')
    base_date = datetime(2026, 3, 11)
    raw = game_state['history']
    if tf == 'daily': raw_set = raw[-365:]
    elif tf == 'monthly': raw_set = raw[-3650:]
    else: raw_set = raw
    
    grouped = {}
    for h in raw_set:
        dt = base_date + timedelta(days=h['day'])
        key = h['day'] if tf == 'daily' else ((dt.year, dt.month) if tf == 'monthly' else dt.year)
        if key not in grouped:
            lbl = f"{dt.month}.{dt.day}" if tf == 'daily' else (f"{str(dt.year)[2:]}.{dt.month}" if tf == 'monthly' else f"{dt.year}년")
            grouped[key] = {"open": h['open'], "high": h['high'], "low": h['low'], "close": h['close'], "vol": h['vol'], "label": lbl}
        else:
            g = grouped[key]; g["high"] = max(g["high"], h['high']); g["low"] = min(g["low"], h['low']); g["close"] = h['close']; g["vol"] += h['vol']
    
    hist = list(grouped.values()); cl, hi, lo, vl = [x['close'] for x in hist], [x['high'] for x in hist], [x['low'] for x in hist], [x['vol'] for x in hist]
    m5, m20, m60 = get_sma(cl, 5), get_sma(cl, 20), get_sma(cl, 60)
    bu, bl = get_bollinger(cl); macd, ms = get_macd(cl); sk, sd = get_stochastic(hi, lo, cl); rsi = get_rsi(cl)
    ten, kij, sa, sb = get_ichimoku(hi, lo); pdi, mdi, adx = get_adx(hi, lo, cl); vma = get_sma(vl, 20); cci = get_cci(hi, lo, cl)
    for i, x in enumerate(hist):
        x.update({"ma5":m5[i], "ma20":m20[i], "ma60":m60[i], "bb_u":bu[i], "bb_l":bl[i], "macd":macd[i], "macd_s":ms[i], 
                  "st_k":sk[i], "st_d":sd[i], "rsi":rsi[i], "cci":cci[i], "ten":ten[i], "kij":kij[i], "sa":sa[i], "sb":sb[i], "pdi":pdi[i], "mdi":mdi[i], "adx":adx[i], "vma":vma[i]})
    
    game_state['total_asset'] = calculate_total_asset()
    return jsonify({**game_state, "display_history": hist})

@app.route('/next_day')
def next_day():
    days = int(request.args.get('days', 1))
    for _ in range(days):
        game_state['day'] += 1; o = game_state['price']; c = max(10, o + random.randint(-20, 20))
        h = max(o, c) + random.randint(0, 15); l = max(10, min(o, c) - random.randint(0, 15))
        game_state['price'] = c
        game_state['history'].append({"day": game_state['day'], "open": o, "high": h, "low": l, "close": c, "vol": random.randint(500, 3000)})
    game_state['total_asset'] = calculate_total_asset()
    return get_state()

@app.route('/buy')
def buy():
    amount = int(request.args.get('amount', 1))
    lev = int(request.args.get('lev', 1))
    total_cost = game_state['price'] * amount
    required_cash = total_cost / lev
    
    if game_state['money'] >= required_cash:
        borrowed = total_cost - required_cash
        total_spent = (game_state['shares'] * game_state['avg_price']) + total_cost
        game_state['money'] -= required_cash
        game_state['debt'] += borrowed
        game_state['shares'] += amount
        game_state['avg_price'] = total_spent / game_state['shares']
        game_state['trade_marks'].append({"price": game_state['price'], "type": "buy"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "잔액 부족 (레버리지 포함)"})

@app.route('/sell')
def sell():
    amount = int(request.args.get('amount', 1))
    if game_state['shares'] >= amount:
        total_value = game_state['price'] * amount
        repay_ratio = amount / game_state['shares']
        repay_amount = game_state['debt'] * repay_ratio
        
        game_state['money'] += (total_value - repay_amount)
        game_state['debt'] -= repay_amount
        game_state['shares'] -= amount
        
        if game_state['shares'] == 0: 
            game_state['avg_price'] = 0
            game_state['debt'] = 0
            
        game_state['trade_marks'].append({"price": game_state['price'], "type": "sell"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "주식 부족"})

@app.route('/buy_inv')
def buy_inv():
    amount = int(request.args.get('amount', 1))
    lev = int(request.args.get('lev', 1))
    total_cost = game_state['price'] * amount
    required_cash = total_cost / lev
    
    if game_state['money'] >= required_cash:
        borrowed = total_cost - required_cash
        total_spent = (game_state['inv_shares'] * game_state['inv_avg_price']) + total_cost
        game_state['money'] -= required_cash
        game_state['inv_debt'] += borrowed
        game_state['inv_shares'] += amount
        game_state['inv_avg_price'] = total_spent / game_state['inv_shares']
        game_state['trade_marks'].append({"price": game_state['price'], "type": "buy_inv"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "잔액 부족 (인버스 레버리지 포함)"})

@app.route('/sell_inv')
def sell_inv():
    amount = int(request.args.get('amount', 1))
    if game_state['inv_shares'] >= amount:
        price = game_state['price']
        # 인버스 가치: (진입가 + (진입가 - 현재가)) * 수량
        entry_val = amount * game_state['inv_avg_price']
        profit = amount * (game_state['inv_avg_price'] - price)
        total_value = entry_val + profit
        
        repay_ratio = amount / game_state['inv_shares']
        repay_amount = game_state['inv_debt'] * repay_ratio
        
        game_state['money'] += (total_value - repay_amount)
        game_state['inv_debt'] -= repay_amount
        game_state['inv_shares'] -= amount
        
        if game_state['inv_shares'] == 0: 
            game_state['inv_avg_price'] = 0
            game_state['inv_debt'] = 0
            
        game_state['trade_marks'].append({"price": game_state['price'], "type": "sell_inv"})
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "인버스 주식 부족"})

if __name__ == '__main__': app.run(host='0.0.0.0', port=5000, debug=True)
