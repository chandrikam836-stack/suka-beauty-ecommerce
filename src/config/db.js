const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

if (process.env.DB_DIALECT === "postgres") {
  // Production: real Postgres server (Render/Railway/Supabase etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions:
      process.env.NODE_ENV === "production"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  });
} else {
  // Local dev: zero-setup file-based SQLite DB, no install/server needed.
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "..", "database.sqlite"),
    logging: false,
  });
}

module.exports = sequelize;
