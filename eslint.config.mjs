import prettier from "eslint-config-prettier"
import jsxA11y from "eslint-plugin-jsx-a11y"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import tseslint from "typescript-eslint"

const config = [
  {
    ignores: [".astro/**", "dist/**", "node_modules/**"]
  },
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  ...tailwindcss.configs["flat/recommended"],
  prettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
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
    plugins: {
      "unused-imports": unusedImports,
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
      "tailwindcss/no-custom-classname": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error"
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: {}
      }
    }
  }
]

export default config
