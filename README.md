# sitebarbearia

Website premium de barbearia com **agendamento online funcional** e **painel administrativo** completo.

Projeto construído conforme o PRD *Website Premium para Barbearia com Agendamento Online* (v2.0).

---

## 🧰 Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 19 · Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 |
| Ícones | lucide-react |
| Backend | Route Handlers + Server Actions (Next.js) |
| Banco de dados | SQLite local (`node:sqlite`), camada de acesso isolada em `src/lib` |
| Autenticação | Sessão por cookie httpOnly assinada + hash de senha com `scrypt` |
| Hospedagem | Vercel (ou qualquer host Node) |

> A camada de dados é modular: todos os acessos passam por `src/lib/queries.ts` e o
> motor de disponibilidade por `src/lib/booking/`, o que permite migrar para
> **Supabase/PostgreSQL** substituindo apenas esses arquivos.

---

## ▶️ Como rodar

```bash
npm install
npm run dev        # desenvolvimento -> http://localhost:3000
npm run build      # build de produção
npm start          # servidor de produção
```

### Painel administrativo

- URL: `http://localhost:3000/admin`
- E-mail: `admin@casanavalha.com.br`
- Senha: `barbearia2026`

> Troque a senha em **Configurações → Alterar senha** e ajuste o e-mail por
> variáveis de ambiente (`BARBEARIA_ADMIN_EMAIL` / `BARBEARIA_ADMIN_PASSWORD`)
> **antes da primeira execução** se quiser outros dados iniciais.

### Banco de dados

Criado automaticamente na primeira execução em:

```
~/.barbearia-premium/barbearia.db
```

Defina `BARBEARIA_DB_PATH` para usar outro caminho. O esquema, o expediente
padrão, os serviços de exemplo e as configurações são inseridos automaticamente
(seed).

---

## 📸 Como adicionar as fotos reais (espaços já preparados)

Nenhuma imagem foi gerada: todos os espaços ficaram **vazios e prontos** para
receber o material real da barbearia.

| Onde no site | Onde enviar no painel |
| --- | --- |
| Foto de destaque do hero | Configurações → *Foto de destaque do hero* |
| Fotos dos serviços | Serviços → *Imagem do serviço* |
| Portfólio de cortes | Galeria → *Adicionar imagem* (categoria **Corte**) |
| Galeria do ambiente | Galeria (categoria **Ambiente**) + *Foto de capa da galeria do ambiente* |
| Retrato do barbeiro | Configurações → *Retrato do barbeiro* |
| Fotos extras do barbeiro | Galeria (categoria **Barbeiro**) |

Formas de envio:

1. **Enviar arquivo** (botão *Enviar arquivo* nos formulários do painel) — o
   arquivo é salvo em `public/uploads/` e referenciado automaticamente.
2. **Colar uma URL** de imagem já existente.

Enquanto não houver imagem, o site exibe um espaço reservado elegante com o
texto “Espaço para foto”.

---

## 🗂 Estrutura

```
src/
├── app/
│   ├── (site)/            # site público (home + /agendamento)
│   ├── admin/
│   │   ├── login/         # login do painel
│   │   └── (painel)/      # rotas protegidas (guard no layout)
│   ├── api/
│   │   ├── availability/  # horários livres (dia e mês)
│   │   ├── appointments/  # criação pública de agendamento
│   │   └── admin/upload/  # upload de imagens (autenticado)
│   ├── robots.ts, sitemap.ts, not-found.tsx
├── components/
│   ├── site/              # Navbar, Hero, Serviços, Galeria, Barbeiro...
│   ├── booking/           # BookingFlow, calendário, horários
│   └── admin/             # sidebar, formulários, upload de imagem
├── lib/
│   ├── db.ts              # conexão + esquema + seed
│   ├── queries.ts         # acesso a dados (trocar por Supabase aqui)
│   ├── booking/           # motor de disponibilidade e criação de reserva
│   ├── actions/           # server actions do painel
│   └── auth.ts            # sessão e senha
```

---

## ✅ O que já funciona de verdade

**Site público**
- Navbar sticky com menu hambúrguer e rolagem suave
- Hero, diferenciais, serviços/preços, galeria com filtros e lightbox
- Apresentação do barbeiro, galeria do ambiente, depoimentos
- Seção de contato com WhatsApp, Instagram, mapa e rodapé
- Responsivo mobile-first (breakpoints 767 / 1023 / 1024+)
- SEO: metadata, OpenGraph, `robots`, `sitemap`, dados estruturados (HairSalon)

**Agendamento**
- Fluxo em 4 etapas: serviço → data/horário → dados → revisão → confirmação
- Horários gerados dinamicamente a partir de expediente, pausas, bloqueios,
  agendamentos existentes, margem entre atendimentos, antecedência mínima e
  limite de dias futuros
- Calendário bloqueia dias fechados, sem horários e datas passadas
- Prevenção a conflito validada **no servidor, dentro de transação** (dois
  clientes no mesmo horário → apenas um consegue reservar; o outro recebe 409)
- Confirmação com resumo, endereço e botão de WhatsApp
- Cancelamentos liberam o horário automaticamente

**Painel administrativo**
- Login protegido, rotas privadas, logout
- Dashboard com próximos clientes, horários livres e resumo do dia
- Agenda diária (confirmar/concluir/falta/cancelar/editar) e agenda semanal
- Calendário mensal com grau de ocupação
- Gestão de agendamentos (filtros, criação manual, edição, status)
- CRUD de serviços, clientes com histórico
- Expediente por dia, pausas e bloqueios de horário
- Galeria (corte/ambiente/barbeiro) e depoimentos
- Configurações do site + regras do agendamento + troca de senha

---

## 🔒 Segurança

- Painel protegido por `requireAdmin()` em todas as rotas e ações
- Senhas com `scrypt` + salt, sessões com token aleatório guardado em hash
- Cookie de sessão `httpOnly` / `SameSite=Lax` (com `Secure` em produção)
- Upload restrito a usuários autenticados e a formatos de imagem (máx. 8 MB)
- Dados de clientes não são expostos publicamente (a API pública devolve apenas
  horários livres)

---

## 🧭 Próximos passos sugeridos

1. Substituir textos/nome/fotos pelos dados reais pelo painel.
2. Configurar domínio e HTTPS (Vercel) e ajustar `metadataBase`/`sitemap`.
3. Migrar a camada `src/lib/queries.ts` + `src/lib/booking/` para Supabase
   (Postgres + RLS) quando for necessário multiusuário em nuvem.
