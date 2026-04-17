export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        chrome: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        MutationObserver: "readonly",
        Element: "readonly",
        Node: "readonly",
        NodeFilter: "readonly",
        HTMLElement: "readonly",
        window: "readonly",
        CustomEvent: "readonly",
        exports: "readonly",
        Text: "readonly",
        test: "readonly",
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  }
];
