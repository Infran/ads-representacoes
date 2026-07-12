module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // UI U3.5 — sem cores hex literais fora de src/theme. Force o uso de tokens
    // (tokens.ts / theme.palette / chaves de palette no `sx`). Pega tanto
    // strings (`"#fff"`, gradientes) quanto template literals. Arquivos com hex
    // legítimo têm override abaixo. `:not([regex])` evita falsos positivos em
    // regex literais que contenham `#`.
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]:not([regex])',
        message:
          'Não use cor hex literal fora de src/theme (UI U3.5). Use tokens (tokens.ts / theme.palette / chave de palette no sx).',
      },
      {
        selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]',
        message:
          'Não use cor hex literal fora de src/theme (UI U3.5). Use tokens (tokens.ts / theme.palette / chave de palette no sx).',
      },
    ],
  },
  overrides: [
    {
      // Arquivos de teste (Vitest) e setup: globals do Vitest + jsdom.
      // Inclui os characterization tests em src/ e os testes de regras em test/.
      files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'test/**'],
      env: { node: true },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    {
      // Allowlist documentada de hex legítimo (UI U3.5). São casos intencionais,
      // verificados na varredura hex→tokens de U2.2:
      //  - theme/*        → a FONTE dos tokens (incl. a ponte de CSS vars --ads-*);
      //  - Login          → gradiente de marca da tela pré-auth;
      //  - BudgetPdf      → paleta do documento PDF (@react-pdf, fora do tema MUI);
      //  - GlobalSearch / NotificationBell → cores CATEGÓRICas por entidade
      //    (cliente/orçamento/produto/representante).
      files: [
        'src/theme/tokens.ts',
        'src/theme/index.ts',
        'src/components/Login/Login.tsx',
        'src/utils/PDFGenerator/BudgetPdf.tsx',
        'src/components/Layout/AppHeader/GlobalSearch.tsx',
        'src/components/Layout/AppHeader/NotificationBell.tsx',
      ],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
}
