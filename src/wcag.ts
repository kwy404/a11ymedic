/** WCAG 2.2 success criteria referenced by the rules, with plain names in English and Portuguese. */

export interface Criterion {
  id: string;
  name: string;
  namePt: string;
  level: "A" | "AA" | "AAA";
  url: string;
}

const RAW: Array<[string, string, string, "A" | "AA" | "AAA", string]> = [
  ["1.1.1", "Non-text Content", "Conteúdo não textual", "A", "non-text-content"],
  ["1.2.2", "Captions (Prerecorded)", "Legendas (pré-gravadas)", "A", "captions-prerecorded"],
  ["1.3.1", "Info and Relationships", "Informações e relações", "A", "info-and-relationships"],
  ["1.3.5", "Identify Input Purpose", "Identificar o propósito de entrada", "AA", "identify-input-purpose"],
  ["1.4.2", "Audio Control", "Controle de áudio", "A", "audio-control"],
  ["1.4.3", "Contrast (Minimum)", "Contraste (mínimo)", "AA", "contrast-minimum"],
  ["1.4.4", "Resize Text", "Redimensionar texto", "AA", "resize-text"],
  ["1.4.6", "Contrast (Enhanced)", "Contraste (melhorado)", "AAA", "contrast-enhanced"],
  ["2.1.1", "Keyboard", "Teclado", "A", "keyboard"],
  ["2.2.1", "Timing Adjustable", "Tempo ajustável", "A", "timing-adjustable"],
  ["2.2.2", "Pause, Stop, Hide", "Pausar, parar, ocultar", "A", "pause-stop-hide"],
  ["2.3.3", "Animation from Interactions", "Animação a partir de interações", "AAA", "animation-from-interactions"],
  ["2.4.1", "Bypass Blocks", "Ignorar blocos", "A", "bypass-blocks"],
  ["2.4.2", "Page Titled", "Página com título", "A", "page-titled"],
  ["2.4.3", "Focus Order", "Ordem do foco", "A", "focus-order"],
  ["2.4.4", "Link Purpose (In Context)", "Finalidade do link (em contexto)", "A", "link-purpose-in-context"],
  ["2.4.6", "Headings and Labels", "Cabeçalhos e rótulos", "AA", "headings-and-labels"],
  ["2.4.7", "Focus Visible", "Foco visível", "AA", "focus-visible"],
  ["2.5.3", "Label in Name", "Rótulo no nome", "A", "label-in-name"],
  ["2.5.8", "Target Size (Minimum)", "Tamanho do alvo (mínimo)", "AA", "target-size-minimum"],
  ["3.1.1", "Language of Page", "Idioma da página", "A", "language-of-page"],
  ["3.1.2", "Language of Parts", "Idioma das partes", "AA", "language-of-parts"],
  ["3.3.2", "Labels or Instructions", "Rótulos ou instruções", "A", "labels-or-instructions"],
  ["3.3.8", "Accessible Authentication (Minimum)", "Autenticação acessível (mínimo)", "AA", "accessible-authentication-minimum"],
  ["4.1.2", "Name, Role, Value", "Nome, função, valor", "A", "name-role-value"],
];

export const CRITERIA: Record<string, Criterion> = Object.fromEntries(
  RAW.map(([id, name, namePt, level, slug]) => [
    id,
    { id, name, namePt, level, url: `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html` },
  ]),
);

export function criterion(id: string): Criterion {
  const c = CRITERIA[id];
  if (!c) throw new Error(`Unknown WCAG criterion ${id}`);
  return c;
}
