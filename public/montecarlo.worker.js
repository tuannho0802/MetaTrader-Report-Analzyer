/**
 * Monte Carlo Simulation Worker
 * Implements proper Bootstrap Resampling with replacement.
 * Enhanced with risk metrics (Sharpe, Sortino).
 */

self.addEventListener('message', function (e) {
  var trades = e.data.trades;
  var numSimulations = e.data.numSimulations;
  var sampleSize = e.data.sampleSize;
  var shuffle = e.data.shuffle;
  var totalDays = e.data.totalDays || 1; // Used for scaling Sharpe/Sortino

  var profits = [];
  var drawdowns = [];
  var sharpes = [];
  var sortinos = [];

  var n = Math.min(sampleSize, trades.length);
  var tradesPerDay = n / Math.max(1, totalDays);

  function calculatePathMetrics(sampleProfits) {
    var equity = 0;
    var maxEquity = 0;
    var maxDrawdown = 0;
    
    var sumProfit = 0;
    var sumSqProfit = 0;
    var sumDownsideSqProfit = 0;

    for (var k = 0; k < sampleProfits.length; k++) {
      var p = sampleProfits[k];
      
      // Equity & Drawdown
      equity += p;
      if (equity > maxEquity) maxEquity = equity;
      var dd = maxEquity - equity;
      if (dd > maxDrawdown) maxDrawdown = dd;

      // Stats for Sharpe/Sortino (trade-based)
      sumProfit += p;
      sumSqProfit += p * p;
      if (p < 0) sumDownsideSqProfit += p * p;
    }

    var mean = sumProfit / sampleProfits.length;
    var variance = (sumSqProfit / sampleProfits.length) - (mean * mean);
    var stdDev = Math.sqrt(Math.max(0, variance));
    var downsideDev = Math.sqrt(Math.max(0, sumDownsideSqProfit / sampleProfits.length));

    // Scale to daily metrics (approximate)
    var sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(tradesPerDay) : 0;
    var sortino = downsideDev > 0 ? (mean / downsideDev) * Math.sqrt(tradesPerDay) : 0;

    return {
      finalProfit: equity,
      maxDrawdown: maxDrawdown,
      sharpe: sharpe,
      sortino: sortino
    };
  }

  // ✅ OPTIMIZATION: If shuffle is false, run once and replicate
  if (!shuffle) {
    var sample = trades.slice(0, n);
    var res = calculatePathMetrics(sample.map(function(t) { return t.profit; }));

    for (var i = 0; i < numSimulations; i++) {
      profits.push(res.finalProfit);
      drawdowns.push(res.maxDrawdown);
      sharpes.push(res.sharpe);
      sortinos.push(res.sortino);
    }

    self.postMessage({ 
      type: 'complete', 
      data: { 
        profits: profits, 
        drawdowns: drawdowns,
        sharpes: sharpes,
        sortinos: sortinos
      } 
    });
    return;
  }

  // ✅ BOOTSTRAP RESAMPLING: Random sample WITH REPLACEMENT
  for (var i = 0; i < numSimulations; i++) {
    var sampleProfits = [];
    for (var j = 0; j < n; j++) {
      var randomIndex = Math.floor(Math.random() * trades.length);
      sampleProfits.push(trades[randomIndex].profit);
    }

    var res = calculatePathMetrics(sampleProfits);
    profits.push(res.finalProfit);
    drawdowns.push(res.maxDrawdown);
    sharpes.push(res.sharpe);
    sortinos.push(res.sortino);

    // Progress every 100 simulations
    if ((i + 1) % 100 === 0) {
      self.postMessage({ type: 'progress', current: i + 1, total: numSimulations });
    }
  }

  self.postMessage({ 
    type: 'complete', 
    data: { 
      profits: profits, 
      drawdowns: drawdowns,
      sharpes: sharpes,
      sortinos: sortinos
    } 
  });
});
