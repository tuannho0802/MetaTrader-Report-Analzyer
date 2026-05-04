/**
 * Monte Carlo Simulation Worker
 * CRITICAL: Vanilla JS ONLY — no imports, no TypeScript, no ESM
 * Runs in a separate thread to prevent UI blocking.
 */

self.addEventListener('message', function (e) {
  var trades = e.data.trades;
  var numSimulations = e.data.numSimulations;
  var sampleSize = e.data.sampleSize;
  var shuffle = e.data.shuffle;

  var profits = [];
  var drawdowns = [];

  // Fisher-Yates shuffle (in-place on a copy)
  function shuffleArray(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  var n = Math.min(sampleSize, trades.length);

  for (var i = 0; i < numSimulations; i++) {
    var seq = shuffle ? shuffleArray(trades) : trades.slice();
    var sample = seq.slice(0, n);

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
