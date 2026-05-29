import app from "./app";
import { logger } from "./lib/logger";
import { sampleAllSources } from "./lib/dataSampler";

const rawPort = process.env["PORT"] || "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Export for Vercel serverless
export default app;

// Listen only if not running in Vercel
if (process.env.VERCEL !== "1") {
  app.listen(port, async (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    // Sample data from web sources on startup
    try {
      logger.info("Sampling data from web sources...");
      await sampleAllSources();
      logger.info("Initial data sampling complete");
    } catch (error) {
      logger.error({ error }, "Initial data sampling failed");
    }
  });
}
