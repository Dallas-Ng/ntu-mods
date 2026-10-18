import prettier from "eslint-config-prettier"
import astro from "eslint-plugin-astro"
import jsxA11y from "eslint-plugin-jsx-a11y"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import tseslint from "typescript-eslint"

// .astro templates are HTML-flavoured, not JSX — they use `class`, not
// `className`, and have no React component scope. The React/Tailwind/a11y
// configs are therefore scoped to .ts/.tsx and must never apply to .astro.
const REACT_FILES = ["**/*.ts", "**/*.tsx"]

const config = [
  {
    ignores: [".astro/**", ".next/**", "dist/**", "node_modules/**"]
  },
  { ...react.configs.flat.recommended, files: REACT_FILES },
  { ...reactHooks.configs.flat.recommended, files: REACT_FILES },
  ...tailwindcss.configs["flat/recommended"].map((c) => ({
    ...c,
    files: REACT_FILES
  })),
  // Without this every .astro file is silently skipped — eslint's flat config
  // only picks up .js/.ts by default, and most page logic lives in .astro
  // frontmatter.
  ...astro.configs.recommended,
  prettier,
  {
    files: REACT_FILES,
    languageOptions: {
      parser: tseslint.parser
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    }
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    settings: {
      react: { version: "detect" }
    }
  },
  {
    files: REACT_FILES,
    plugins: {
      "jsx-a11y": jsxA11y
    },
    rules: {
      "react/jsx-key": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-target-blank": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/no-custom-classname": "off"
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: {}
      }
    }
  },
  {
    plugins: {
      "unused-imports": unusedImports
    },
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error"
    }
  },
  // Client events go through track() in @/lib/analytics, which only accepts
  // names listed in @/lib/analytics-events. The feedback route captures with
  // posthog-node and checks its name with `satisfies AnalyticsEvent` instead.
  {
    files: REACT_FILES,
    ignores: ["src/lib/analytics.ts", "src/astro/pages/api/feedback.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='posthog'][callee.property.name='capture']",
          message:
            "Use track() from @/lib/analytics so the event name is checked against ANALYTICS_EVENTS."
        }
      ]
    }
  }
]

export default config
