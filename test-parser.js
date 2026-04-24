const fs = require('fs');
const { parseHTMLStatement } = require('./lib/parser');
const html = fs.readFileSync('testReport.htm', 'utf8');
const result = parseHTMLStatement(html, { commentPattern: '', threshold: 0, startDate: new Date(0), endDate: new Date('2100-01-01'), filterMode: 'comment' });
console.log(result.startDate, result.endDate);
