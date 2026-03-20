/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  // Integration tests share a DB; run sequentially to avoid interference
  maxWorkers: 1,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
