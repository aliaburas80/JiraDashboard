module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.(ts|tsx|js)$': ['ts-jest',{tsconfig:{allowJs:true,strict:false}}] },
};
