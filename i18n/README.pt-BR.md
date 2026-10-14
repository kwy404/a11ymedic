<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-light.svg" width="860" alt="a11ymedic, a clínica de acessibilidade para sites: Patch, a lontra paramédica, cuida de uma janela de navegador doente numa maca, ao lado das palavras find accessibility problems, get the exact fix">
  </picture>
</p>

<h1 align="center">a11ymedic: verificador de acessibilidade que explica cada problema e entrega a correção exata</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/v/a11ymedic?color=0f8b8d&label=npm" alt="Versão do a11ymedic no npm"></a>
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/dm/a11ymedic?color=0f8b8d" alt="Downloads por mês no npm"></a>
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/dt/a11ymedic?color=0f8b8d" alt="Downloads totais no npm"></a>
  <a href="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml"><img src="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml/badge.svg" alt="Status do CI"></a>
  <a href="https://github.com/kwy404/a11ymedic/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/a11ymedic?color=0f8b8d" alt="Licença MIT"></a>
  <a href="https://kwy404.github.io/a11ymedic/#rules"><img src="https://img.shields.io/badge/regras%20WCAG%202.2-61-ff7a66" alt="61 regras WCAG 2.2"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/a11ymedic/">Site e consulta ao vivo</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/#contrast">Corretor de contraste</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html">Guia rápido da WCAG 2.2</a> &middot;
  <a href="https://github.com/kwy404/a11ymedic/blob/main/README.md">Read in English</a>
</p>

**O a11ymedic é um verificador de acessibilidade gratuito e de código aberto para a WCAG 2.2.** Ele examina a página com 61 regras e, para cada problema, explica em linguagem simples (português e inglês) o que está errado, por que importa, quem é afetado e qual critério de sucesso da WCAG foi violado. Depois entrega a correção exata: o HTML corrigido com o `alt`, o `aria-label` ou o `<label for>` que faltava, ou o par de cores acessível mais próximo, calculado em OKLCH. As correções seguras são aplicadas nos seus arquivos com um comando e uma prévia em diff.

Use como **overlay no navegador** (uma tag script ou um bookmarklet), **CLI** para arquivos, globs e URLs, **porta de qualidade no CI** com anotações no GitHub Actions ou **matcher de testes** para Vitest e Jest. O motor de regras foi escrito do zero e não depende de outros motores de acessibilidade.

```sh
npx a11ymedic index.html --lang pt
```

## Sumário

- [Início rápido](#início-rápido)
- [O que é verificado](#o-que-é-verificado)
- [Overlay e bookmarklet](#overlay-e-bookmarklet)
- [Linha de comando](#linha-de-comando)
- [Correção automática](#correção-automática)
- [Testes de acessibilidade no CI](#testes-de-acessibilidade-no-ci)
- [Testes com Vitest e Jest](#testes-com-vitest-e-jest)
- [Com React, Vue, Angular, Next.js e HTML puro](#com-react-vue-angular-nextjs-e-html-puro)
- [API](#api)
- [Como funciona a correção de contraste](#como-funciona-a-correção-de-contraste)
- [Limites](#limites)
- [Perguntas frequentes](#perguntas-frequentes)
- [Mais de kwy404](#mais-de-kwy404)
- [Autor](#autor)
- [Licença](#licença)

## Início rápido

**Em qualquer página, por CDN** (fixe a versão):

```html
<script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay="pt"></script>
```

**Pelo npm**, para CLI, CI e testes (Node 18 ou mais novo):

```sh
npm install --save-dev a11ymedic
npx a11ymedic "src/**/*.html" --lang pt
```

**No código:**

```js
import { audit } from "a11ymedic";

const resultado = await audit('<button><svg class="icon-trash"></svg></button>');
resultado.findings[0].message.pt; // 'Este botão só tem um ícone e nenhum nome. O ícone sugere "Excluir".'
resultado.findings[0].fix.after;  // '<button aria-label="Delete"><svg class="icon-trash"></svg></button>'
```

Teste sem instalar nada na [sala de consulta ao vivo](https://kwy404.github.io/a11ymedic/#checkup).

## O que é verificado

61 regras, cada uma ligada a critérios de sucesso da WCAG 2.2 e com uma gravidade (crítico, grave, moderado, leve). Toda regra tem um exemplo que passa e um que falha nos testes. O [catálogo completo](https://kwy404.github.io/a11ymedic/#rules) está no site; `npx a11ymedic rules --lang pt` imprime a lista.

| Área | Regras |
| --- | --- |
| Imagens | `image-alt` (distingue imagens decorativas de informativas), `image-alt-quality`, `input-image-alt`, `area-alt`, `role-img-alt`, `object-alt` |
| Nomes | `button-name`, `link-name`, `link-text-generic` ("clique aqui", "saiba mais"), `label-in-name`, `aria-dialog-name`, `aria-widget-name` |
| Formulários | `label`, `autocomplete-valid`, `input-purpose`, `paste-blocked`, `radio-group` |
| Cor | `color-contrast` (AA) e `color-contrast-enhanced` (AAA), com fundo efetivo, alfa, opacidade, degradês e texto grande |
| Documento | `html-has-lang` (detecta o idioma), `html-lang-valid`, `valid-lang`, `document-title`, `meta-viewport`, `meta-refresh` |
| Estrutura | `heading-order`, `page-has-heading-one`, `empty-heading`, `landmark-one-main`, `landmark-unique`, `region`, `bypass`, `skip-link`, `list`, `listitem`, `definition-list`, `duplicate-id` |
| ARIA | `aria-valid-role`, `aria-valid-attr`, `aria-valid-attr-value`, `aria-required-attr`, `aria-hidden-focus`, `aria-hidden-body`, `aria-prohibited-label`, `aria-required-parent`, `presentation-role-conflict` |
| Teclado | `tabindex`, `focus-visible`, `nested-interactive`, `keyboard-click-handler`, `link-as-button`, `target-size` (24 por 24 pixels CSS) |
| Mídia e movimento | `autoplay-media`, `video-caption`, `blink-marquee`, `motion-reduced`, `frame-title`, `frame-title-unique` |
| Tabelas | `table-headers`, `th-scope-valid`, `empty-table-header` |

Cada achado traz: explicação em linguagem simples (inglês e português), quem é afetado, o critério da WCAG com link, o elemento exato (seletor, trecho de HTML, linha e coluna) e a correção (`fix.before`, `fix.after`, `fix.safe`). O que a ferramenta não consegue decidir sozinha (texto sobre imagem de fundo, por exemplo) vai para a lista `incomplete`, de verificação humana.

## Overlay e bookmarklet

Com a tag script, cada problema ganha um alfinete numerado na página e um painel lateral acessível por teclado mostra a explicação, o link da WCAG e o código antes e depois. <kbd>Esc</kbd> fecha e <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> liga e desliga. O overlay é uma ferramenta de diagnóstico: nunca altera a página para os visitantes.

Bookmarklet (crie um favorito com esta URL):

```text
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js';s.setAttribute('data-overlay','pt');document.body.appendChild(s)})()
```

## Linha de comando

```sh
npx a11ymedic <arquivos, globs, pastas ou URLs...> [opções]
npx a11ymedic fix <arquivos ou globs...> [--write]
npx a11ymedic rules [--lang pt]
```

Principais opções: `--format text|json|html|md|github`, `-o arquivo`, `--fail-on critical|serious|moderate|minor|none` (padrão `minor`), `--level A|AA|AAA`, `--lang pt`, `--rules` e `--disable`, `--exclude <seletor>`, `--browser` e `--no-browser`, `--default-lang <código>`, `--github` e `--no-github`, `--quiet`.

URLs são verificadas em um navegador headless quando o Playwright ou o Puppeteer estão instalados; sem eles, o a11ymedic baixa o HTML e as folhas de estilo da mesma origem e faz uma análise estática. Arquivos locais são lidos com jsdom e o CSS vinculado é aplicado em cascata (especificidade, `!important`, variáveis CSS, herança e media queries).

## Correção automática

```sh
npx a11ymedic fix "src/**/*.html"          # prévia em diff
npx a11ymedic fix "src/**/*.html" --write  # aplica
```

Só as correções que não precisam de decisão humana são aplicadas, e só nos caracteres envolvidos: formatação, comentários e ordem dos atributos continuam iguais. Rodar duas vezes não muda nada. Exemplos: `alt=""` em imagens decorativas, `tabindex="0"` no lugar de valores positivos, zoom reativado no viewport, `aria-labeledby` corrigido para `aria-labelledby`, `<title>` a partir do `h1`, `lang` quando o idioma é detectado, `muted` em mídia com autoplay, valores de `autocomplete` válidos e remoção do bloqueio de colar.

## Testes de acessibilidade no CI

```yaml
- run: npx a11ymedic "dist/**/*.html" --fail-on serious --lang pt
```

No GitHub Actions o a11ymedic gera anotações no arquivo e na linha certos e adiciona uma tabela ao resumo do job.

## Testes com Vitest e Jest

```ts
import { audit } from "a11ymedic";
import "a11ymedic/vitest"; // Jest: setupFilesAfterEnv: ["a11ymedic/jest"]

test("o formulário é acessível", async () => {
  document.body.innerHTML = renderFormulario();
  expect(await audit(document.body)).toHaveNoViolations({ severity: "serious" });
});
```

## Com React, Vue, Angular, Next.js e HTML puro

- **React**: `const { container } = render(<Toolbar />); expect(await audit(container)).toHaveNoViolations();`
- **Vue**: `expect(await audit(mount(Card).element)).toHaveNoViolations();`
- **Angular**: `expect((await audit(fixture.nativeElement)).findings).toEqual([]);`
- **Next.js**: carregue o script com `next/script` só em desenvolvimento (exemplo no [README em inglês](https://github.com/kwy404/a11ymedic/blob/main/README.md#use-with-react-vue-angular-nextjs-and-plain-html)).
- **HTML puro**: a tag script do início rápido, ou `npx a11ymedic "**/*.html"`.

## API

| Função | O que faz |
| --- | --- |
| `audit(entrada, opções?)` | Verifica uma string HTML, um `Document` ou um `Element`. Retorna achados, verificações humanas e contagens. |
| `auditDocument(raiz, opções?)` | O mesmo, síncrono, para um DOM vivo. |
| `fixHtml(html, opções?)` | Aplica as correções seguras no texto fonte. |
| `applyFix(achado)` | Aplica a correção de um achado no DOM vivo. |
| `contrastRatio(texto, fundo)`, `suggestColors(texto, fundo, { ratio })` | Contraste WCAG e o par de cores aprovado mais próximo em OKLCH. |
| `accessibleName(el)`, `getRole(el)` | Nome acessível e papel (role). |
| `formatText`, `toJSON`, `toMarkdown`, `toHtml`, `githubAnnotations`, `githubSummary` | Relatórios. Use `{ lang: "pt" }`. |

Opções: `level`, `lang`, `rules`, `disable`, `exclude`, `css`, `styles`, `fragment`, `defaultLang`, `source`. Elementos com `data-a11ymedic-ignore` são ignorados. No navegador: `a11ymedic.overlay()`, `drawPins()` e `toggleOverlay()`.

## Como funciona a correção de contraste

O a11ymedic calcula o fundo efetivo (cores com alfa, `opacity` dos ancestrais, cada parada de degradês), usa o limite certo (3:1 para texto grande, 4,5:1 para o resto, 7:1 no AAA, sem arredondar para cima) e procura a cor aprovada mais próxima mantendo o matiz: só a luminosidade OKLCH muda, com busca binária, e o croma só diminui se a cor sair da gama sRGB. `#999999` sobre branco vira `#767676`; um azul claro continua azul.

## Limites

- Sem navegador, a análise estática não tem layout: o tamanho do alvo usa só tamanhos declarados no CSS. Use `--browser` ou o overlay para verificações com layout.
- Verificação automática não substitui testes com pessoas: precisão do texto alternativo, legendas e a experiência com leitor de tela ainda precisam de gente.
- JavaScript não é executado na análise estática de arquivos.
- A versão para navegador tem cerca de 68 kB com gzip, a maior parte são as explicações nos dois idiomas.

## Perguntas frequentes

**Existe um verificador de acessibilidade gratuito em português?** Sim: `npx a11ymedic index.html --lang pt`, ou `data-overlay="pt"` no overlay. Todo achado traz os dois idiomas.

**Como corrigir contraste de cor sem mudar a identidade visual?** Use o [corretor de contraste](https://kwy404.github.io/a11ymedic/#contrast): ele mantém o matiz e ajusta só a luminosidade.

**O a11ymedic é um overlay de acessibilidade que corrige o site para os usuários?** Não. O overlay é para quem constrói o site e nunca altera a página para os visitantes. As correções pertencem ao código fonte.

## Mais de kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): CSS utilitário sem etapa de build.
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): JSX e reatividade em HTML puro.
- [breakhound](https://kwy404.github.io/breakhound/): encontra bugs em bibliotecas JavaScript automaticamente.
- [vueleap](https://kwy404.github.io/vueleap/): migração do Vue 2 para o Vue 3.
- [graphemely](https://kwy404.github.io/graphemely/): strings com emoji sem quebrar.
- [numberparrot](https://kwy404.github.io/numberparrot/): números e moedas localizados.
- [edgegoat](https://kwy404.github.io/edgegoat/): entradas de casos extremos para testes.

## Autor

Criado por **Alexandre Kohler** ([GitHub](https://github.com/kwy404) e [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

O [site de documentação](https://kwy404.github.io/a11ymedic/) é feito com [Monsoon](https://kwy404.github.io/monsoon/), e as partes interativas com [Voodoo.js](https://kwy404.github.io/Voodoo.js/).

## Licença

[MIT](https://github.com/kwy404/a11ymedic/blob/main/LICENSE). Copyright 2026 Alexandre Kohler ([kwy404](https://github.com/kwy404)).
