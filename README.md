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
| Banco de dados | SQLite local (`node:sqlite`) + Netlify Blobs em produção, camada de acesso isolada em `src/lib` |
| Autenticação | Sessão por cookie httpOnly assinada + hash de senha com `scrypt` |
| Hospedagem | Netlify (adaptador oficial do Next.js, zero-config) |

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

**Desenvolvimento local** — criado automaticamente na primeira execução em:

```
~/.barbearia-premium/barbearia.db
```

Defina `BARBEARIA_DB_PATH` para usar outro caminho. O esquema, o expediente
padrão, os serviços de exemplo e as configurações são inseridos automaticamente
(seed).

**Produção (Netlify)** — o disco das funções é efêmero, então o sistema
**não usa o sistema de arquivos como persistência**: o banco roda em memória e
o estado completo é sincronizado com o **Netlify Blobs** (armazenamento
persistente nativo, compartilhado entre execuções e deploys). As gravações
passam por uma trava otimista com ETag (`src/lib/storage/`), o que mantém a
validação de conflitos de agendamento correta mesmo com requisições
simultâneas em instâncias distintas.

Variáveis relevantes:

| Variável | Efeito |
| --- | --- |
| `BARBEARIA_STORAGE=blobs` | força o modo Netlify Blobs (teste local) |
| `BARBEARIA_STORAGE=file` | força banco em arquivo |
| `BARBEARIA_STORAGE=memory` | força banco só em memória (sem persistir) |

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

1. **Enviar arquivo** (botão *Enviar arquivo* nos formulários do painel) — em
   desenvolvimento o arquivo é salvo em `public/uploads/`; em produção (Netlify)
   ele vai para o **Netlify Blobs** e é servido por `/api/uploads/…`. Nos dois
   casos a URL é preenchida automaticamente no formulário.
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
│   ├── db.ts              # conexão + esquema + seed (arquivo em dev, memória em produção)
│   ├── queries.ts         # acesso a dados (trocar por Supabase aqui)
│   ├── storage/           # Netlify Blobs: snapshot do banco + trava de gravação
│   ├── booking/           # motor de disponibilidade e criação de reserva
│   ├── actions/           # server actions do painel
│   └── auth.ts            # sessão e senha
```

---

## 🚀 Deploy no Netlify

O `netlify.toml` na raiz já define o build:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"   # node:sqlite exige 22.13+
```

Passos:

1. Envie o repositório para o GitHub e conecte-o ao Netlify
   (*Add new site → Import an existing project*).
2. O Netlify detecta o Next.js e instala automaticamente o adaptador oficial
   (OpenNext) — **não fixe a versão** de `@netlify/plugin-nextjs`.
3. Deploy. Nenhuma variável de ambiente é obrigatória; opcionalmente defina
   `BARBEARIA_ADMIN_EMAIL` / `BARBEARIA_ADMIN_PASSWORD` para o primeiro
   administrador (antes do primeiro deploy, pois o seed roda no primeiro boot).

Detalhes do funcionamento em produção:

- **Nenhum caminho absoluto local** e nenhum diretório criado em disco — a
  renderização (SSR) e a geração de metadata não dependem de pastas que não
  existem no ambiente.
- **Banco**: SQLite em memória + snapshot JSON persistido no Netlify Blobs
  (`src/lib/storage/`), com sincronização por ETag.
- **Imagens enviadas**: armazenadas no Netlify Blobs e servidas pela rota
  `/api/uploads/[filename]` (otimizadas pelo `next/image`).
- **Imagens sem upload**: URLs remotas ou de `public/` continuam funcionando
  normalmente.

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
2. Conectar o repositório ao Netlify e apontar o domínio, ajustando
   `metadataBase`/`sitemap` para a URL final.
3. Migrar a camada `src/lib/queries.ts` + `src/lib/booking/` para Supabase
   (Postgres + RLS) quando for necessário multiusuário em nuvem.
