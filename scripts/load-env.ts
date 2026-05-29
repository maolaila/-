import dotenv from "dotenv";

const envFile = process.env.ENV_FILE;
const result = dotenv.config(envFile ? { path: envFile, override: true, quiet: true } : { quiet: true });

if (envFile && result.error) {
  throw new Error(`Failed to load ENV_FILE=${envFile}: ${result.error.message}`);
}
