// Conajra Solutions © 2026
// Author: Marwan

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["src/modules/storage/**/*.ts", "!src/**/*.test.ts"],
    coverageThreshold: {
        "src/modules/storage/db/index.ts": {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};
