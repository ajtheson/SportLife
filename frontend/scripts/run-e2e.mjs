import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = "http://127.0.0.1:3000";

function spawnCommand(command, args) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
}

async function waitForServer(processHandle) {
  const startedAt = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - startedAt < timeoutMs) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Next dev server exited with code ${processHandle.exitCode}`);
    }

    try {
      const response = await fetch(baseUrl, { method: "HEAD" });

      if (response.ok) {
        return;
      }
    } catch {
      await delay(500);
    }
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function isServerReady() {
  try {
    const response = await fetch(baseUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function stopProcessTree(processHandle) {
  if (!processHandle.pid || processHandle.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(processHandle.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });

    await new Promise((resolve) => {
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  processHandle.kill("SIGTERM");
  await new Promise((resolve) => {
    processHandle.on("exit", resolve);
    setTimeout(resolve, 5_000);
  });
}

async function run() {
  const shouldStartServer = !(await isServerReady());
  const server = shouldStartServer
    ? spawnCommand(process.execPath, [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3000",
      ])
    : null;

  try {
    if (server) {
      await waitForServer(server);
    }

    const testProcess = spawnCommand(process.execPath, ["node_modules/playwright/cli.js", "test"]);
    const exitCode = await new Promise((resolve) => {
      testProcess.on("exit", (code) => resolve(code ?? 1));
    });

    process.exitCode = exitCode;
  } finally {
    if (server) {
      await stopProcessTree(server);
    }
  }

  process.exit(process.exitCode ?? 0);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
