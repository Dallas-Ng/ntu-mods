import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export const darkMode = ["class"]

export const content = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "config/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "pages/**/*.{ts,tsx}"
]

export const theme = {
  container: { center: true },
  extend: {
    height: {
      screen: ["100vh /* fallback for Opera, IE and etc. */", "100dvh"]
    },
    transitionProperty: {
      height: "height"
    },
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))"
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))"
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))"
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))"
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))"
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))"
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))"
      }
    },
    borderRadius: {
      lg: `var(--radius)`,
      md: `calc(var(--radius) - 2px)`,
      sm: "calc(var(--radius) - 4px)"
    },
    fontFamily: {
      sans: ["var(--font-sans)", ...fontFamily.sans]
    },
    keyframes: {
      "accordion-down": {
        from: { height: 0 },
        to: { height: "var(--radix-accordion-content-height)" }
      },
      "accordion-up": {
        from: { height: "var(--radix-accordion-content-height)" },
        to: { height: 0 }
      },
      slide: {
        "0%": { transform: "translateY(100%)", opacity: 0.1 },
        "15%": { transform: "translateY(0)", opacity: 1 },
        "25%": { transform: "translateY(0)", opacity: 1 },
        "45%": { transform: "translateY(-100%)", opacity: 1 },
        "100%": { transform: "translateY(-100%)", opacity: 0.1 }
      }
    },
    animation: {
      slide: "slide 3.5s linear infinite",
      "accordion-down": "accordion-down 0.2s ease-out",
      "accordion-up": "accordion-up 0.2s ease-out"
    }
  },
  variants: {}
}

export const plugins = [require("tailwindcss-animate")]
