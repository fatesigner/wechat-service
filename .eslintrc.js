// 如果您的项目使用 typescript，添加 ts 配置
const tslint = require('@fatesigner/eslint-config/ts');

module.exports = {
  extends: '@fatesigner/eslint-config',
  overrides: [tslint]
};
