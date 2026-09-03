import { l10nDE } from "./de"
import { l10nEN, L10nMap } from "./en"
import { l10nES } from "./es"
import { l10nFR } from "./fr"
import { l10nJA } from "./ja"
import { l10nRU } from "./ru"
import { l10nZH } from "./zh"

export type { L10nMap }

const localeMap: Record<string, L10nMap> = {
  de: l10nDE,
  es: l10nES,
  fr: l10nFR,
  ja: l10nJA,
  ru: l10nRU,
  zh: l10nZH,
}

export function getL10n(locale: string): L10nMap {
  const prefix = locale.split("-")[0].split("_")[0].toLowerCase()
  return localeMap[prefix] ?? l10nEN
}

export const supportedLanguages: {
  locale: string
  name: string
}[] = [{
  locale: "en",
  name: "English",
}, {
  locale: "de",
  name: "Deutsch",
}, {
  locale: "es",
  name: "Espanol",
}, {
  locale: "fr",
  name: "Francais",
}, {
  locale: "ja",
  name: "日本語",
}, {
  locale: "ru",
  name: "Русский",
}, {
  locale: "zh",
  name: "中文",
}]
