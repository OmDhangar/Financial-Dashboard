import type { Config
} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests /**/*.test.ts'
    ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    },
  collectCoverageFrom: [
    'src /**/*.ts',
    '!src/server.ts',
    '!src/config/swagger.ts',
    '!src /**/*.d.ts',
    ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'
    ],
  testTimeout: 30000,
  globalSetup: undefined,
  globalTeardown: undefined,
};

export default config;