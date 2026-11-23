module.exports = {
  displayName: 'shop-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // @nestjs/mail and @nestjs/passport ship ESM only: compile them to CommonJS for Jest.
    '/node_modules/@nestjs/(mail|passport)/.+\\.js$': [
      'ts-jest',
      { tsconfig: { allowJs: true, module: 'commonjs', target: 'es2022' }, isolatedModules: true }
    ],
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  transformIgnorePatterns: ['/node_modules/(?!@nestjs/(mail|passport)/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/shop-api'
};
