const moment = require('moment');

const calculateRSI = (data, periods = 14) => {
    const gains = [];
    const losses = [];
    for (let i = 1; i < data.length; i++) {
        const delta = data[i].close - data[i - 1].close;
        gains.push(delta > 0 ? delta : 0);
        losses.push(delta < 0 ? -delta : 0);
    }

    const avgGain = gains.slice(0, periods).reduce((sum, val) => sum + val, 0) / periods;
    const avgLoss = losses.slice(0, periods).reduce((sum, val) => sum + val, 0) / periods;

    const rs = avgGain / avgLoss || 0;
    const rsi = 100 - (100 / (1 + rs));
    return rsi;
};

const calculateMACD = (data, slow = 26, fast = 12, signal = 9) => {
    const ema = (data, period) => {
        const k = 2 / (period + 1);
        let ema = data[0].close;
        const result = [ema];
        for (let i = 1; i < data.length; i++) {
            ema = data[i].close * k + ema * (1 - k);
            result.push(ema);
        }
        return result;
    };

    const emaFast = ema(data, fast);
    const emaSlow = ema(data, slow);
    const macd = emaFast.map((val, i) => val - emaSlow[i]);

    const signalLine = ema(macd.map((val, i) => ({ close: val })), signal);
    const macdHist = macd.map((val, i) => val - signalLine[i]);

    return { macd: macd[macd.length - 1], signal: signalLine[signalLine.length - 1], hist: macdHist[macdHist.length - 1] };
};

const getTechnicalIndicators = async (pgPool, symbol, daysBack = 90) => {
    const startDate = moment().subtract(daysBack, 'days').format('YYYY-MM-DD');
    const data = await pgPool.query(
        `SELECT date, close, volume FROM nse500_data 
         WHERE symbol = $1 AND date >= $2 
         ORDER BY date ASC`,
        [symbol, startDate]
    );

    if (data.rows.length < 50) return null;

    const closes = data.rows.map(row => row.close);
    const sma20 = closes.slice(-20).reduce((sum, val) => sum + val, 0) / 20;
    const sma50 = closes.slice(-50).reduce((sum, val) => sum + val, 0) / 50;

    const stdDev20 = Math.sqrt(closes.slice(-20).reduce((sum, val) => sum + Math.pow(val - sma20, 2), 0) / 20);
    const bollingerUpper = sma20 + 2 * stdDev20;
    const bollingerLower = sma20 - 2 * stdDev20;

    const rsi = calculateRSI(data.rows.slice(-15));
    const macd = calculateMACD(data.rows);

    return {
        date: data.rows[data.rows.length - 1].date,
        close: data.rows[data.rows.length - 1].close,
        volume: data.rows[data.rows.length - 1].volume,
        rsi_14: rsi,
        macd,
        sma_20: sma20,
        sma_50: sma50,
        bollinger_upper: bollingerUpper,
        bollinger_lower: bollingerLower
    };
};

module.exports = { getTechnicalIndicators };