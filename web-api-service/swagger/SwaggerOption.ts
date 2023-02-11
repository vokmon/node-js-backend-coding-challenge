/**
 * Setup Swagger options
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Code Challenge API Swagger",
      version: "0.1.0",
      description:
        "Swagger document for Code Challenge API Swagger",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export default options;