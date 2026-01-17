// Conajra Solutions © 2026
// Author: Marwan

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["tests/*.test.ts"],
    coverageThreshold: {
        "src/modules/database.ts": {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        },
        "src/modules/redis_client.ts": {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        } 
    }
};
