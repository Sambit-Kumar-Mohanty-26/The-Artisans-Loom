module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": "off",
    "linebreak-style": 0,
    
    "max-len": "off",

    "indent": "off",

    "object-curly-spacing": "off",

    "comma-dangle": "off",

    "padded-blocks": "off",

    "no-multi-spaces": "off",

    "no-trailing-spaces": "off",
    "eol-last": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
