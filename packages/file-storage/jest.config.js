/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('../../jest.config.base.js');
const pkg = require('./package.json');

const projectName = pkg.name.split('@s1seven/nestjs-tools-').pop();

module.exports = {
  ...base,
  displayName: pkg.name,
  rootDir: '../..',
  testMatch: [`<rootDir>/packages/${projectName}/**/*.spec.ts`, `<rootDir>/packages/${projectName}/**/*.e2e-spec.ts`],
  coverageDirectory: `<rootDir>/packages/${projectName}/coverage/`,
  coverageReporters: ['json'],
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 10,
      functions: 15,
      lines: 30,
    },
  },
  moduleDirectories: ['node_modules'],
};
