import { l10nEN, L10nMap } from "./en"
import { l10nZH } from "./zh"

export type { L10nMap }

export function getL10n(locale: string): L10nMap {
  return locale.startsWith("zh") ? l10nZH : l10nEN
}

export const supportedLanguages: {
  locale: string
  name: string
}[] = [{
  locale: "en",
  name: "English",
}, {
  locale: "zh",
  name: "中文",
}]
