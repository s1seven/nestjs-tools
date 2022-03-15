/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('../../jest.config.base.js');
const pkg = require('./package.json');

const projectName = pkg.name.split('@s1seven/microservices-').pop();

module.exports = {
  ...base,
  name: pkg.name,
  displayName: pkg.name,
  rootDir: '../..',
  testMatch: [`<rootDir>/packages/${projectName}/**/*.spec.ts`, `<rootDir>/packages/${projectName}/**/*.e2e-spec.ts`],
  coverageDirectory: `<rootDir>/packages/${projectName}/coverage/`,
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 25,
      functions: 30,
      lines: 40,
    },
  },
  reporters: ['default'],
  moduleDirectories: ['node_modules'],
  // modulePaths: [`<rootDir>/packages/${projectName}/src/`],
};
