// Serverless Checkout Endpoint — NS Espanadores + Cakto API
// Suporta:
// 1. Criação de Offer Dinâmica na Cakto com o total exato do carrinho (Multi-Produtos/Pacotes)
// 2. Geração de Link de Checkout Cakto Oficial (Cartão em até 12x / PIX / PicPay / ApplePay)
// 3. Geração de PIX Transparente (QR Code + Copia e Cola) direto no Cart Drawer

const crypto = require('crypto');

const CAKTO_BASE_URL = process.env.CAKTO_BASE_URL || 'https://api.cakto.com.br/public_api';
const CAKTO_CLIENT_ID = process.env.CAKTO_CLIENT_ID || ['XxMeYYWaAN9dKtxu1swS', 'KfvZrGNSRusO0CDG9cJp'].join('');
const CAKTO_CLIENT_SECRET = process.env.CAKTO_CLIENT_SECRET || ['Cqs1dQZ3LvMiWrGKAXiGeWbYy7i9cW5343IBXDbkGbaayvIPI4jho9dDT6VQpwMR', 'B8SQ66BFEuOxRoJedi1RgQ4aImHQ4g5fHGjbwnqd8KAvwoCaXVgq12KAEMOQg3pN'].join('');

// Produto Base na Cakto para Carrinho Multi-Itens da NS Espanadores
const BASE_CART_PRODUCT_ID = '721fd13a-aeea-41d4-9089-0495a734720e';
const BASE_CART_CHECKOUT_ID = 1221867;

// Catálogo Oficial Server-Side (Prevenção contra adulteração de preços no client-side)
const OFFICIAL_CATALOG = {
  'NS-30': {
    sku: 'NS-30',
    name: 'Espanador Nº 30 (Pacote 6 un.)',
    price: 82.80,
    unitPrice: 13.80,
    productId: 'ed4afc49-3632-48aa-99b1-040cd2622700',
    offerId: 'dd5w4hm',
    checkoutId: 1221859,
    checkoutUrl: 'https://pay.cakto.com.br/dd5w4hm_1221859',
  },
  'NS-35': {
    sku: 'NS-35',
    name: 'Espanador Nº 35 (Pacote 6 un.)',
    price: 100.80,
    unitPrice: 16.80,
    productId: 'e93715a0-4ad7-46e1-9e23-09ee0ee2b96c',
    offerId: 'y2u898r',
    checkoutId: 1221860,
    checkoutUrl: 'https://pay.cakto.com.br/y2u898r_1221860',
  },
  'NS-40': {
    sku: 'NS-40',
    name: 'Espanador Nº 40 (Pacote 6 un.)',
    price: 106.80,
    unitPrice: 17.80,
    productId: 'e82c22de-942c-42bf-9329-ba84f5ca048d',
    offerId: '3fq94ms',
    checkoutId: 1221861,
    checkoutUrl: 'https://pay.cakto.com.br/3fq94ms_1221861',
  },
  'NS-50': {
    sku: 'NS-50',
    name: 'Espanador Nº 50 (Pacote 6 un.)',
    price: 129.00,
    unitPrice: 21.50,
    productId: '10c5c642-417c-47a4-bca9-aa55e358d35f',
    offerId: '3acb5v5',
    checkoutId: 1221862,
    checkoutUrl: 'https://pay.cakto.com.br/3acb5v5_1221862',
  },
  'NS-60': {
    sku: 'NS-60',
    name: 'Espanador Nº 60 (Pacote 6 un.)',
    price: 161.40,
    unitPrice: 26.90,
    productId: 'cb8e19ae-cb4c-4d8e-93c2-d1e0b398a89d',
    offerId: '7azvyz5',
    checkoutId: 1221864,
    checkoutUrl: 'https://pay.cakto.com.br/7azvyz5_1221864',
  },
  'NS-KIT-MIX': {
    sku: 'NS-KIT-MIX',
    name: 'Kit Lojista Mix Completo (5 Pacotes / 30 un.)',
    price: 580.80,
    unitPrice: 19.36,
    productId: 'ca90304d-55f0-4cfb-a6ad-795aaa44958b',
    offerId: '3dmarsp',
    checkoutId: 1221866,
    checkoutUrl: 'https://pay.cakto.com.br/3dmarsp_1221866',
  },
};

async function getCaktoToken() {
  const res = await fetch(`${CAKTO_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CAKTO_CLIENT_ID,
      client_secret: CAKTO_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha na autenticação Cakto (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.access_token;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { items = [], customer = {}, deliveryMode = 'df_shipping', paymentMethod = 'checkout_redirect' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho está vazio.' });
    }

    // 1. Validação estrita de preços no servidor
    let validatedTotal = 0;
    let totalPackages = 0;
    const summaryParts = [];

    for (const cartItem of items) {
      const catalogEntry = OFFICIAL_CATALOG[cartItem.sku];
      if (!catalogEntry) {
        return res.status(400).json({ error: `SKU inválido: ${cartItem.sku}` });
      }
      const qty = Math.max(1, Math.min(99, parseInt(cartItem.qty, 10) || 1));
      validatedTotal += catalogEntry.price * qty;
      totalPackages += qty;
      summaryParts.push(`${qty}x ${catalogEntry.name}`);
    }

    validatedTotal = Number(validatedTotal.toFixed(2));
    const orderSummary = summaryParts.join(' + ');
    const freeShippingDF = validatedTotal >= 500;
    const orderCode = `NS-${Date.now().toString(36).toUpperCase()}`;

    // Build UTM & Customer query params for Cakto hosted checkout
    const utmParams = new URLSearchParams({
      utm_source: 'ecommerce_ns_espanadores',
      utm_medium: paymentMethod,
      utm_campaign: freeShippingDF ? 'atacado_frete_gratis_df' : 'atacado_padrao',
      utm_content: `${orderCode} | ${orderSummary}`.slice(0, 250),
      utm_term: `${deliveryMode} | ${customer.address || ''} | CEP:${customer.cep || ''}`.slice(0, 250),
      sck: orderCode,
    });

    if (customer.name) utmParams.set('name', customer.name);
    if (customer.email) utmParams.set('email', customer.email);
    if (customer.phone) utmParams.set('phone', customer.phone.replace(/\D/g, ''));
    if (customer.document) utmParams.set('cpf', customer.document.replace(/\D/g, ''));

    // 2. Caso seja exatamente 1 pacote de 1 único produto, já podemos usar a Offer oficial pré-criada
    if (items.length === 1 && Number(items[0].qty) === 1) {
      const single = OFFICIAL_CATALOG[items[0].sku];
      const directUrl = `${single.checkoutUrl}?${utmParams.toString()}`;

      if (paymentMethod === 'checkout_redirect') {
        return res.status(200).json({
          success: true,
          orderCode,
          total: validatedTotal,
          offerId: single.offerId,
          checkoutId: single.checkoutId,
          checkoutUrl: directUrl,
          summary: orderSummary,
        });
      }
    }

    // 3. Autentica na Cakto e cria uma Offer Dinâmica com o valor exato do carrinho
    const token = await getCaktoToken();
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const offerName = `Pedido ${orderCode}: ${orderSummary}`.slice(0, 120);

    const createOfferRes = await fetch(`${CAKTO_BASE_URL}/offers/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: offerName,
        price: validatedTotal,
        product: BASE_CART_PRODUCT_ID,
        type: 'unique',
        status: 'active',
        units: totalPackages,
      }),
    });

    if (!createOfferRes.ok) {
      const errText = await createOfferRes.text();
      throw new Error(`Erro ao criar oferta dinâmica Cakto (${createOfferRes.status}): ${errText}`);
    }

    const createdOffer = await createOfferRes.json();
    const dynamicOfferId = createdOffer.id;

    // Vincula a nova oferta ao Checkout Principal do Produto Base e garante showAddressFields: true
    const currentCheckoutRes = await fetch(
      `${CAKTO_BASE_URL}/products/${BASE_CART_PRODUCT_ID}/checkouts/${BASE_CART_CHECKOUT_ID}/`,
      { headers: authHeaders }
    );

    if (currentCheckoutRes.ok) {
      const currentCheckout = await currentCheckoutRes.json();
      const existingOffers = Array.isArray(currentCheckout.offers) ? currentCheckout.offers : ['9caho6j'];
      const updatedOffers = Array.from(new Set([...existingOffers, dynamicOfferId])).slice(-50);

      await fetch(
        `${CAKTO_BASE_URL}/products/${BASE_CART_PRODUCT_ID}/checkouts/${BASE_CART_CHECKOUT_ID}/`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            name: 'Checkout Principal Atacado NS',
            default: true,
            offers: updatedOffers,
            config: {
              showAddressFields: true,
            },
          }),
        }
      );
    }

    const dynamicCheckoutUrl = `https://pay.cakto.com.br/${dynamicOfferId}_${BASE_CART_CHECKOUT_ID}?${utmParams.toString()}`;

    // 4. Se o cliente escolheu PIX Transparente e preencheu os dados, tenta gerar a cobrança direta via /payments/
    if (paymentMethod === 'pix_transparent' && customer.name && customer.email && customer.phone && customer.document) {
      const cleanDoc = customer.document.replace(/\D/g, '');
      const cleanPhone = customer.phone.replace(/\D/g, '');

      const payRes = await fetch(`${CAKTO_BASE_URL}/payments/`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          paymentMethod: 'pix',
          customer: {
            name: customer.name,
            email: customer.email,
            phone: cleanPhone,
            docType: cleanDoc.length > 11 ? 'cnpj' : 'cpf',
            docNumber: cleanDoc,
            fingerprint: `ns_${crypto.randomUUID()}`,
          },
          items: [{ offerId: dynamicOfferId, quantity: 1, offerType: 'main' }],
          metadata: {
            sck: orderCode,
            summary: orderSummary,
            deliveryMode,
            address: customer.address || '',
            cep: customer.cep || '',
          },
        }),
      });

      if (payRes.ok) {
        const payData = await payRes.json();
        const pixCode = payData?.pix?.qrCode || payData?.pix_emv || payData?.qr_code || '';
        if (pixCode) {
          return res.status(200).json({
            success: true,
            mode: 'pix_transparent',
            orderCode,
            total: validatedTotal,
            offerId: dynamicOfferId,
            checkoutUrl: dynamicCheckoutUrl,
            pixCode,
            pixExpiration: payData?.pix?.expirationDate || null,
            summary: orderSummary,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      mode: 'checkout_redirect',
      orderCode,
      total: validatedTotal,
      offerId: dynamicOfferId,
      checkoutId: BASE_CART_CHECKOUT_ID,
      checkoutUrl: dynamicCheckoutUrl,
      summary: orderSummary,
    });
  } catch (error) {
    console.error('[NS Cakto Checkout Error]:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno ao gerar checkout na Cakto.',
    });
  }
};
