import { rmSync } from "node:fs";
import { join } from "node:path";

try {
  rmSync(join(process.cwd(), ".next", "dev"), { force: true, recursive: true });
} catch (error) {
  if (error?.code !== "EPERM") {
    throw error;
  }

  console.warn("Skipped locked .next/dev cache cleanup on Windows. Close running dev servers if build issues persist.");
}
