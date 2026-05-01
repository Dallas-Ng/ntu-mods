import nextVitals from "eslint-config-next/core-web-vitals"
import prettier from "eslint-config-prettier"
import tailwindcss from "eslint-plugin-tailwindcss"
import unusedImports from "eslint-plugin-unused-imports"

const config = [
  ...nextVitals,
  ...tailwindcss.configs["flat/recommended"],
  prettier,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/jsx-key": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/no-custom-classname": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: {},
      },
      next: {
        rootDir: ["./"],
      },
    },
  },
]

export default config
