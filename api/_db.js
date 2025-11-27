import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING, 
  ssl: {
    rejectUnauthorized: false, 
  },
});
