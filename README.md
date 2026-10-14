[README.md](https://github.com/user-attachments/files/33412987/README.md)
# ATLAS IMPERIUM — site

Site institucional + painel de ferramentas da Atlas.
HTML + CSS + JavaScript puro (sem build, sem dependências).

## Estrutura

```
atlas-site/
├── index.html              ← página inicial (pronta)
├── CNAME                   ← domínio: atlasthe.com
├── .nojekyll               ← evita o GitHub Pages ignorar pastas
├── assets/
│   ├── css/style.css       ← todo o visual
│   ├── css/pages.css       ← visual das páginas internas
│   ├── js/main.js          ← todas as animações
│   └── img/logo.png        ← COLOQUE SUA LOGO AQUI
├── pages/
│   ├── orcamento.html      ← gerador de orçamentos (PDF + WhatsApp)
│   ├── softwares.html      ← biblioteca de downloads
│   ├── optiplex.html       ← configurador do OptiPlex 7010
│   └── gestor.html         ← (próxima etapa)
└── sql/schema.sql          ← base do banco, para quando ligar backend
```

## Antes de publicar

1. Salve a logo do dragão como `assets/img/logo.png` (fundo transparente fica melhor).
   Se o arquivo não existir, o site continua funcionando com um "A" estilizado.
2. Confira os números em **Painel → stats** no `index.html` — são valores de exemplo, troque pelos reais.

## Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "site atlas - pagina inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/atlas-site.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
Em **Custom domain** digite `atlasthe.com` e marque **Enforce HTTPS**.

### DNS (no painel onde comprou o domínio)

| Tipo  | Nome  | Valor                   |
|-------|-------|-------------------------|
| A     | @     | 185.199.108.153         |
| A     | @     | 185.199.109.153         |
| A     | @     | 185.199.110.153         |
| A     | @     | 185.199.111.153         |
| CNAME | www   | SEU-USUARIO.github.io   |

## Ativar as páginas do painel

Os 4 cards de ferramenta estão com o atributo `data-soon` no `index.html`
(mostram "em construção" ao clicar). Quando a página existir, **remova o `data-soon`**
daquele card e o link passa a funcionar normalmente.

| Card       | Arquivo                  | Status      |
|------------|--------------------------|-------------|
| Orçamento  | `pages/orcamento.html`   | pronto      |
| Softwares  | `pages/softwares.html`   | pronto      |
| Optiplex   | `pages/optiplex.html`    | pronto      |
| Gestor     | `pages/gestor.html`      | a fazer     |

WhatsApp e Instagram são links externos e já funcionam.

### Onde editar o conteúdo das ferramentas

Cada página tem um bloco de dados no fim do arquivo, marcado com `>>>`:

- **Softwares** — a lista `SOFTWARES`: copie uma linha para adicionar um programa.
- **Optiplex** — as constantes `BASE` e `GRUPOS`: preços, opções e textos.
- **Orçamento** — a constante `EMPRESA`: CNPJ, telefone e site que saem no PDF.

## Observação sobre SQL

O GitHub Pages serve apenas arquivos estáticos — ele **não executa SQL, PHP ou Node**.
O `sql/schema.sql` é a base para quando conectarmos um backend.
Caminhos possíveis:

- **Agora:** salvar dados no navegador (`localStorage`) — funciona offline, por dispositivo.
- **Depois:** Supabase (PostgreSQL gratuito + API pronta) — mantém o site no GitHub Pages
  e só adiciona chamadas `fetch` no JS.
