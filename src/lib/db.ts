import mysql from "mysql2";

const uri = process.env.DB_URI;

if (!uri) {
  throw new Error("Database URI is not defined in environment variables");
}

const pool = mysql
  .createPool({
    uri: uri,
    ssl: {
      rejectUnauthorized: false,
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

pool
  .query("SELECT 1")
  .then(() => {
    console.log("Connected to MySQL database");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

export default pool;
