module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js"
  ],
  coverageThreshold: {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  transformIgnorePatterns: [
    "node_modules/(?!(mermaid|d3|d3-.*|internmap|delaunator|robust-predicates)/)"
  ],
  moduleNameMapper: {
    "^mermaid$": "<rootDir>/tests/__mocks__/mermaid.js"
  }
};
