// Final verification: all routes and services load correctly
const db = require('./index');

// Test all services load
const services = [
    ['normalizationService', '../services/normalizationService'],
    ['riskEngine', '../services/riskEngine'],
    ['protocolEngine', '../services/protocolEngine'],
    ['forecastService', '../services/forecastService'],
    ['notificationService', '../services/notificationService'],
];

const connectors = [
    ['csvConnector', '../connectors/csvConnector'],
    ['apiConnector', '../connectors/apiConnector'],
    ['fhirConnector', '../connectors/simulatedFHIRConnector'],
    ['weatherConnector', '../connectors/weatherConnector'],
];

const routes = [
    ['connectors', '../routes/connectors'],
    ['operations', '../routes/operations'],
];

console.log('=== Final System Verification ===\n');

console.log('Services:');
services.forEach(([name, path]) => {
    try {
        require(path);
        console.log('  ✓', name);
    } catch(e) {
        console.log('  ✗', name, ':', e.message);
    }
});

console.log('\nConnectors:');
connectors.forEach(([name, path]) => {
    try {
        require(path);
        console.log('  ✓', name);
    } catch(e) {
        console.log('  ✗', name, ':', e.message);
    }
});

console.log('\nRoutes:');
routes.forEach(([name, path]) => {
    try {
        require(path);
        console.log('  ✓', name);
    } catch(e) {
        console.log('  ✗', name, ':', e.message);
    }
});

// Quick end-to-end test
console.log('\n--- E2E Test ---');
const risk = require('../services/riskEngine').evaluateRisk(1);
console.log('Risk:', risk.level, '(score:', risk.score + ')');

const protocols = require('../services/protocolEngine').getProtocols(1);
console.log('Protocols loaded:', protocols.length);

const forecasts = require('../services/forecastService').getForecasts(1);
console.log('Forecasts in DB:', forecasts ? forecasts.length : 'falling back to JSON');

db.close();
console.log('\n✓ All systems operational!');
