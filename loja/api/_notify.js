// Envio de avisos: e-mail (Resend) + WhatsApp (CallMeBot). Falha em um canal não derruba o outro.
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'gilalvesrepresentacoes@gmail.com';
const OWNER_PHONE = process.env.OWNER_PHONE || '5538999338918';

async function sendEmail(subject, text) {
  if (!process.env.RESEND_API_KEY) return console.warn('RESEND_API_KEY ausente: e-mail não enviado');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Pedidos <onboarding@resend.dev>',
      to: [OWNER_EMAIL], subject, text,
    }),
  });
  if (!r.ok) console.error('Resend erro', r.status, await r.text());
}

async function sendWhatsApp(text) {
  if (!process.env.CALLMEBOT_APIKEY) return console.warn('CALLMEBOT_APIKEY ausente: WhatsApp não enviado');
  const url = `https://api.callmebot.com/whatsapp.php?phone=${OWNER_PHONE}&apikey=${process.env.CALLMEBOT_APIKEY}&text=${encodeURIComponent(text)}`;
  const r = await fetch(url);
  if (!r.ok) console.error('CallMeBot erro', r.status, await r.text());
}

async function notify(subject, text) {
  await Promise.allSettled([sendEmail(subject, text), sendWhatsApp(subject + '\n\n' + text)]);
}
module.exports = { notify };
