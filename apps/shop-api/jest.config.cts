module.exports = {
  displayName: 'shop-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // @nestjs/mail ships ESM only: compile it to CommonJS so specs can render real mail.
    '/node_modules/@nestjs/mail/.+\\.js$': [
      'ts-jest',
      { tsconfig: { allowJs: true, module: 'commonjs', target: 'es2022' }, isolatedModules: true }
    ],
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  transformIgnorePatterns: ['/node_modules/(?!@nestjs/mail/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/shop-api'
};
