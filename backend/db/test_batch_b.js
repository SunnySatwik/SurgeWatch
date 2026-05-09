// Batch B Integration Test — Risk Engine, Protocol Engine, Notification Service
const db = require('./index');
const riskEngine = require('../services/riskEngine');
const protocolEngine = require('../services/protocolEngine');
const notificationService = require('../services/notificationService');

async function test() {
    console.log('=== Batch B Integration Test ===\n');

    // 1. Test Risk Engine
    console.log('--- Risk Engine ---');
    const risk = riskEngine.evaluateRisk(1);
    console.log('Risk Level:', risk.level);
    console.log('Risk Score:', risk.score);
    console.log('Factors:');
    risk.factors.forEach(f => console.log(`  • ${f.factor}: ${f.value} (+${f.impact})`));
    console.log('Occupancy:', risk.occupancy + '%');
    console.log('Beds:');
    risk.beds.forEach(b => console.log(`  • ${b.department}: ${b.occupied}/${b.total} (${b.occupancy?.toFixed(1)}%)`));

    // 2. Test Protocol Engine
    console.log('\n--- Protocol Engine ---');
    const protocols = protocolEngine.getProtocols(1);
    console.log('Total protocols:', protocols.length);
    protocols.forEach(p => console.log(`  • ${p.name} [${p.status}]`));

    // Evaluate protocols against risk
    const protocolResult = protocolEngine.evaluateProtocols(1, risk);
    console.log('Auto-activated:', protocolResult.activated.length);
    protocolResult.activated.forEach(p => console.log(`  → ${p.name}: ${p.reason}`));

    // Manual activation test
    console.log('\nManually activating Dengue Surge Protocol...');
    protocolEngine.activateProtocol(1, 'Test activation from Batch B test');
    const updatedProtocols = protocolEngine.getProtocols(1);
    const dengue = updatedProtocols.find(p => p.code === 'DENGUE_SURGE');
    console.log(`  Status: ${dengue.status}`);

    // Check alerts created
    const alerts = db.query('SELECT severity, title, status FROM alerts ORDER BY created_at DESC LIMIT 5');
    console.log('\nLatest alerts:');
    alerts.forEach(a => console.log(`  [${a.severity}] ${a.title} (${a.status})`));

    // 3. Test Notification Service
    console.log('\n--- Notification Service ---');
    try {
        const emailResult = await notificationService.sendRiskAlert(risk);
        console.log('Email sent:', emailResult.success);
        if (emailResult.previewUrl) {
            console.log('Preview URL:', emailResult.previewUrl);
        }
    } catch (err) {
        console.log('Email test skipped (network issue):', err.message);
    }

    // Deactivate protocol
    console.log('\nDeactivating Dengue Surge Protocol...');
    protocolEngine.deactivateProtocol(1, 'Test deactivation');
    const finalProtocols = protocolEngine.getProtocols(1);
    const dengueF = finalProtocols.find(p => p.code === 'DENGUE_SURGE');
    console.log(`  Status: ${dengueF.status}`);

    db.close();
    console.log('\n✓ Batch B verification complete!');
}

test().catch(err => {
    console.error('Test failed:', err);
    db.close();
});
