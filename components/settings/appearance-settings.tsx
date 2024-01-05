"use client"

import { useTheme } from "next-themes"

import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

function LightTheme() {
  return (
    <div className="w-full">
      <div className="items-center rounded-md p-1">
        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
        </div>
      </div>

      <span className="block w-full p-2 text-center text-sm">Light</span>
    </div>
  )
}

function DarkTheme() {
  return (
    <div className="dark w-full">
      <div className="items-center rounded-md bg-popover p-1">
        <div className="space-y-2 rounded-sm bg-background p-2">
          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
        </div>
      </div>

      <span className="block w-full p-2 text-center text-sm">Dark</span>
    </div>
  )
}

export default function AppearanceSettings() {
  const { setTheme, theme } = useTheme()

  return (
    <>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(v) => setTheme(v)}
        className="justify-center">
        <ToggleGroupItem
          value="light"
          className="h-fit w-[250px] p-2 hover:border-accent">
          <LightTheme />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="dark"
          className="h-fit w-[250px] p-2 hover:bg-accent hover:text-accent-foreground">
          <DarkTheme />
        </ToggleGroupItem>
      </ToggleGroup>
    </>
  )
}

export function AppearanceSettingsSkeleton() {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="h-fit w-[250px] p-2 hover:border-accent">
        <LightTheme />
      </div>

      <div className="h-fit w-[250px] p-2 hover:bg-accent hover:text-accent-foreground">
        <DarkTheme />
      </div>
    </div>
  )
}
