import {
  Button,
  Device,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Pasteboard,
  Picker,
  Section,
  SecureField,
  Spacer,
  Text,
  TextField,
  Toggle,
  useState,
  VStack,
  Widget,
} from "scripting"
import { fetchUsage } from "../api"
import { getL10n } from "../l10n"
import {
  buildPresetJson,
  isPresetText,
  ChartStyle,
  Currency,
  DEFAULT_SETTINGS,
  LanguageMode,
  Settings,
  SortKey,
  ThemeMode,
  ViewKind,
} from "../settings"
import {
  clearCaches,
  getApiKey,
  getStoredSettings,
  removeApiKey,
  saveSettings,
  setApiKey,
} from "../store"

type TestState = "idle" | "testing" | "ok" | "unauthorized" | "network"

export function SettingsView() {
  const dismiss = Navigation.useDismiss()
  const [settings, setSettingsState] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    ...getStoredSettings(),
  })
  const [apiKeyInput, setApiKeyInput] = useState<string>(getApiKey() ?? "")
  const [testState, setTestState] = useState<TestState>("idle")
  const [copied, setCopied] = useState<boolean>(false)
  const [presetDraft, setPresetDraft] = useState<string>(
    buildPresetJson({ ...DEFAULT_SETTINGS, ...getStoredSettings() }),
  )

  const systemLang = (Device.preferredLanguages?.[0] ?? "en")
  const lang = settings.language === "system" ? systemLang : settings.language
  const l10n = getL10n(lang)
  const presetValid = isPresetText(presetDraft)

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettingsState(next)
    saveSettings(next)
    // Settings win outright: the draft is replaced, edits and all.
    setPresetDraft(buildPresetJson(next))
    setCopied(false)
    if (patch.days != null && patch.days !== settings.days) {
      clearCaches()
    }
  }

  function commitApiKey(value: string) {
    setApiKeyInput(value)
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      removeApiKey()
    } else {
      setApiKey(trimmed)
    }
    setTestState("idle")
  }

  async function testConnection() {
    const key = apiKeyInput.trim()
    if (key.length === 0) {
      return
    }
    setTestState("testing")
    const result = await fetchUsage(key, 1, false)
    if (result.ok) {
      setTestState("ok")
    } else if (result.error === "unauthorized") {
      setTestState("unauthorized")
    } else {
      setTestState("network")
    }
  }

  const testLabel: Record<TestState, string> = {
    idle: l10n.apiKeyTest,
    testing: l10n.apiKeyTesting,
    ok: l10n.apiKeyOk,
    unauthorized: l10n.errUnauthorized,
    network: l10n.errNetwork,
  }
  const testColour: Record<TestState, string> = {
    idle: "accentColor",
    testing: "secondaryLabel",
    ok: "systemGreen",
    unauthorized: "systemRed",
    network: "systemOrange",
  }

  return <NavigationStack>
    <List
      navigationTitle={l10n.settingsTitle}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        confirmationAction: <Button
          title={l10n.done}
          action={() => {
            Widget.reloadAll()
            dismiss()
          }}
        />,
      }}
    >
      <Section
        header={<Text>{l10n.sectionApiKey}</Text>}
        footer={<Text>{l10n.apiKeyGet}</Text>}
      >
        <SecureField
          title={l10n.sectionApiKey}
          prompt={l10n.apiKeyPlaceholder}
          value={apiKeyInput}
          onChanged={commitApiKey}
        />
        <Button
          action={testConnection}
          disabled={testState === "testing" || apiKeyInput.trim().length === 0}
        >
          <Text foregroundStyle={testColour[testState]}>{testLabel[testState]}</Text>
        </Button>
      </Section>

      <Section header={<Text>{l10n.sectionData}</Text>}>
        <Picker
          title={l10n.statsDays}
          value={`${settings.days}`}
          onChanged={(value) => update({ days: parseInt(value) || 7 })}
          pickerStyle={"menu"}
        >
          {["1", "7", "14", "30", "90"].map(d =>
            <Text tag={d}>{`${d} ${d === "1" ? l10n.dayUnit : l10n.daysUnit}`}</Text>)}
        </Picker>
        <Picker
          title={l10n.sortBy}
          value={settings.sortKey}
          onChanged={(value) => update({ sortKey: value as SortKey })}
          pickerStyle={"menu"}
        >
          <Text tag={"tokens"}>{l10n.sortTokens}</Text>
          <Text tag={"cost"}>{l10n.sortCost}</Text>
        </Picker>
        <Picker
          title={l10n.chartStyle}
          value={settings.chartStyle}
          onChanged={(value) => update({ chartStyle: value as ChartStyle })}
          pickerStyle={"menu"}
        >
          <Text tag={"stacked"}>{l10n.chartStyleStacked}</Text>
          <Text tag={"multilines"}>{l10n.chartStyleLines}</Text>
        </Picker>
        <Picker
          title={l10n.defaultView}
          value={settings.defaultView}
          onChanged={(value) => update({ defaultView: value as ViewKind })}
          pickerStyle={"menu"}
        >
          <Text tag={"overview"}>{l10n.viewOverview}</Text>
          <Text tag={"active"}>{l10n.viewActive}</Text>
          <Text tag={"models"}>{l10n.viewModels}</Text>
        </Picker>
        <Toggle
          title={l10n.showForecast}
          value={settings.showForecast}
          onChanged={(value) => update({ showForecast: value })}
        />
      </Section>

      <Section header={<Text>{l10n.sectionAppearance}</Text>}>
        <Picker
          title={l10n.theme}
          value={settings.theme}
          onChanged={(value) => update({ theme: value as ThemeMode })}
          pickerStyle={"menu"}
        >
          <Text tag={"system"}>{l10n.themeSystem}</Text>
          <Text tag={"dark"}>{l10n.themeDark}</Text>
          <Text tag={"light"}>{l10n.themeLight}</Text>
        </Picker>
        <Picker
          title={l10n.currency}
          value={settings.currency}
          onChanged={(value) => update({ currency: value as Currency })}
          pickerStyle={"menu"}
        >
          <Text tag={"USD"}>{"USD $"}</Text>
          <Text tag={"CNY"}>{"CNY ¥"}</Text>
        </Picker>
        <Picker
          title={l10n.language}
          value={settings.language}
          onChanged={(value) => update({ language: value as LanguageMode })}
          pickerStyle={"menu"}
        >
          <Text tag={"system"}>{l10n.languageSystem}</Text>
          <Text tag={"en"}>{"English"}</Text>
          <Text tag={"zh"}>{"中文"}</Text>
        </Picker>
      </Section>

      <Section
        header={<Text>{l10n.sectionPresets}</Text>}
        footer={<Text>{l10n.presetsHint}</Text>}
      >
        <TextField
          title={""}
          value={presetDraft}
          onChanged={(value) => {
            setPresetDraft(value)
            setCopied(false)
          }}
          prompt={"{}"}
          axis={"vertical"}
          font={12}
          monospaced
          autocorrectionDisabled
          textInputAutocapitalization={"never"}
        />
        <Button
          action={async () => {
            await Pasteboard.setString(presetDraft)
            setCopied(true)
          }}
        >
          <HStack>
            <Text font={14}>
              {copied ? l10n.presetCopied : l10n.copyCurrentPreset}
            </Text>
            <Spacer />
            <Image
              systemName={presetValid
                ? (copied ? "checkmark" : "doc.on.doc")
                : "exclamationmark.triangle"}
              foregroundStyle={presetValid
                ? (copied ? "systemGreen" : "secondaryLabel")
                : "systemOrange"}
              imageScale={"small"}
            />
          </HStack>
        </Button>
      </Section>

      <Section header={<Text>{l10n.sectionDev}</Text>}>
        <Button
          title={l10n.previewWidget}
          action={async () => {
            const options: Record<string, string> = {
              [l10n.presetCurrent]: presetDraft,
              [l10n.viewOverview]: JSON.stringify({ view: "overview" }),
              [l10n.viewModels]: JSON.stringify({ view: "models" }),
              [l10n.viewActive]: JSON.stringify({ view: "active" }),
            }
            await Widget.preview({
              family: "systemMedium",
              parameters: { options, default: l10n.presetCurrent },
            })
          }}
        />
        <Button
          title={l10n.reloadWidgets}
          action={() => {
            Widget.reloadAll()
          }}
        />
      </Section>
    </List>
  </NavigationStack>
}
