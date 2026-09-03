/**
 * Utilitário de detecção de intenção para geração de imagem no chat do ScreenAI Web
 * Identifica padrões naturais em português e inglês como:
 * - "crie um macaco"
 * - "quero criar um macaco"
 * - "crie uma imagem de um leão cibernético"
 * - "desenhe um gato astronauta"
 * - "gere uma foto de um pôr do sol em marte"
 */

export interface ImageIntentResult {
  isImageIntent: boolean;
  prompt: string;
  cleanPrompt: string;
}

// Termos que indicam que a pessoa quer texto ou código, e NÃO uma imagem
const TEXT_OR_CODE_EXCLUSIONS = [
  'função',
  'funcao',
  'código',
  'codigo',
  'script',
  'texto',
  'e-mail',
  'email',
  'artigo',
  'currículo',
  'curriculo',
  'poema',
  'história',
  'historia',
  'prompt',
  'resumo',
  'tabela',
  'banco de dados',
  'query',
  'sql',
  'python',
  'javascript',
  'typescript',
  'react',
  'aplicativo',
  'app',
  'site',
  'plano de negócio',
  'estratégia',
  'algoritmo',
];

export function detectImageIntent(rawText: string): ImageIntentResult {
  if (!rawText || !rawText.trim()) {
    return { isImageIntent: false, prompt: '', cleanPrompt: '' };
  }

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Verifica se o texto menciona explicitamente exclusões de código/texto
  const hasExclusion = TEXT_OR_CODE_EXCLUSIONS.some((term) =>
    lower.includes(term)
  );

  if (hasExclusion) {
    return { isImageIntent: false, prompt: text, cleanPrompt: text };
  }

  // 1. Padrões com comandos explícitos de imagem:
  // "crie uma imagem de...", "gere um desenho de...", "quero criar uma foto de..."
  const explicitPatterns = [
    /^(?:quero\s+)?(?:criar|crie|gerar|gere|fazer|faça|ilustrar|ilustre)\s+(?:uma?\s+)?(?:imagem|foto|desenho|ilustra[çc][ãa]o|arte|render|wallpaper)\s+(?:de\s+|do\s+|da\s+|sobre\s+|com\s+|um\s+|uma\s+)?(.+)$/i,
    /^(?:quero\s+ver\s+|mostre\s+(?:uma?\s+)?)(?:imagem|foto|desenho|ilustra[çc][ãa]o|arte)\s+(?:de\s+|do\s+|da\s+|sobre\s+|com\s+|um\s+|uma\s+)?(.+)$/i,
    /^(?:desenhar|desenhe|ilustrar|ilustre)\s+(?:uma?\s+)?(?:imagem|foto|desenho)?\s*(?:de\s+|do\s+|da\s+|um\s+|uma\s+)?(.+)$/i,
    /^(?:generate|draw|create|render)\s+(?:an?\s+)?(?:image|photo|picture|drawing|illustration|art)?\s*(?:of\s+|a\s+|an\s+)?(.+)$/i,
  ];

  for (const regex of explicitPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length > 0) {
        return {
          isImageIntent: true,
          prompt: text,
          cleanPrompt: extracted,
        };
      }
    }
  }

  // 2. Padrões diretos solicitados pelo usuário:
  // "crie um macaco", "quero criar um macaco", "crie uma paisagem", "desenhe um gato"
  const directCreationPatterns = [
    /^(?:quero\s+criar|quero\s+gerar)\s+(?:um\s+|uma\s+)?(.+)$/i,
    /^(?:crie|criar|gere|gerar)\s+(?:um\s+|uma\s+)?(.+)$/i,
    /^(?:desenhe|desenhar)\s+(.+)$/i,
  ];

  for (const regex of directCreationPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length >= 2) {
        return {
          isImageIntent: true,
          prompt: text,
          cleanPrompt: extracted,
        };
      }
    }
  }

  // 3. Menções no meio da frase:
  // "por favor gere uma imagem de um cavalo alado"
  if (
    lower.includes('gerar imagem') ||
    lower.includes('gere uma imagem') ||
    lower.includes('crie uma imagem') ||
    lower.includes('criar imagem') ||
    lower.includes('desenhe uma imagem') ||
    lower.includes('desenhe um ') ||
    lower.includes('desenhe uma ')
  ) {
    const clean = text
      .replace(/^(?:por\s+favor\s+|screenai\s+|ia\s+)?/i, '')
      .replace(/^(?:quero\s+que\s+voc[êe]\s+)?(?:crie|criar|gere|gerar|desenhe|desenhar)\s+(?:uma?\s+)?(?:imagem|foto|desenho|ilustra[çc][ãa]o)?\s*(?:de\s+|do\s+|da\s+|um\s+|uma\s+)?/i, '')
      .trim();

    return {
      isImageIntent: true,
      prompt: text,
      cleanPrompt: clean || text,
    };
  }

  return { isImageIntent: false, prompt: text, cleanPrompt: text };
}
