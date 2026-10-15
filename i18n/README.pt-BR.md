<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-light.svg" width="860" alt="a11ymedic: Patch, a lontra paramédica, cuida de uma janela de navegador doente numa maca">
  </picture>
</p>

<h1 align="center">a11ymedic</h1>

<p align="center">Um verificador de acessibilidade que explica cada problema em linguagem simples e entrega a correção exata.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/v/a11ymedic?color=0f8b8d&label=npm" alt="Versão no npm"></a>
  <a href="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml"><img src="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml/badge.svg" alt="Status do CI"></a>
  <a href="https://github.com/kwy404/a11ymedic/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/a11ymedic?color=0f8b8d" alt="Licença MIT"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/a11ymedic/">Site e consulta ao vivo</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html">Guia rápido da WCAG 2.2</a> &middot;
  <a href="https://github.com/kwy404/a11ymedic/blob/main/README.md">Read in English</a>
</p>

O a11ymedic examina uma página com 61 regras da WCAG 2.2. Para cada problema, ele diz o que está errado, por que importa e quem é afetado, em português ou inglês, e entrega o HTML corrigido: o `alt`, o `aria-label` ou o `<label>` que faltava, ou o par de cores mais próximo que passa. Cada página também ganha uma nota de saúde de 0 a 100.

Ele funciona como overlay ou bookmarklet no navegador, ferramenta de linha de comando, verificação no CI e matcher de testes para Vitest e Jest. O motor de regras foi escrito do zero.

O jeito mais rápido de experimentar é a [consulta ao vivo](https://kwy404.github.io/a11ymedic/): cole um HTML ou uma URL e aperte **Check it**.

## Início rápido

```sh
npx a11ymedic index.html --lang pt
```

Instale no projeto (Node 18 ou mais recente):

```sh
npm install --save-dev a11ymedic
```

Ou use no código:

```js
import { audit } from "a11ymedic";

const result = await audit('<button><svg class="icon-trash"></svg></button>', { lang: "pt" });
result.score;                 // de 0 a 100
result.findings[0].message.pt; // explicação em português
result.findings[0].fix.after;  // '<button aria-label="Delete"><svg class="icon-trash"></svg></button>'
```

## Verificar qualquer página no navegador

**Bookmarklet.** Arraste do [site](https://kwy404.github.io/a11ymedic/#install) para a barra de favoritos, ou gere com `npx a11ymedic bookmarklet --lang pt`, e aperte em qualquer site. Apertar de novo fecha o painel.

**Tag script**, para builds de desenvolvimento:

```html
<script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay="pt"></script>
<!-- ou data-button="pt" para um botão flutuante "Verificar esta página" -->
```

O overlay coloca um marcador numerado em cada problema e abre um painel lateral com a explicação, o link da WCAG e a correção. <kbd>Escape</kbd> fecha o painel e <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> abre e fecha. O painel mostra a nota de saúde e quanto ela mudou desde a última verificação da mesma página (guardada no `localStorage`, nunca sai do navegador), e **Imprimir relatório** abre um relatório pronto para imprimir ou salvar em PDF. O overlay é para quem constrói o site e nunca altera a página para os visitantes.

## Linha de comando

```sh
npx a11ymedic "dist/**/*.html" --lang pt --fail-on serious
npx a11ymedic https://example.com --format html -o relatorio.html
npx a11ymedic "dist/**/*.html" --min-score 90 --history .a11ymedic-history.json
npx a11ymedic fix "src/**/*.html"          # mostra as correções seguras em diff
npx a11ymedic fix "src/**/*.html" --write  # aplica as correções
```

`--fail-on` falha o comando a partir de uma gravidade, `--min-score` falha abaixo de uma nota e `--history` guarda a nota de cada documento num arquivo JSON. O relatório HTML traz a nota e um layout de impressão. Rode `npx a11ymedic --help` para ver todas as opções.

A correção automática só aplica o que não precisa de decisão humana (alt vazio em imagens decorativas, `tabindex` positivo, zoom bloqueado, ARIA com erro de digitação, título da página e mais), mantém a formatação e não muda nada se rodar duas vezes. O resto vem como sugestão no relatório.

## CI e testes

No GitHub Actions, `npx a11ymedic "dist/**/*.html" --fail-on serious` adiciona anotações na linha certa e escreve um resumo do job.

```ts
import { audit } from "a11ymedic";
import "a11ymedic/vitest"; // Jest: setupFilesAfterEnv: ["a11ymedic/jest"]

test("o formulário é acessível", async () => {
  document.body.innerHTML = renderCadastro();
  expect(await audit(document.body)).toHaveNoViolations({ severity: "serious" });
});
```

## Limites

- Verificação automática não substitui uma auditoria completa. Se o texto alternativo é fiel, se as legendas estão certas ou se o fluxo faz sentido com leitor de tela ainda precisa de pessoas.
- Sem navegador não há layout: no Node, o tamanho de alvo usa só os tamanhos declarados no CSS. Use `--browser` ou o overlay.
- A consulta ao vivo no site só consegue ler URLs de sites que permitem (CORS). Para os outros, use a CLI ou o bookmarklet.

## Mais de kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): CSS utilitário sem etapa de build.
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): JSX e reatividade em HTML puro.
- [breakhound](https://kwy404.github.io/breakhound/): encontra bugs em bibliotecas JavaScript automaticamente.
- [vueleap](https://kwy404.github.io/vueleap/): migração do Vue 2 para o Vue 3.
- [graphemely](https://kwy404.github.io/graphemely/): strings com emoji sem quebrar.
- [numberparrot](https://kwy404.github.io/numberparrot/): números e moedas localizados.
- [edgegoat](https://kwy404.github.io/edgegoat/): entradas de casos extremos para testes.
- [cookieowl](https://kwy404.github.io/cookieowl/): consentimento de cookies para LGPD e GDPR que bloqueia rastreadores de verdade.
- [installkite](https://kwy404.github.io/installkite/): qualquer site instalável e com funcionamento offline.
- [fontsketch](https://kwy404.github.io/fontsketch/): a sua letra vira uma fonte, grátis e no navegador.
- [kastor](https://kwy404.github.io/kastor/): ORM para TypeScript para PostgreSQL, MySQL, SQLite, SQL Server, Oracle, MongoDB e mais.

## Autor

Criado por **Alexandre Kohler** ([GitHub](https://github.com/kwy404) e [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

O [site](https://kwy404.github.io/a11ymedic/) é feito com [Monsoon](https://kwy404.github.io/monsoon/), e as partes interativas com [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## Licença

[MIT](https://github.com/kwy404/a11ymedic/blob/main/LICENSE). Copyright 2026 Alexandre Kohler.
