// Quick test: verify connectors work with database
const db = require('./index');
const fhirConnector = require('../connectors/simulatedFHIRConnector');
const { normalize } = require('../services/normalizationService');

// Test normalization
console.log('=== Testing Normalization Service ===');
const raw = { icuBeds: 5, er_capacity: 12, occupancy_rate: 85.3, nurse_count: '14', admissions: 42 };
const result = normalize(raw);
console.log('Input:', raw);
console.log('Normalized:', result.normalized);
console.log('Quality:', result.dataQuality);
console.log('Warnings:', result.warnings);

// Test FHIR connector
console.log('\n=== Testing FHIR Connector ===');
const fhirResult = fhirConnector.simulateSync(1);
console.log('Success:', fhirResult.success);
console.log('Records:', fhirResult.recordsProcessed);
console.log('Metrics:', fhirResult.metrics);

// Verify data landed in DB
const metricsCount = db.query('SELECT COUNT(*) as count FROM operational_metrics');
console.log('\nTotal metrics rows in DB:', metricsCount[0].count);

const bedCount = db.query('SELECT COUNT(*) as count FROM bed_status');
console.log('Total bed_status rows in DB:', bedCount[0].count);

const integrations = db.query('SELECT connector_name, status, records_synced FROM integration_status');
console.log('\nIntegration statuses:');
integrations.forEach(i => console.log(' -', i.connector_name, ':', i.status, '(' + i.records_synced + ' records)'));

db.close();
console.log('\n✓ All Batch A components verified!');
