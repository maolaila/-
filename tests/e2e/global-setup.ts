import { execFileSync } from "node:child_process";

export default async function globalSetup() {
  execFileSync("pnpm", ["db:migrate"], { stdio: "inherit", shell: true });
  execFileSync("pnpm", ["db:seed"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ALLOW_INSECURE_SEED_DEFAULTS: "true",
      SEED_DEMO_DATA: "true"
    }
  });
}
