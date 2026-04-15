import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    name: "custom/jsx-sort-props",
    rules: {
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: false,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
    },
  },
  {
    name: "custom/import-sort",
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Frameworks: React and Next.js
            ["^react", "^next"],
            // Third-party packages (including scoped @org, excluding @/ alias)
            ["^[a-z]", "^@(?!/)"],
            // Internal aliases (@/)
            ["^@/"],
            // Parent imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Sibling imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Side-effect imports
            ["^\\u0000"],
            // Catch-all
            ["^"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
]);

export default eslintConfig;
