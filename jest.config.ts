module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "test/(.*)": "<rootDir>/test/$1",
    },
    resetMocks: true,
    collectCoverageFrom: ["**/src/controllers/*.ts", "**/src/managers/**/*.ts", "**/src/middlewares/*.ts"],
};
