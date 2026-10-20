// Webhook Oficial Cakto — NS Espanadores
// Recebe eventos order_approved / payment.approved da Cakto para conciliação automática

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const signature = req.headers['x-cakto-signature'] || req.headers['signature'];
    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (signature !== expected) {
        return res.status(401).json({ error: 'Assinatura de webhook inválida.' });
      }
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const event = payload.event || payload.type || 'unknown';
    const orderData = payload.data || payload;

    console.log(`[NS Espanadores Webhook Cakto] Evento: ${event}`, {
      id: orderData.id,
      status: orderData.status,
      amount: orderData.amount,
      customer: orderData.customer?.name,
      utm_content: orderData.utm_content || orderData.metadata?.summary,
    });

    return res.status(200).json({
      received: true,
      event,
      orderId: orderData.id || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[NS Espanadores Webhook Error]:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
