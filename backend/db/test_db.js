const db = require('./index');
db.initialize();

const hospitals = db.query('SELECT * FROM hospitals');
console.log('Hospitals:', hospitals.length);
console.log(hospitals[0]);

const protocols = db.query('SELECT name, status FROM protocols');
console.log('Protocols:', protocols.length);
protocols.forEach(p => console.log(' -', p.name, ':', p.status));

const metrics = db.query('SELECT COUNT(*) as count FROM operational_metrics');
console.log('Metrics rows:', metrics[0].count);

const beds = db.query('SELECT department, total_beds, occupied_beds FROM bed_status ORDER BY department');
console.log('Bed status:');
beds.forEach(b => console.log(' -', b.department, ':', b.occupied_beds + '/' + b.total_beds));

const alerts = db.query('SELECT severity, title, status FROM alerts');
console.log('Alerts:', alerts.length);
alerts.forEach(a => console.log(' -', '[' + a.severity + ']', a.title, '(' + a.status + ')'));

db.close();
console.log('\nAll tables verified successfully!');
