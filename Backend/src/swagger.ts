export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Finance Dashboard API",
    version: "1.0.0",
    description: `Production-grade Finance Dashboard REST API.\n\n### Evaluation / Mock Users\nUse these credentials to test role-based access. You can call \`/api/v1/auth/login\` to obtain an access token and use it in the **Authorize** section.\n\n* **Admin**: \`admin@company.com\` | Password: \`Password123!\`\n* **Analyst**: \`analyst@company.com\` | Password: \`Password123!\`\n* **Viewer**: \`viewer@company.com\` | Password: \`Password123!\``,
  },
  servers: [
    {
      url: "/api/v1",
      description: "Relative URL (works on Local & Production)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/auth/login": {
      post: {
        summary: "Login to the API",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    example: "admin@company.com",
                  },
                  password: {
                    type: "string",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Successful login",
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    example: "John Doe",
                  },
                  email: {
                    type: "string",
                    example: "john@company.com",
                  },
                  password: {
                    type: "string",
                    example: "Password123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current logged-in user",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "User details",
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout user",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "Logout success",
          },
        },
      },
    },
    "/users": {
      get: {
        summary: "Get a list of users (Admin/Analyst only)",
        tags: ["Users"],
        responses: {
          "200": {
            description: "List of users",
          },
        },
      },
      post: {
        summary: "Create a user (Admin only)",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string", enum: ["VIEWER", "ANALYST", "ADMIN"] },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        tags: ["Users"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "User data" },
        },
      },
      patch: {
        summary: "Update user profile",
        tags: ["Users"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User updated" },
        },
      },
      delete: {
        summary: "Delete user",
        tags: ["Users"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/users/{id}/role": {
      patch: {
        summary: "Update user role (Admin only)",
        tags: ["Users"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["VIEWER", "ANALYST", "ADMIN"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Role updated" },
        },
      },
    },
    "/categories": {
      get: {
        summary: "Get all categories",
        tags: ["Categories"],
        responses: {
          "200": { description: "List of categories" },
        },
      },
      post: {
        summary: "Create a category (Admin only)",
        tags: ["Categories"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "Category created" },
        },
      },
    },
    "/categories/{id}": {
      delete: {
        summary: "Delete category",
        tags: ["Categories"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted" },
        },
      },
    },
    "/records": {
      get: {
        summary: "List records with filters",
        tags: ["Records"],
        parameters: [
          { in: "query", name: "type", schema: { type: "string", enum: ["INCOME", "EXPENSE"] } },
          { in: "query", name: "categoryId", schema: { type: "string" } },
          { in: "query", name: "startDate", schema: { type: "string", format: "date" } },
          { in: "query", name: "endDate", schema: { type: "string", format: "date" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
          { in: "query", name: "page", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Records returned" },
        },
      },
      post: {
        summary: "Create financial record",
        tags: ["Records"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "type", "categoryId", "date"],
                properties: {
                  amount: { type: "number", example: 100 },
                  type: { type: "string", enum: ["INCOME", "EXPENSE"], example: "EXPENSE" },
                  categoryId: { type: "string" },
                  date: { type: "string", format: "date-time", example: "2026-04-05T00:00:00Z" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Record created" },
        },
      },
    },
    "/records/{id}": {
      get: {
        summary: "Get specific record",
        tags: ["Records"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Record data" },
        },
      },
      patch: {
        summary: "Update record",
        tags: ["Records"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Record updated" },
        },
      },
      delete: {
        summary: "Soft delete record",
        tags: ["Records"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted" },
        },
      },
    },
    "/records/{id}/restore": {
      post: {
        summary: "Restore deleted record (Admin only)",
        tags: ["Records"],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Restored" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        summary: "Dashboard summary stats",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Returned data" },
        },
      },
    },
    "/dashboard/trends": {
      get: {
        summary: "Historical trend data",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Returned data" },
        },
      },
    },
    "/dashboard/categories": {
      get: {
        summary: "Category breakdown",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Returned data" },
        },
      },
    },
    "/dashboard/recent": {
      get: {
        summary: "Recent transactions",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Returned data" },
        },
      },
    },
    "/dashboard/by-user": {
      get: {
        summary: "Aggregated stats per user",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Returned data" },
        },
      },
    },
  },
};
