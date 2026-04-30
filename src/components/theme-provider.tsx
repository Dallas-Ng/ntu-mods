"use client"

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps
} from "next-themes"

const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider {...props} attribute="class" defaultTheme="dark">
    {children}
  </NextThemesProvider>
)

export default ThemeProvider
