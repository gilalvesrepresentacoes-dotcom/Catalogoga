# Catálogo Sabbath Profissional — checkout InfinitePay

## Publicar (Vercel)
1. Suba esta pasta para um repositório no GitHub (ou rode `vercel` na pasta).
2. Em **Settings → Environment Variables** crie:

| Variável | Valor |
|---|---|
| `INFINITEPAY_HANDLE` | `gasabbathprofissionalmoc` (sua InfiniteTag, sem `$`) |
| `RESEND_API_KEY` | chave grátis em resend.com (cadastre com gilalvesrepresentacoes@gmail.com) |
| `CALLMEBOT_APIKEY` | chave do WhatsApp (passo abaixo) |
| `OWNER_EMAIL` / `OWNER_PHONE` | opcionais (já padrão: seu e-mail e 5538999338918) |

3. Faça o deploy. O webhook da InfinitePay é configurado sozinho a cada pedido.

## Chave do WhatsApp (CallMeBot, grátis)
Do número 38 99933-8918, envie a mensagem `I allow callmebot to send me messages` para **+34 644 51 95 23**. Você receberá a apikey.

## Avisos que você recebe (e-mail + WhatsApp)
1. 🛒 **Novo pedido** — assim que o cliente clica em pagar (com nome, telefone e itens).
2. ✅ **Pagamento confirmado** — quando a InfinitePay aprova (Pix ou cartão).

## Atualizar produtos/preços
Edite `products.json` (preço em reais). O servidor sempre recalcula o total por ele.
