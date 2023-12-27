import TableSettings from "@/components/settings/table-settings"

export default function SettingsPage() {
  return (
    <>
      <div className="flex h-full w-full flex-col justify-center gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>

        <p>We are building more customisability into the page!</p>

        <hr />

        <p>Table Settings</p>

        <TableSettings />

        {/* 
        <div>
        <div className="flex items-center space-x-2">
          <Switch
            id="collapsedView"
            checked={collapsedView}
            onCheckedChange={(val) => updateCollapsed(val, "collapsedView")}
          />
          <Label htmlFor="collapsedView">Collapsed View For Table</Label>
        </div>

        <span className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <HelpCircle className="h-[15px] w-[15px]" />
          Hides some information from the table to reduce the vertical space
          needed to display the whole table
        </span>
      </div>

      <hr /> */}
      </div>
    </>
  )
}
