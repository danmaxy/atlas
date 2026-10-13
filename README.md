# Atlas Imperium: site (atlasthe.com)

Site estático em HTML, CSS e JavaScript, publicado pelo GitHub Pages.

```
index.html        página inicial (painel)
404.html          página de "não encontrado"
CNAME             domínio personalizado (atlasthe.com)
css/style.css     visual (cores e fontes ficam nas variáveis do :root)
js/script.js      interações (brilho nos cartões, inclinação do dragão, avisos)
assets/           logo, ícones, imagem de compartilhamento e fontes
```

## Ativar uma ferramenta quando ela ficar pronta
1. Crie a pasta com o `index.html` dela (ex.: `orcamento/index.html`).
2. No `index.html` da raiz, apague o atributo `data-soon` do link correspondente.

O aviso "Em breve" some e o cartão passa a abrir a página.
