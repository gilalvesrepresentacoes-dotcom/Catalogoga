// POST /api/checkout  -> cria o link de pagamento na InfinitePay e avisa o vendedor.
const products = require('../products.json');
const { notify } = require('./_notify');
const byId = Object.fromEntries(products.map(p => [p.id, p]));
const HANDLE = process.env.INFINITEPAY_HANDLE || 'gasabbathprofissionalmoc'; // sem o $
const brl = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { items, customer = {}, note = '' } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Carrinho vazio' });
    const name = String(customer.name || '').trim().slice(0, 80);
    const phone = String(customer.phone || '').replace(/\D/g, '');
    const email = String(customer.email || '').trim().slice(0, 120);
    if (name.length < 3 || phone.length < 10) return res.status(400).json({ error: 'Informe nome e WhatsApp válidos' });

    // Preços SEMPRE vêm do servidor (nunca do navegador)
    const lines = [];
    for (const it of items.slice(0, 100)) {
      const p = byId[it.id]; const qty = Math.floor(Number(it.qty));
      if (!p || !(qty >= 1 && qty <= 999)) return res.status(400).json({ error: 'Item inválido' });
      lines.push({ p, qty, price: Math.round(p.price * 100) });
    }
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const orderNsu = 'GA-' + Date.now().toString(36).toUpperCase();
    const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

    const payload = {
      handle: HANDLE,
      order_nsu: orderNsu,
      redirect_url: `${origin}/?pedido=${orderNsu}`,
      webhook_url: `${origin}/api/webhook`,
      items: lines.map(l => ({ quantity: l.qty, price: l.price, description: `${l.p.code} - ${l.p.name}`.slice(0, 120) })),
      customer: { name, phone_number: '+' + (phone.startsWith('55') ? phone : '55' + phone), ...(email && { email }) },
    };
    const r = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    const url = data.url || data.link || data.checkout_url;
    if (!r.ok || !url) { console.error('InfinitePay', r.status, data); return res.status(502).json({ error: 'Não foi possível gerar o pagamento. Tente novamente.' }); }

    await notify(`🛒 Novo pedido ${orderNsu} (aguardando pagamento)`,
      `Cliente: ${name}\nWhatsApp: ${phone}\nE-mail: ${email || '-'}\n\nItens:\n` +
      lines.map(l => `• ${l.qty}x ${l.p.code} - ${l.p.name} (${brl(l.price)})`).join('\n') +
      `\n\nTotal: ${brl(total)}\nObs: ${String(note).slice(0, 300) || '-'}\n\nVocê receberá outro aviso quando o pagamento for confirmado.`);

    res.status(200).json({ url, order: orderNsu });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro interno' }); }
};
