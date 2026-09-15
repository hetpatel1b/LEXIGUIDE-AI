import nextConfig from "eslint-config-next";

/**
 * ESLint 9 Flat Configuration for Next.js 16 and TypeScript.
 */
const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["scratch/**"]
  }
];

export default eslintConfig;
