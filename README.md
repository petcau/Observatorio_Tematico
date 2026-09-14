# Observatorio_Tematico

Dashboard do Eixo Temático Energia do Observatório de CT&I da Bahia: distribuição das produções científicas/técnicas por tema e subtema.

## Como rodar

Sem build, sem npm install. É HTML/JS puro (React, Babel, PapaParse e Tailwind carregados via CDN; JSX transformado no navegador).

Basta servir a pasta com qualquer servidor estático:

- **VS Code**: clique com o botão direito em `index.html` → **Open with Live Server** (ou "Go Live" na barra inferior).
- **Terminal**: `npx serve .` (ou `python -m http.server`) e abrir a URL indicada.

Não abra `index.html` direto do disco (`file://`) — o carregamento dos CSVs via `fetch` exige `http://`.

## Estrutura

- `dados/temas.csv` — taxonomia (temas e subtemas fixos do eixo Energia).
- `dados/*.csv` — CSV(s) de produções. O nome do(s) arquivo(s) usado(s) é configurado em `js/config.js` (`arquivosProducoes`).
- `js/config.js` — nome do observatório, texto do rodapé e qual(is) CSV(s) de produções carregar.
- `js/lib/` — parsing de CSV, taxonomia, loader de produções (schema-driven, aceita variações de nome de coluna) e regras de contagem.
- `js/components/` e `js/App.js` — interface em React (JSX transformado em tempo real pelo Babel standalone).

## Publicar no GitHub Pages

Settings → Pages → Deploy from a branch → escolher a branch e a pasta raiz (`/`). Sem workflow de build necessário — o Pages serve os arquivos como estão.
