import en from './en.json';
import ptBR from './pt-BR.json';

type SupportedLocale = 'en' | 'pt-BR';

type TranslationKeys = keyof typeof en;

interface TranslationRecord {
  [key: string]: string;
}

const translations: Record<SupportedLocale, TranslationRecord> = {
  en,
  'pt-BR': ptBR,
};

function translate(
  locale: SupportedLocale,
  key: string,
  variables?: Record<string, string | number>,
): string {
  const localeTranslations = translations[locale];
  let value = localeTranslations[key];

  if (value === undefined) {
    return key;
  }

  if (variables) {
    for (const [varName, varValue] of Object.entries(variables)) {
      value = value.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), String(varValue));
    }
  }

  return value;
}

export { translate, translations, en, ptBR };
export type { SupportedLocale, TranslationKeys };
