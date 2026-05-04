/**
 * Monte Carlo Simulation Worker - OPTIMIZED FIXED VERSION
 * Implements proper Bootstrap Resampling with replacement.
 */

self.addEventListener('message', function (e) {
  var trades = e.data.trades;
  var numSimulations = e.data.numSimulations;
  var sampleSize = e.data.sampleSize;
  var shuffle = e.data.shuffle;

  var profits = [];
  var drawdowns = [];

  var n = Math.min(sampleSize, trades.length);

  // ✅ OPTIMIZATION: If shuffle is false, run once and replicate
  if (!shuffle) {
    var equity = 0;
    var maxEquity = 0;
    var maxDrawdown = 0;
    var sample = trades.slice(0, n);

    for (var k = 0; k < sample.length; k++) {
      equity += sample[k].profit;
      if (equity > maxEquity) maxEquity = equity;
      var dd = maxEquity - equity;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    for (var i = 0; i < numSimulations; i++) {
      profits.push(equity);
      drawdowns.push(maxDrawdown);
    }

    self.postMessage({ type: 'complete', data: { profits: profits, drawdowns: drawdowns } });
    return;
  }

  // ✅ BOOTSTRAP RESAMPLING: Random sample WITH REPLACEMENT
  function bootstrapSample(array, size) {
    var sample = [];
    for (var i = 0; i < size; i++) {
      var randomIndex = Math.floor(Math.random() * array.length);
      sample.push(array[randomIndex]);
    }
    return sample;
  }

  for (var i = 0; i < numSimulations; i++) {
    var sample = bootstrapSample(trades, n);

    var equity = 0;
    var maxEquity = 0;
    var maxDrawdown = 0;

    for (var k = 0; k < sample.length; k++) {
      equity += sample[k].profit;
      if (equity > maxEquity) maxEquity = equity;
      var dd = maxEquity - equity;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    profits.push(equity);
    drawdowns.push(maxDrawdown);

    // Progress every 100 simulations
    if ((i + 1) % 100 === 0) {
      self.postMessage({ type: 'progress', current: i + 1, total: numSimulations });
    }
  }

  self.postMessage({ type: 'complete', data: { profits: profits, drawdowns: drawdowns } });
});
