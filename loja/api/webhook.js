// POST /api/webhook  <- InfinitePay chama aqui quando o pagamento é aprovado.
const { notify } = require('./_notify');
const HANDLE = process.env.INFINITEPAY_HANDLE || 'gasabbathprofissionalmoc';
const brl = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const b = req.body || {};
    if (!b.order_nsu || !String(b.order_nsu).startsWith('GA-')) return res.status(400).json({ error: 'order_nsu inválido' });
    // Confirma o pagamento direto na InfinitePay (não confia só no corpo recebido)
    const chk = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: HANDLE, order_nsu: b.order_nsu, transaction_nsu: b.transaction_nsu, slug: b.invoice_slug }),
    }).then(r => r.json()).catch(() => ({}));
    if (!chk.paid) return res.status(400).json({ error: 'Pagamento não confirmado' });

    const metodo = { pix: 'Pix', credit_card: 'Cartão de crédito' }[chk.capture_method || b.capture_method] || (chk.capture_method || '-');
    await notify(`✅ PAGAMENTO CONFIRMADO ${b.order_nsu}`,
      `Pedido ${b.order_nsu} pago!\nValor: ${brl(chk.paid_amount || b.paid_amount || b.amount)}\nForma: ${metodo}` +
      `${chk.installments > 1 ? ' em ' + chk.installments + 'x' : ''}\n\nItens:\n` +
      (b.items || []).map(i => `• ${i.quantity}x ${i.description}`).join('\n') +
      `\n\nComprovante: ${b.receipt_url || '-'}\n(Dados do cliente: veja o aviso "Novo pedido" com o mesmo número.)`);
    res.status(200).json({ ok: true });
  } catch (e) { console.error(e); res.status(400).json({ error: 'erro' }); }
};
