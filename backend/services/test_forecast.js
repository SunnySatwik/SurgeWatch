const { runPrediction } = require('./forecastService');

console.log("Testing backend forecast service bridge...");
const result = runPrediction(1);
console.log(JSON.stringify(result, null, 2));
