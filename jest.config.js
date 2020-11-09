module.exports = {
    transformIgnorePatterns: [
        'node_modules/(?!shiva/)',
    ],
    globals: {
        'ts-jest': {
            tsConfigFile: 'tsconfig.test.json',
        }
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.schema.ts',
        '!src/schema/*.ts',
    ],
    testMatch: [
        '<rootDir>/src/**/?(*.)test.ts',
        '<rootDir>/tests/**/?(*.)test.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
        }
    },
    moduleFileExtensions: [
        'ts',
        'js',
    ],
    transform: {
        '\\.(ts)$': '<rootDir>/node_modules/ts-jest/preprocessor.js',
        '^.+\\.js$': 'babel-jest',
    }
};