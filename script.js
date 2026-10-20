// NS Espanadores — E-commerce Engine & Cakto Checkout Integration
(function () {
    const FREE_SHIPPING_THRESHOLD_DF = 500.0;
    const STORAGE_KEY_CART = 'ns_espanadores_cart_v2';
    const STORAGE_KEY_CUSTOMER = 'ns_espanadores_customer_v2';

    // Catálogo Oficial mapeado com os Produtos e Ofertas Reais criados na Cakto API
    const CATALOG = {
        'NS-30': {
            sku: 'NS-30',
            name: 'Espanador Nº 30 (Pacote 6 un.)',
            shortName: 'Pacote Nº 30 (6 un.)',
            unitPrice: 13.80,
            price: 82.80,
            unitsPerPack: 6,
            image: './images/numero_30.jpeg',
            category: 'compacto',
            description: 'Confeccionado em pena de avestruz importada padronizada. Tamanho compacto e ágil, ideal para rotina diária, escritórios, painéis automotivos e limpeza delicada.',
            productId: 'ed4afc49-3632-48aa-99b1-040cd2622700',
            offerId: 'dd5w4hm',
            checkoutId: 1221859,
            checkoutUrl: 'https://pay.cakto.com.br/dd5w4hm_1221859'
        },
        'NS-35': {
            sku: 'NS-35',
            name: 'Espanador Nº 35 (Pacote 6 un.)',
            shortName: 'Pacote Nº 35 (6 un.)',
            unitPrice: 16.80,
            price: 100.80,
            unitsPerPack: 6,
            image: './images/numero_35.jpeg',
            category: 'compacto',
            description: 'Excelente equilíbrio entre alcance e leveza. Plumas importadas selecionadas para móveis de porte médio, estantes, balcões comerciais e uso residencial.',
            productId: 'e93715a0-4ad7-46e1-9e23-09ee0ee2b96c',
            offerId: 'y2u898r',
            checkoutId: 1221860,
            checkoutUrl: 'https://pay.cakto.com.br/y2u898r_1221860'
        },
        'NS-40': {
            sku: 'NS-40',
            name: 'Espanador Nº 40 (Pacote 6 un.)',
            shortName: 'Pacote Nº 40 (6 un.)',
            unitPrice: 17.80,
            price: 106.80,
            unitsPerPack: 6,
            image: './images/numero_40.jpeg',
            category: 'profissional',
            description: 'O campeão absoluto de vendas para lojistas e atacadistas. Alta versatilidade e giro rápido no varejo, com volume superior de plumas importadas.',
            productId: 'e82c22de-942c-42bf-9329-ba84f5ca048d',
            offerId: '3fq94ms',
            checkoutId: 1221861,
            checkoutUrl: 'https://pay.cakto.com.br/3fq94ms_1221861'
        },
        'NS-50': {
            sku: 'NS-50',
            name: 'Espanador Nº 50 (Pacote 6 un.)',
            shortName: 'Pacote Nº 50 (6 un.)',
            unitPrice: 21.50,
            price: 129.00,
            unitsPerPack: 6,
            image: './images/numero_50.jpeg',
            category: 'profissional',
            description: 'Tamanho excepcional para limpeza rápida de grandes superfícies, vitrines, concessionárias e ambientes amplos.',
            productId: '10c5c642-417c-47a4-bca9-aa55e358d35f',
            offerId: '3acb5v5',
            checkoutId: 1221862,
            checkoutUrl: 'https://pay.cakto.com.br/3acb5v5_1221862'
        },
        'NS-60': {
            sku: 'NS-60',
            name: 'Espanador Nº 60 (Pacote 6 un.)',
            shortName: 'Pacote Nº 60 (6 un.)',
            unitPrice: 26.90,
            price: 161.40,
            unitsPerPack: 6,
            image: './images/numero_60.jpeg',
            category: 'profissional',
            description: 'Linha pesada de alto desempenho. Perfeito para áreas amplas, locais altos e uso profissional exigente.',
            productId: 'cb8e19ae-cb4c-4d8e-93c2-d1e0b398a89d',
            offerId: '7azvyz5',
            checkoutId: 1221864,
            checkoutUrl: 'https://pay.cakto.com.br/7azvyz5_1221864'
        },
        'NS-KIT-MIX': {
            sku: 'NS-KIT-MIX',
            name: 'Kit Mix Lojista Completo (5 Pacotes / 30 un.)',
            shortName: 'Kit Mix 5 Pacotes (30 un.)',
            unitPrice: 19.36,
            price: 580.80,
            unitsPerPack: 30,
            image: './images/espanador_12.jpeg',
            category: 'kit',
            description: 'Grade fechada com 5 pacotes (1x Nº 30, 1x Nº 35, 1x Nº 40, 1x Nº 50 e 1x Nº 60), totalizando 30 espanadores com Frete Grátis no DF incluso.',
            productId: 'ca90304d-55f0-4cfb-a6ad-795aaa44958b',
            offerId: '3dmarsp',
            checkoutId: 1221866,
            checkoutUrl: 'https://pay.cakto.com.br/3dmarsp_1221866'
        }
    };

    let cart = [];
    let currentCartStep = 'items';

    function formatBRL(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function loadCart() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CART);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    cart = parsed.filter((item) => CATALOG[item.sku] && item.qty > 0);
                }
            }
        } catch (err) {
            console.warn('Erro ao carregar carrinho:', err);
            cart = [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
        } catch (err) {
            console.warn('Erro ao salvar carrinho:', err);
        }
        renderCartUI();
    }

    function getCartTotals() {
        let totalAmount = 0;
        let totalPacks = 0;
        let totalUnits = 0;

        cart.forEach((item) => {
            const prod = CATALOG[item.sku];
            if (!prod) return;
            totalAmount += prod.price * item.qty;
            totalPacks += item.qty;
            totalUnits += prod.unitsPerPack * item.qty;
        });

        return {
            totalAmount: Number(totalAmount.toFixed(2)),
            totalPacks,
            totalUnits,
            hasFreeShippingDF: totalAmount >= FREE_SHIPPING_THRESHOLD_DF,
            missingForFreeShipping: Math.max(0, Number((FREE_SHIPPING_THRESHOLD_DF - totalAmount).toFixed(2)))
        };
    }

    // Card Quantity Controls
    function changeCardQty(sku, delta) {
        const input = document.getElementById(`qty-input-${sku}`);
        const priceDisplay = document.getElementById(`price-display-${sku}`);
        const unitsDisplay = document.getElementById(`units-display-${sku}`);
        const prod = CATALOG[sku];
        if (!input || !prod) return;

        let nextQty = (parseInt(input.value, 10) || 1) + delta;
        if (nextQty < 1) nextQty = 1;
        if (nextQty > 99) nextQty = 99;
        input.value = nextQty;

        if (priceDisplay) {
            priceDisplay.textContent = formatBRL(prod.price * nextQty);
        }
        if (unitsDisplay) {
            const units = prod.unitsPerPack * nextQty;
            unitsDisplay.textContent = `${nextQty > 1 ? `${nextQty} pcts • ` : ''}${units} unidades`;
        }
    }

    function addToCartFromCard(sku) {
        const input = document.getElementById(`qty-input-${sku}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        addToCart(sku, qty, true);

        // Optimistic button feedback
        const btn = document.getElementById(`add-btn-${sku}`);
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '<i class="ph-bold ph-check"></i> Adicionado!';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = originalHTML;
            }, 1200);
        }
    }

    function addToCart(sku, qty = 1, openDrawerAfter = true) {
        const prod = CATALOG[sku];
        if (!prod) return;

        const existing = cart.find((i) => i.sku === sku);
        if (existing) {
            existing.qty = Math.min(99, existing.qty + qty);
        } else {
            cart.push({ sku, qty: Math.max(1, qty) });
        }

        saveCart();
        if (openDrawerAfter) {
            setCartStep('items');
            openCart();
        }
    }

    function updateCartItemQty(sku, delta) {
        const idx = cart.findIndex((i) => i.sku === sku);
        if (idx === -1) return;

        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
        }
        saveCart();
    }

    function removeCartItem(sku) {
        cart = cart.filter((i) => i.sku !== sku);
        saveCart();
    }

    function clearCart() {
        cart = [];
        saveCart();
        setCartStep('items');
    }

    // Buy Now 1-Click via Cakto
    function buyNowFromCard(sku) {
        const input = document.getElementById(`qty-input-${sku}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        buyNowDirect(sku, qty);
    }

    function buyNowDirect(sku, qty = 1) {
        const prod = CATALOG[sku];
        if (!prod) return;

        // Se for 1 pacote único, abre imediatamente o Checkout Cakto Oficial daquele produto com rastreio UTM
        if (qty === 1) {
            const utm = new URLSearchParams({
                utm_source: 'ecommerce_ns_espanadores',
                utm_medium: 'buy_now_1click',
                utm_campaign: prod.price >= 500 ? 'atacado_frete_gratis_df' : 'atacado_unitario',
                utm_content: `1x ${prod.name}`
            });
            window.open(`${prod.checkoutUrl}?${utm.toString()}`, '_blank', 'noopener');
            return;
        }

        // Se selecionou múltiplos pacotes no card, adiciona ao carrinho e já abre direto na etapa de Checkout Cakto
        const existing = cart.find((i) => i.sku === sku);
        if (existing) {
            existing.qty = qty;
        } else {
            cart.push({ sku, qty });
        }
        saveCart();
        setCartStep('checkout');
        openCart();
    }

    function openCart() {
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCart() {
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    function setCartStep(step) {
        currentCartStep = step;
        const stepItems = document.getElementById('cartStepItems');
        const stepCheckout = document.getElementById('cartStepCheckout');
        const stepPix = document.getElementById('cartStepPixResult');
        const footer = document.getElementById('cartDrawerFooter');

        if (stepItems) stepItems.style.display = step === 'items' ? 'block' : 'none';
        if (stepCheckout) stepCheckout.style.display = step === 'checkout' ? 'block' : 'none';
        if (stepPix) stepPix.style.display = step === 'pix' ? 'block' : 'none';
        if (footer) footer.style.display = step === 'items' && cart.length > 0 ? 'block' : 'none';

        if (step === 'checkout') {
            renderCheckoutMiniSummary();
        }
    }

    function renderCheckoutMiniSummary() {
        const box = document.getElementById('checkoutMiniSummary');
        if (!box) return;
        const totals = getCartTotals();
        const itemsText = cart
            .map((i) => `${i.qty}x ${CATALOG[i.sku]?.shortName}`)
            .join(' + ');

        box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong>Resumo (${totals.totalPacks} pct / ${totals.totalUnits} un.)</strong>
                <strong style="color:#059669;font-size:1rem;">${formatBRL(totals.totalAmount)}</strong>
            </div>
            <div style="color:#475569;font-size:0.78rem;">${itemsText}</div>
        `;
    }

    function renderCartUI() {
        const totals = getCartTotals();

        // Header & Floating Bar counters
        const headerCount = document.getElementById('headerCartCount');
        const headerTotal = document.getElementById('headerCartTotal');
        const floatingBar = document.getElementById('floatingCartBar');
        const floatingCount = document.getElementById('floatingCartCount');
        const floatingTotal = document.getElementById('floatingCartTotal');

        if (headerCount) headerCount.textContent = String(totals.totalPacks);
        if (headerTotal) headerTotal.textContent = formatBRL(totals.totalAmount);

        if (floatingBar) {
            if (totals.totalPacks > 0) {
                floatingBar.classList.add('visible');
                if (floatingCount) floatingCount.textContent = `${totals.totalPacks} ${totals.totalPacks === 1 ? 'pacote' : 'pacotes'} (${totals.totalUnits} un.)`;
                if (floatingTotal) floatingTotal.textContent = formatBRL(totals.totalAmount);
            } else {
                floatingBar.classList.remove('visible');
            }
        }

        // Free Shipping Progress Bar
        const freeText = document.getElementById('freeShippingText');
        const freeFill = document.getElementById('freeShippingFill');
        const pct = Math.min(100, Math.round((totals.totalAmount / FREE_SHIPPING_THRESHOLD_DF) * 100));

        if (freeFill) freeFill.style.width = `${pct}%`;
        if (freeText) {
            if (totals.hasFreeShippingDF) {
                freeText.innerHTML = `🎉 <strong>PARABÉNS!</strong> Você garantiu <strong>FRETE GRÁTIS no Distrito Federal!</strong>`;
            } else if (totals.totalAmount === 0) {
                freeText.innerHTML = `Pedidos acima de <strong>R$ 500,00</strong> ganham <strong>FRETE GRÁTIS no DF!</strong>`;
            } else {
                freeText.innerHTML = `Faltam apenas <strong>${formatBRL(totals.missingForFreeShipping)}</strong> para ganhar <strong>FRETE GRÁTIS no DF!</strong>`;
            }
        }

        // Items List inside Drawer
        const listEl = document.getElementById('cartItemsList');
        const upsellEl = document.getElementById('cartUpsellBox');
        const footerEl = document.getElementById('cartDrawerFooter');

        if (!listEl) return;

        if (cart.length === 0) {
            listEl.innerHTML = `
                <div class="cart-empty-state">
                    <i class="ph-duotone ph-shopping-bag-open"></i>
                    <h4>Seu carrinho de atacado está vazio</h4>
                    <p style="font-size:0.85rem;margin:0.5rem 0 1.25rem;">Escolha os pacotes de 6 unidades no catálogo ou adicione o Kit Mix Lojista com Frete Grátis DF.</p>
                    <button type="button" class="btn btn-primary" onclick="window.NSEcommerce.addToCart('NS-40', 1, false)">
                        <i class="ph-bold ph-plus"></i> Adicionar Campeão Nº 40 (R$ 106,80)
                    </button>
                </div>
            `;
            if (upsellEl) upsellEl.style.display = 'none';
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        listEl.innerHTML = cart
            .map((item) => {
                const prod = CATALOG[item.sku];
                const lineTotal = prod.price * item.qty;
                const lineUnits = prod.unitsPerPack * item.qty;
                return `
                    <div class="cart-item-row">
                        <img src="${prod.image}" alt="${prod.name}">
                        <div class="cart-item-info">
                            <h4>${prod.shortName}</h4>
                            <span class="cart-item-sub">${formatBRL(prod.price)}/pct • Total: ${lineUnits} un.</span>
                            <div class="cart-item-controls">
                                <button type="button" onclick="window.NSEcommerce.updateCartItemQty('${prod.sku}', -1)" aria-label="Diminuir">−</button>
                                <span>${item.qty}</span>
                                <button type="button" onclick="window.NSEcommerce.updateCartItemQty('${prod.sku}', 1)" aria-label="Aumentar">+</button>
                            </div>
                        </div>
                        <div class="cart-item-right">
                            <strong>${formatBRL(lineTotal)}</strong>
                            <button type="button" class="cart-item-remove" onclick="window.NSEcommerce.removeCartItem('${prod.sku}')">
                                <i class="ph ph-trash"></i> Remover
                            </button>
                        </div>
                    </div>
                `;
            })
            .join('');

        // Smart Upsell if missing Free Shipping DF
        if (upsellEl) {
            if (!totals.hasFreeShippingDF && totals.missingForFreeShipping > 0) {
                upsellEl.style.display = 'flex';
                upsellEl.innerHTML = `
                    <div>
                        <strong>💡 Dica de Lojista:</strong> Complete R$ 500,00 para destravar <strong>Entrega Grátis no DF</strong>!
                    </div>
                    <button type="button" onclick="window.NSEcommerce.addToCart('NS-40', 1, false)">
                        +1 Pct Nº 40 (${formatBRL(106.80)})
                    </button>
                `;
            } else {
                upsellEl.style.display = 'none';
            }
        }

        // Footer totals
        if (footerEl && currentCartStep === 'items') {
            footerEl.style.display = 'block';
        }
        const footerPacks = document.getElementById('footerTotalPacks');
        const footerShipping = document.getElementById('footerShippingStatus');
        const footerGrand = document.getElementById('footerGrandTotal');

        if (footerPacks) footerPacks.textContent = `${totals.totalPacks} ${totals.totalPacks === 1 ? 'pacote' : 'pacotes'} (${totals.totalUnits} unidades)`;
        if (footerShipping) {
            footerShipping.innerHTML = totals.hasFreeShippingDF
                ? '<span style="color:#059669;">GRÁTIS NO DF ✓</span>'
                : 'Grátis no DF acima de R$ 500';
        }
        if (footerGrand) footerGrand.textContent = formatBRL(totals.totalAmount);
    }

    // Input Masks & ViaCEP
    function maskPhone(v) {
        const d = v.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    }

    function maskDoc(v) {
        const d = v.replace(/\D/g, '').slice(0, 14);
        if (d.length <= 11) {
            return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        }
        return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }

    function maskCep(v) {
        const d = v.replace(/\D/g, '').slice(0, 8);
        return d.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    }

    async function lookupCep(cepValue) {
        const cleanCep = (cepValue || '').replace(/\D/g, '');
        if (cleanCep.length !== 8) return;
        const addrInput = document.getElementById('custAddress');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await res.json();
            if (!data.erro && addrInput) {
                addrInput.value = `${data.logradouro || ''}, ${data.bairro || ''} - ${data.localidade || ''}/${data.uf || ''}`.replace(/^,\s*/, '');
            }
        } catch {
            // Silent ignore if offline
        }
    }

    function updateShippingUI() {
        const mode = document.getElementById('deliveryMode')?.value;
        const addrContainer = document.getElementById('addressFieldsContainer');
        if (addrContainer) {
            addrContainer.style.display = mode === 'RETIRADA' ? 'none' : 'block';
        }
    }

    function updatePaymentMethodUI() {
        const selected = document.querySelector('input[name="caktoPaymentMethod"]:checked')?.value;
        const optRedirect = document.getElementById('pmOptionRedirect');
        const optPix = document.getElementById('pmOptionPix');
        const btnText = document.getElementById('submitCaktoBtnText');

        if (optRedirect) optRedirect.classList.toggle('active', selected === 'checkout_redirect');
        if (optPix) optPix.classList.toggle('active', selected === 'pix_transparent');
        if (btnText) {
            btnText.textContent = selected === 'pix_transparent'
                ? 'Gerar QR Code PIX via Cakto'
                : 'Ir para Pagamento Seguro Cakto';
        }
    }

    // Submit Checkout to Cakto
    async function submitCaktoCheckout(e) {
        e.preventDefault();
        if (cart.length === 0) return;

        const name = document.getElementById('custName')?.value.trim() || '';
        const phone = document.getElementById('custPhone')?.value.trim() || '';
        const documentNum = document.getElementById('custDoc')?.value.trim() || '';
        const email = document.getElementById('custEmail')?.value.trim() || '';
        const deliveryMode = document.getElementById('deliveryMode')?.value || 'DF_ENTREGA';
        const cep = document.getElementById('custCep')?.value.trim() || '';
        const number = document.getElementById('custNumber')?.value.trim() || '';
        const address = document.getElementById('custAddress')?.value.trim() || '';
        const paymentMethod = document.querySelector('input[name="caktoPaymentMethod"]:checked')?.value || 'checkout_redirect';

        const fullAddress = deliveryMode === 'RETIRADA'
            ? 'Retirada Direta com NS Espanadores'
            : `${address}, Nº ${number} (CEP: ${cep})`;

        // Save customer data locally for convenience
        try {
            localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify({ name, phone, documentNum, email, cep, number, address }));
        } catch { /* ignore */ }

        const submitBtn = document.getElementById('submitCaktoBtn');
        const submitBtnText = document.getElementById('submitCaktoBtnText');
        const errorBox = document.getElementById('checkoutErrorBox');

        if (errorBox) errorBox.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'Conectando à Cakto...';

        const payload = {
            items: cart.map((i) => ({ sku: i.sku, qty: i.qty })),
            customer: {
                name,
                phone,
                document: documentNum,
                email,
                cep,
                address: fullAddress
            },
            deliveryMode,
            paymentMethod
        };

        const endpoints = ['/api/checkout', 'https://ns-espanadores-kelevra.vercel.app/api/checkout', 'https://ns-espanadores.vercel.app/api/checkout'];

        try {
            for (const ep of endpoints) {
                try {
                    const response = await fetch(ep, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.mode === 'pix_transparent' && data.pixCode) {
                            showPixResult(data);
                            return;
                        }

                        if (data.checkoutUrl) {
                            window.location.href = data.checkoutUrl;
                            return;
                        }
                    }
                } catch {
                    // Tenta o próximo endpoint
                }
            }
        } catch (err) {
            console.warn('API local/serverless indisponível, acionando fallback direto Cakto:', err);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            updatePaymentMethodUI();
        }

        // Fallback estático direto para o Checkout Cakto (caso hospedado em ambiente puramente estático como GitHub Pages)
        const totals = getCartTotals();
        const summary = cart.map((i) => `${i.qty}x ${CATALOG[i.sku]?.shortName}`).join(' + ');
        const primaryItem = CATALOG[cart[0].sku] || CATALOG['NS-40'];
        const targetBaseUrl = cart.length === 1 && cart[0].qty === 1
            ? primaryItem.checkoutUrl
            : totals.totalAmount >= 550
                ? CATALOG['NS-KIT-MIX'].checkoutUrl
                : primaryItem.checkoutUrl;

        const utmParams = new URLSearchParams({
            utm_source: 'ecommerce_ns_espanadores',
            utm_medium: 'static_fallback',
            utm_content: summary.slice(0, 240),
            utm_term: `${deliveryMode} | ${fullAddress}`.slice(0, 240),
            name,
            email,
            phone: phone.replace(/\D/g, ''),
            cpf: documentNum.replace(/\D/g, '')
        });

        window.location.href = `${targetBaseUrl}?${utmParams.toString()}`;
    }

    function showPixResult(data) {
        setCartStep('pix');
        const summaryEl = document.getElementById('pixOrderSummaryText');
        const qrImg = document.getElementById('pixQrImg');
        const copyTextarea = document.getElementById('pixCopyTextarea');
        const fallbackLink = document.getElementById('pixFallbackCheckoutLink');

        if (summaryEl) {
            summaryEl.innerHTML = `Pedido <strong>${data.orderCode}</strong> • Valor: <strong>${formatBRL(data.total)}</strong><br><small>${data.summary}</small>`;
        }
        if (qrImg) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.pixCode)}`;
        }
        if (copyTextarea) {
            copyTextarea.value = data.pixCode;
        }
        if (fallbackLink && data.checkoutUrl) {
            fallbackLink.href = data.checkoutUrl;
        }
    }

    async function copyPixCode() {
        const copyTextarea = document.getElementById('pixCopyTextarea');
        const btnText = document.getElementById('copyPixBtnText');
        if (!copyTextarea || !copyTextarea.value) return;

        try {
            await navigator.clipboard.writeText(copyTextarea.value);
            if (btnText) {
                btnText.textContent = '✓ Código PIX Copiado!';
                setTimeout(() => {
                    btnText.textContent = 'Copiar Código PIX';
                }, 2000);
            }
        } catch {
            copyTextarea.select();
            document.execCommand('copy');
        }
    }

    // Quick View Modal
    function openQuickView(sku) {
        const prod = CATALOG[sku];
        const overlay = document.getElementById('quickViewOverlay');
        const content = document.getElementById('quickViewContent');
        if (!prod || !overlay || !content) return;

        content.innerHTML = `
            <div>
                <img src="${prod.image}" alt="${prod.name}">
            </div>
            <div>
                <span class="section-eyebrow">SKU: ${prod.sku} • PRONTA ENTREGA</span>
                <h3 id="qvTitle" style="font-size:1.5rem;margin-bottom:0.5rem;">${prod.name}</h3>
                <p style="margin-bottom:1rem;font-size:0.92rem;">${prod.description}</p>
                <div class="pricing-panel" style="margin-bottom:1.25rem;">
                    <div class="unit-price-row">
                        <span>Valor de cada unidade no pacote:</span>
                        <strong>${formatBRL(prod.unitPrice)}/un</strong>
                    </div>
                    <div class="bundle-price-row">
                        <div>
                            <span class="bundle-tag">PACOTE COM ${prod.unitsPerPack} UNIDADES</span>
                            <div class="bundle-total-price">${formatBRL(prod.price)}</div>
                        </div>
                        <span class="units-counter-label">PIX ou até 12x</span>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.6rem;">
                    <button type="button" class="btn btn-primary btn-full" onclick="window.NSEcommerce.addToCart('${prod.sku}', 1, true); window.NSEcommerce.closeQuickView();">
                        <i class="ph-bold ph-shopping-cart-simple"></i> Adicionar Pacote ao Carrinho
                    </button>
                    <button type="button" class="btn btn-cakto-direct btn-full" onclick="window.NSEcommerce.buyNowDirect('${prod.sku}', 1)">
                        <i class="ph-bold ph-lightning"></i> Comprar Agora via Cakto (${formatBRL(prod.price)})
                    </button>
                </div>
            </div>
        `;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeQuickView() {
        const overlay = document.getElementById('quickViewOverlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    // Accordions
    function toggleAccordion(headerBtn) {
        const item = headerBtn.closest('.accordion-item');
        if (!item) return;
        item.classList.toggle('active');
    }

    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        loadCart();
        renderCartUI();

        // Restore saved customer info
        try {
            const savedCust = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOMER) || 'null');
            if (savedCust) {
                if (savedCust.name && document.getElementById('custName')) document.getElementById('custName').value = savedCust.name;
                if (savedCust.phone && document.getElementById('custPhone')) document.getElementById('custPhone').value = savedCust.phone;
                if (savedCust.documentNum && document.getElementById('custDoc')) document.getElementById('custDoc').value = savedCust.documentNum;
                if (savedCust.email && document.getElementById('custEmail')) document.getElementById('custEmail').value = savedCust.email;
                if (savedCust.cep && document.getElementById('custCep')) document.getElementById('custCep').value = savedCust.cep;
                if (savedCust.number && document.getElementById('custNumber')) document.getElementById('custNumber').value = savedCust.number;
                if (savedCust.address && document.getElementById('custAddress')) document.getElementById('custAddress').value = savedCust.address;
            }
        } catch { /* ignore */ }

        // Open/close cart triggers
        document.getElementById('openCartBtn')?.addEventListener('click', () => {
            setCartStep('items');
            openCart();
        });

        document.getElementById('cartOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'cartOverlay') closeCart();
        });

        document.getElementById('quickViewOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'quickViewOverlay') closeQuickView();
        });

        // Input masks binding
        document.getElementById('custPhone')?.addEventListener('input', (e) => {
            e.target.value = maskPhone(e.target.value);
        });
        document.getElementById('custDoc')?.addEventListener('input', (e) => {
            e.target.value = maskDoc(e.target.value);
        });
        document.getElementById('custCep')?.addEventListener('input', (e) => {
            e.target.value = maskCep(e.target.value);
        });

        // Category Filter Pills
        document.querySelectorAll('.filter-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');

                document.querySelectorAll('#catalogGrid .product-card').forEach((card) => {
                    const cat = card.getAttribute('data-category');
                    if (filter === 'all' || cat === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Navbar Scroll Effect
        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar?.classList.add('scrolled');
            } else {
                navbar?.classList.remove('scrolled');
            }
        });

        // Initialize Gallery Swiper
        const swiperEl = document.querySelector('.gallerySwiper');
        if (swiperEl && typeof Swiper !== 'undefined') {
            new Swiper('.gallerySwiper', {
                slidesPerView: 1.2,
                spaceBetween: 16,
                loop: true,
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false
                },
                navigation: {
                    nextEl: '.gallery-section .swiper-button-next',
                    prevEl: '.gallery-section .swiper-button-prev'
                },
                pagination: {
                    el: '.gallery-section .swiper-pagination',
                    clickable: true
                },
                breakpoints: {
                    640: { slidesPerView: 2.2, spaceBetween: 20 },
                    1024: { slidesPerView: 3.5, spaceBetween: 24 }
                }
            });
        }
    });

    // Expose public API for inline handlers
    window.NSEcommerce = {
        addToCart,
        addToCartFromCard,
        changeCardQty,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        buyNowFromCard,
        buyNowDirect,
        openCart,
        closeCart,
        setCartStep,
        lookupCep,
        updateShippingUI,
        updatePaymentMethodUI,
        submitCaktoCheckout,
        copyPixCode,
        openQuickView,
        closeQuickView,
        toggleAccordion
    };
})();
