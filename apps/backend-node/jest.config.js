/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@workorderpro/shared$': '<rootDir>/../../packages/shared/src/index.ts'
    }
};
