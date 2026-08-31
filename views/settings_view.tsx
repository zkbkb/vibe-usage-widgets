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
  Toggle,
  useState,
  VStack,
  Widget,
} from "scripting"
import { fetchUsage } from "../api"
import { getL10n } from "../l10n"
import {
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
import { ACCENT_CHOICES } from "../theme"

type TestState = "idle" | "testing" | "ok" | "unauthorized" | "network"

export const PRESET_EXAMPLES: { name: string; json: string }[] = [
  { name: "Models · 30d", json: `{"view":"models","days":30}` },
  { name: "Projects · cost", json: `{"view":"projects","sort":"cost"}` },
  { name: "Activity", json: `{"view":"active"}` },
  { name: "Private overview", json: `{"view":"overview","privacy":true}` },
  { name: "Custom accent", json: `{"accent":"#6199FF","days":30}` },
  { name: "Mock demo data", json: `{"mock":true}` },
]

export function SettingsView() {
  const dismiss = Navigation.useDismiss()
  const [settings, setSettingsState] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    ...getStoredSettings(),
  })
  const [apiKeyInput, setApiKeyInput] = useState<string>(getApiKey() ?? "")
  const [testState, setTestState] = useState<TestState>("idle")

  const systemLang = (Device.preferredLanguages?.[0] ?? "en")
  const lang = settings.language === "system" ? systemLang : settings.language
  const l10n = getL10n(lang)

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettingsState(next)
    saveSettings(next)
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
          onChanged={(value: string) => update({ days: parseInt(value) || 7 })}
          pickerStyle={"menu"}
        >
          {["1", "7", "30", "90"].map(d =>
            <Text tag={d}>{`${d} ${d === "1" ? l10n.dayUnit : l10n.daysUnit}`}</Text>
          )}
        </Picker>
        <Picker
          title={l10n.sortBy}
          value={settings.sortKey}
          onChanged={(value: SortKey) => update({ sortKey: value })}
          pickerStyle={"menu"}
        >
          <Text tag={"tokens"}>{l10n.sortTokens}</Text>
          <Text tag={"cost"}>{l10n.sortCost}</Text>
        </Picker>
        <Toggle
          title={l10n.showForecast}
          value={settings.showForecast}
          onChanged={(value: boolean) => update({ showForecast: value })}
        />
        <Picker
          title={l10n.defaultView}
          value={settings.defaultView}
          onChanged={(value: ViewKind) => update({ defaultView: value })}
          pickerStyle={"menu"}
        >
          <Text tag={"overview"}>{l10n.viewOverview}</Text>
          <Text tag={"active"}>{l10n.viewActive}</Text>
          <Text tag={"models"}>{l10n.viewModels}</Text>
          <Text tag={"projects"}>{l10n.viewProjects}</Text>
        </Picker>
      </Section>

      <Section header={<Text>{l10n.sectionAppearance}</Text>}>
        <Picker
          title={l10n.theme}
          value={settings.theme}
          onChanged={(value: ThemeMode) => update({ theme: value })}
          pickerStyle={"menu"}
        >
          <Text tag={"system"}>{l10n.themeSystem}</Text>
          <Text tag={"dark"}>{l10n.themeDark}</Text>
          <Text tag={"light"}>{l10n.themeLight}</Text>
        </Picker>
        <Picker
          title={l10n.accentColour}
          value={settings.accent ?? "default"}
          onChanged={(value: string) =>
            update({ accent: value === "default" ? null : value })}
          pickerStyle={"menu"}
        >
          {ACCENT_CHOICES.map(choice =>
            <Text tag={choice.value ?? "default"}>
              {choice.value == null ? l10n.accentDefault : choice.name}
            </Text>
          )}
        </Picker>
        <Toggle
          title={l10n.privacyMode}
          value={settings.privacyMode}
          onChanged={(value: boolean) => update({ privacyMode: value })}
        />
        <Picker
          title={l10n.currency}
          value={settings.currency}
          onChanged={(value: Currency) => update({ currency: value })}
          pickerStyle={"menu"}
        >
          <Text tag={"USD"}>USD $</Text>
          <Text tag={"CNY"}>CNY ¥</Text>
        </Picker>
        <Picker
          title={l10n.language}
          value={settings.language}
          onChanged={(value: LanguageMode) => update({ language: value })}
          pickerStyle={"menu"}
        >
          <Text tag={"system"}>{l10n.languageSystem}</Text>
          <Text tag={"en"}>English</Text>
          <Text tag={"zh"}>中文</Text>
        </Picker>
      </Section>

      <Section
        header={<Text>{l10n.sectionPresets}</Text>}
        footer={<Text>{l10n.presetsHint}</Text>}
      >
        {PRESET_EXAMPLES.map(preset =>
          <Button
            action={async () => {
              await Pasteboard.setString(preset.json)
            }}
          >
            <HStack>
              <VStack alignment={"leading"} spacing={2}>
                <Text font={14}>{preset.name}</Text>
                <Text font={11} foregroundStyle={"secondaryLabel"} monospaced>{preset.json}</Text>
              </VStack>
              <Spacer />
              <Image systemName={"doc.on.doc"} foregroundStyle={"secondaryLabel"} imageScale={"small"} />
            </HStack>
          </Button>
        )}
      </Section>

      <Section header={<Text>{l10n.sectionDev}</Text>}>
        <Button
          title={l10n.previewWidget}
          action={async () => {
            const options: Record<string, string> = { "Default": "{}" }
            for (const preset of PRESET_EXAMPLES) {
              options[preset.name] = preset.json
            }
            await Widget.preview({
              family: "systemMedium",
              parameters: { options, default: "Default" },
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
