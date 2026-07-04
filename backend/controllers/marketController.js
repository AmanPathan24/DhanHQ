const axios = require('axios');

// In-Memory Simulated State for Sandbox Mode
let sandboxState = {
  spotPrice: 24350.50,
  futuresPrice: 24410.20,
  open: 24300.00,
  high: 24400.00,
  low: 24280.00,
  close: 24320.00,
  volume: 15420000,
  vwap: 24345.10,
  advances: 28,
  declines: 18,
  unchanged: 4,
  lastUpdated: new Date()
};

// Update sandbox state simulating live market tick updates
const tickSandboxData = () => {
  const spotChange = (Math.random() - 0.49) * 12; // slight upward drift
  const futuresChange = spotChange + (Math.random() - 0.5) * 2; // futures follows spot closely

  sandboxState.spotPrice = parseFloat((sandboxState.spotPrice + spotChange).toFixed(2));
  sandboxState.futuresPrice = parseFloat((sandboxState.futuresPrice + futuresChange).toFixed(2));

  // Update High/Low
  if (sandboxState.spotPrice > sandboxState.high) {
    sandboxState.high = sandboxState.spotPrice;
  }
  if (sandboxState.spotPrice < sandboxState.low) {
    sandboxState.low = sandboxState.spotPrice;
  }

  // Volume Increases
  const additionalVolume = Math.floor(Math.random() * 45000) + 5000;
  sandboxState.volume += additionalVolume;

  // Recalculate VWAP (simulated running average near spot price)
  const currentTotalVal = sandboxState.volume * sandboxState.vwap + additionalVolume * sandboxState.spotPrice;
  sandboxState.vwap = parseFloat((currentTotalVal / sandboxState.volume).toFixed(2));

  // Simulating stock shifts in Nifty 50 breadth
  if (Math.random() > 0.75) {
    const action = Math.random();
    if (action < 0.45 && sandboxState.declines > 5) {
      sandboxState.declines--;
      sandboxState.advances++;
    } else if (action < 0.90 && sandboxState.advances > 5) {
      sandboxState.advances--;
      sandboxState.declines++;
    } else {
      // Shift to/from unchanged
      if (Math.random() > 0.5 && sandboxState.unchanged > 1) {
        sandboxState.unchanged--;
        sandboxState.advances++;
      } else if (sandboxState.advances > 5) {
        sandboxState.advances--;
        sandboxState.unchanged++;
      }
    }
  }

  sandboxState.lastUpdated = new Date();
};

// GET unified quotes controller
const getMarketQuotes = async (req, res) => {
  const mode = req.query.mode || 'sandbox';

  // If live mode is selected, call Dhan API
  if (mode === 'live') {
    const { DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN } = process.env;

    if (!DHAN_CLIENT_ID || !DHAN_ACCESS_TOKEN) {
      // Graceful fallback to sandbox with warning
      tickSandboxData();
      return res.json({
        mode: 'sandbox',
        warning: 'Live credentials missing in .env. Falling back to Sandbox Mode.',
        data: { ...sandboxState }
      });
    }

    try {
      // POST Request snapshot to Dhan API quotes
      // In Dhan, NIFTY 50 Index security ID is 13, and NIFTY FNO is 49081 (Example monthly future)
      const response = await axios.post('https://api.dhan.co/v2/marketfeed/quote', {
        "NSE_EQ": [13],
        "NSE_FNO": [49081]
      }, {
        headers: {
          'client-id': DHAN_CLIENT_ID,
          'access-token': DHAN_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 seconds timeout
      });

      // Map Dhan API response schema to unified layout
      const dhanData = response.data;
      
      // Calculate derived fields or pull them from Dhan structure
      const niftySpotQuote = dhanData.data && dhanData.data["13"] ? dhanData.data["13"] : {};
      const niftyFutQuote = dhanData.data && dhanData.data["49081"] ? dhanData.data["49081"] : {};

      // If Dhan API is offline or returns empty quotes (e.g. outside market hours), fallback to sandbox
      if (!niftySpotQuote.lastPrice) {
        tickSandboxData();
        return res.json({
          mode: 'sandbox',
          warning: 'Dhan API returned empty quote data. Falling back to Sandbox Mode.',
          data: { ...sandboxState }
        });
      }

      return res.json({
        mode: 'live',
        data: {
          spotPrice: niftySpotQuote.lastPrice || 0.0,
          futuresPrice: niftyFutQuote.lastPrice || 0.0,
          open: niftySpotQuote.ohlc?.open || 0.0,
          high: niftySpotQuote.ohlc?.high || 0.0,
          low: niftySpotQuote.ohlc?.low || 0.0,
          close: niftySpotQuote.ohlc?.close || 0.0,
          volume: niftySpotQuote.volume || 0,
          vwap: niftySpotQuote.vwap || niftySpotQuote.lastPrice || 0.0,
          advances: 25, // Fallback index breadth values
          declines: 20,
          unchanged: 5,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      // Graceful error fallback to sandbox mode
      tickSandboxData();
      return res.json({
        mode: 'sandbox',
        warning: `Dhan API error (${error.message}). Falling back to Sandbox Mode.`,
        data: { ...sandboxState }
      });
    }
  }

  // Otherwise, default to Sandbox Mode
  tickSandboxData();
  return res.json({
    mode: 'sandbox',
    data: { ...sandboxState }
  });
};

module.exports = {
  getMarketQuotes
};
