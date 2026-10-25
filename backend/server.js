
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const pool = require("./db");

const STEPS = [
  "Code review completed",
  "Tests passed",
  "Build verified",
  "Environment variables checked",
  "Database migrations completed",
  "Security checks completed",
  "Staging deployment verified",
  "Production deployment verified",
];

function getStatus(completedSteps) {
  if (completedSteps.length === 0) return "planned";
  if (completedSteps.length === STEPS.length) return "done";
  return "ongoing";
}

function formatRelease(row) {
  const completedSteps = row.completed_steps || [];

  return {
    id: String(row.id),
    name: row.name,
    releaseDate: row.release_date.toISOString(),
    additionalInfo: row.additional_info || "",
    steps: STEPS.map((title, index) => ({
      id: String(index + 1),
      title,
      completed: completedSteps.includes(index + 1),
    })),
    status: getStatus(completedSteps),
    createdAt: row.created_at.toISOString(),
  };
}

const typeDefs = `#graphql
  type Step {
    id: ID!
    title: String!
    completed: Boolean!
  }

  type Release {
    id: ID!
    name: String!
    releaseDate: String!
    additionalInfo: String!
    steps: [Step!]!
    status: String!
    createdAt: String!
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(
      name: String!
      releaseDate: String!
      additionalInfo: String
    ): Release!

    updateStep(
      releaseId: ID!
      stepId: ID!
      completed: Boolean!
    ): Release!

    updateAdditionalInfo(
      releaseId: ID!
      additionalInfo: String!
    ): Release!

    deleteRelease(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    releases: async () => {
      const result = await pool.query(
        "SELECT * FROM releases ORDER BY release_date ASC"
      );
      return result.rows.map(formatRelease);
    },

    release: async (_, { id }) => {
      const result = await pool.query(
        "SELECT * FROM releases WHERE id = $1",
        [id]
      );
      return result.rows[0] ? formatRelease(result.rows[0]) : null;
    },
  },

  Mutation: {
    createRelease: async (_, { name, releaseDate, additionalInfo = "" }) => {
      if (!name.trim()) {
        throw new Error("Release name is required");
      }

      if (Number.isNaN(Date.parse(releaseDate))) {
        throw new Error("A valid release date is required");
      }

      const result = await pool.query(
        `INSERT INTO releases
          (name, release_date, additional_info, completed_steps)
         VALUES ($1, $2, $3, '[]'::jsonb)
         RETURNING *`,
        [name.trim(), releaseDate, additionalInfo]
      );

      return formatRelease(result.rows[0]);
    },

    updateStep: async (_, { releaseId, stepId, completed }) => {
      const stepNumber = Number(stepId);

      if (
        !Number.isInteger(stepNumber) ||
        stepNumber < 1 ||
        stepNumber > STEPS.length
      ) {
        throw new Error("Invalid checklist step");
      }

      const result = await pool.query(
        "SELECT * FROM releases WHERE id = $1",
        [releaseId]
      );

      if (!result.rows[0]) {
        throw new Error("Release not found");
      }

      const current = result.rows[0];
      let completedSteps = current.completed_steps || [];

      completedSteps = completed
        ? [...new Set([...completedSteps, stepNumber])]
        : completedSteps.filter((step) => step !== stepNumber);

      const updated = await pool.query(
        `UPDATE releases
         SET completed_steps = $1::jsonb
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(completedSteps), releaseId]
      );

      return formatRelease(updated.rows[0]);
    },

    updateAdditionalInfo: async (_, { releaseId, additionalInfo }) => {
      const result = await pool.query(
        `UPDATE releases
         SET additional_info = $1
         WHERE id = $2
         RETURNING *`,
        [additionalInfo, releaseId]
      );

      if (!result.rows[0]) {
        throw new Error("Release not found");
      }

      return formatRelease(result.rows[0]);
    },

    deleteRelease: async (_, { id }) => {
      const result = await pool.query(
        "DELETE FROM releases WHERE id = $1",
        [id]
      );

      return result.rowCount > 0;
    },
  },
};

async function startServer() {
  const app = express();
  app.use(cors());

  const result = await pool.query("SELECT NOW()");
  console.log("PostgreSQL connected:", result.rows[0].now);

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server)
  );

  app.listen(process.env.PORT || 4000, () => {
    console.log("Backend running at http://localhost:4000/graphql");
  });
}

startServer().catch((error) => {
  console.error("Backend startup failed:", error);
  process.exit(1);
});
