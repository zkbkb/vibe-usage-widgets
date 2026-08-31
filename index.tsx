import { Navigation, Script, Widget } from "scripting"
import { SettingsView } from "./views/settings_view"

async function run() {
  await Navigation.present({
    element: <SettingsView />,
    modalPresentationStyle: "pageSheet",
  })
  Widget.reloadAll()
  Script.exit()
}

run()
