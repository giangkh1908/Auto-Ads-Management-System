// jest.config.cjs
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  // Cho phép transform ESM trong một số node_modules ESM
  transformIgnorePatterns: ["/node_modules/(?!(uuid|p-limit|yocto-queue)/)"],
};