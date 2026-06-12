# Monitor 24/7 — SuckOrSex

Edge Function Supabase que monitoriza o site suckorsex.com continuamente e envia alertas automáticos para um grupo Telegram.

---

## O que monitoriza

| Tipo | Frequência | O que verifica |
|------|-----------|----------------|
| **Uptime** | Cada 5 min | Site online, tempo de resposta, erros HTTP |
| **Sitemaps** | Cada hora | sitemap-videos, sitemap-tags, sitemap-shorts, sitemap-index |
| **Conteúdo** | Cada hora | Vídeos sem slug, sem tags, sem descrição |
| **Relatório diário** | 08:00 diário | Resumo completo do estado do site e base de dados |

---

## Alertas Telegram

- `🔴 SITE OFFLINE` — site não responde em 5s
- `⛔ SITE COM ERRO` — HTTP status != 200
- `⚠️ SITE LENTO` — tempo de resposta > 3000ms
- `⚠️ SITEMAP COM ERRO` — sitemap retorna erro
- `⛔ SITEMAP INACESSÍVEL` — sitemap não responde em 10s
- `⚠️ VÍDEOS SEM SLUG` — vídeos sem slug na BD
- `⚠️ VÍDEOS SEM TAGS` — vídeos sem tags na BD
- `⚠️ VÍDEOS SEM DESCRIÇÃO` — vídeos sem descrição na BD
- `📊 RELATÓRIO DIÁRIO` — resumo diário às 08:00

---

## Deploy

```bash
supabase functions deploy monitor --no-verify-jwt
```

O terminal mostra o URL da função após o deploy. Guarda esse URL para os passos seguintes.

---

## Testar

Substitui `[URL_DA_FUNCAO]` pelo URL real e executa:

```bash
curl -X POST [URL_DA_FUNCAO] \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

Confirma que chegou a mensagem "✅ Monitor activo..." no grupo Telegram.

---

## Activar pg_cron

No Supabase Dashboard:
**Database → Extensions → pesquisa "pg_cron" → Activar**

---

## Cron Jobs (SQL Editor)

Substitui `[URL_DA_FUNCAO]` pelo URL real e executa no **SQL Editor** do Supabase:

```sql
-- Verificar uptime a cada 5 minutos
SELECT cron.schedule(
  'monitor-uptime',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url:='[URL_DA_FUNCAO]',
    body:='{"type":"uptime"}',
    headers:='{"Content-Type":"application/json"}'
  )$$
);

-- Verificar conteúdo a cada hora
SELECT cron.schedule(
  'monitor-content',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='[URL_DA_FUNCAO]',
    body:='{"type":"content"}',
    headers:='{"Content-Type":"application/json"}'
  )$$
);

-- Relatório diário às 08:00
SELECT cron.schedule(
  'monitor-daily',
  '0 8 * * *',
  $$SELECT net.http_post(
    url:='[URL_DA_FUNCAO]',
    body:='{"type":"daily_report"}',
    headers:='{"Content-Type":"application/json"}'
  )$$
);
```

---

## Verificar cron jobs activos

```sql
SELECT jobname, schedule, command FROM cron.job;
```

---

## Remover um cron job

```sql
SELECT cron.unschedule('monitor-uptime');
SELECT cron.unschedule('monitor-content');
SELECT cron.unschedule('monitor-daily');
```

---

## Tipos de payload aceites

| `type` | Acção |
|--------|-------|
| `uptime` | Verifica se o site está online |
| `sitemaps` | Verifica os 4 sitemaps |
| `content` | Uptime + sitemaps + conteúdo BD |
| `daily_report` | Relatório completo |
| `test` | Envia mensagem de teste ao Telegram |
