/**
 * SurgeWatch Notification Service
 * 
 * Sends automated operational alerts via email using Nodemailer.
 * Uses Ethereal (fake SMTP) for demo — captures emails for preview
 * without needing real SMTP credentials.
 * 
 * In production, replace Ethereal with real SMTP (Gmail, Outlook, hospital SMTP).
 */

const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null;

/**
 * Initialize the email transporter.
 * Uses Ethereal for demo — creates a test account automatically.
 */
async function initialize() {
    if (transporter) return transporter;

    try {
        // Create Ethereal test account (fake SMTP for demo)
        testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        console.log('[Notification] Ethereal email initialized.');
        console.log(`[Notification] Preview inbox: https://ethereal.email/login`);
        console.log(`[Notification] User: ${testAccount.user}`);
        return transporter;
    } catch (err) {
        console.warn('[Notification] Email setup failed:', err.message);
        return null;
    }
}

/**
 * Send a surge alert email.
 * 
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {object} options.data - Alert data (risk, forecast, protocols, etc.)
 * @returns {{ success: boolean, previewUrl: string }}
 */
async function sendAlert(options) {
    const transport = await initialize();
    if (!transport) {
        return { success: false, error: 'Email transport not available' };
    }

    const { to = 'admin@hospital.local', subject, data } = options;

    const html = buildAlertEmailHTML(data);

    try {
        const info = await transport.sendMail({
            from: '"SurgeWatch Intelligence" <alerts@surgewatch.io>',
            to,
            subject: subject || '[SurgeWatch Alert] Operational Intelligence Update',
            html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Notification] Email sent. Preview: ${previewUrl}`);

        return { success: true, messageId: info.messageId, previewUrl };
    } catch (err) {
        console.error('[Notification] Send failed:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Send a protocol activation alert.
 */
async function sendProtocolAlert(protocol) {
    const actions = typeof protocol.actions === 'string' ? JSON.parse(protocol.actions) : protocol.actions;

    return sendAlert({
        subject: `[SurgeWatch] Protocol Activated: ${protocol.name}`,
        data: {
            type: 'protocol',
            title: `Surge Protocol Activated: ${protocol.name}`,
            severity: 'HIGH',
            description: protocol.description,
            reason: protocol.last_trigger_reason || 'Manual activation',
            actions: actions || [],
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Send a risk escalation alert.
 */
async function sendRiskAlert(riskAssessment) {
    return sendAlert({
        subject: `[SurgeWatch] ${riskAssessment.level} Risk Alert — Score: ${riskAssessment.score}`,
        data: {
            type: 'risk',
            title: `${riskAssessment.level} Risk Alert`,
            severity: riskAssessment.level,
            score: riskAssessment.score,
            factors: riskAssessment.factors,
            occupancy: riskAssessment.occupancy,
            beds: riskAssessment.beds,
            timestamp: riskAssessment.timestamp
        }
    });
}

/**
 * Build a professional HTML email for alerts.
 */
function buildAlertEmailHTML(data) {
    const severityColors = {
        'LOW': '#10B981',
        'MODERATE': '#F59E0B',
        'HIGH': '#F97316',
        'CRITICAL': '#EF4444'
    };

    const color = severityColors[data.severity] || '#6366F1';

    let factorsHTML = '';
    if (data.factors && data.factors.length > 0) {
        factorsHTML = `
            <h3 style="color: #374151; margin-top: 20px;">Risk Factors</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #F9FAFB;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Factor</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Value</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Impact</th>
                </tr>
                ${data.factors.map(f => `
                    <tr>
                        <td style="padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6;">${f.factor}</td>
                        <td style="padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6;">${f.value}</td>
                        <td style="padding: 8px 12px; font-size: 13px; text-align: right; font-weight: bold; border-bottom: 1px solid #F3F4F6;">+${f.impact}</td>
                    </tr>
                `).join('')}
            </table>`;
    }

    let actionsHTML = '';
    if (data.actions && data.actions.length > 0) {
        actionsHTML = `
            <h3 style="color: #374151; margin-top: 20px;">Recommended Actions</h3>
            <ol style="padding-left: 20px;">
                ${data.actions.map(a => `<li style="margin-bottom: 6px; font-size: 13px; color: #4B5563;">${a}</li>`).join('')}
            </ol>`;
    }

    let bedsHTML = '';
    if (data.beds && data.beds.length > 0) {
        bedsHTML = `
            <h3 style="color: #374151; margin-top: 20px;">Bed Census</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #F9FAFB;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6B7280;">Department</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #6B7280;">Occupied</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #6B7280;">Total</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #6B7280;">Occupancy</th>
                </tr>
                ${data.beds.map(b => `
                    <tr>
                        <td style="padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6;">${b.department}</td>
                        <td style="padding: 8px 12px; font-size: 13px; text-align: center; border-bottom: 1px solid #F3F4F6;">${b.occupied}</td>
                        <td style="padding: 8px 12px; font-size: 13px; text-align: center; border-bottom: 1px solid #F3F4F6;">${b.total}</td>
                        <td style="padding: 8px 12px; font-size: 13px; text-align: right; font-weight: bold; color: ${b.occupancy > 85 ? '#EF4444' : '#10B981'}; border-bottom: 1px solid #F3F4F6;">${b.occupancy?.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </table>`;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1E1B4B, #312E81); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 20px;">⚡</span>
                </div>
                <div>
                    <h1 style="margin: 0; color: white; font-size: 18px;">SurgeWatch Alert</h1>
                    <p style="margin: 2px 0 0; color: #A5B4FC; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Hospital Operational Intelligence</p>
                </div>
            </div>
        </div>

        <!-- Alert Badge -->
        <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #E5E7EB; margin-bottom: 16px;">
            <div style="display: inline-block; background: ${color}15; color: ${color}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 6px; border: 1px solid ${color}30; margin-bottom: 12px;">
                ${data.severity} ${data.type === 'protocol' ? 'PROTOCOL' : 'ALERT'}
            </div>
            <h2 style="margin: 8px 0; color: #111827; font-size: 20px;">${data.title}</h2>
            ${data.description ? `<p style="color: #6B7280; font-size: 14px; margin: 8px 0;">${data.description}</p>` : ''}
            ${data.score !== undefined ? `<p style="color: #374151; font-size: 14px;"><strong>Risk Score:</strong> <span style="color: ${color}; font-weight: bold; font-size: 24px;">${data.score}</span> / 100</p>` : ''}
            ${data.occupancy !== undefined ? `<p style="color: #374151; font-size: 14px;"><strong>Overall Occupancy:</strong> ${data.occupancy}%</p>` : ''}
            ${data.reason ? `<p style="color: #374151; font-size: 14px;"><strong>Trigger:</strong> ${data.reason}</p>` : ''}
        </div>

        <!-- Dynamic Content -->
        <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #E5E7EB; margin-bottom: 16px;">
            ${factorsHTML}
            ${actionsHTML}
            ${bedsHTML}
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 11px;">
            <p>Generated at ${new Date(data.timestamp).toLocaleString()} by SurgeWatch Intelligence Engine</p>
            <p>Shivamogga District Hospital · Karnataka</p>
        </div>
    </body>
    </html>`;
}

module.exports = {
    initialize,
    sendAlert,
    sendProtocolAlert,
    sendRiskAlert
};
