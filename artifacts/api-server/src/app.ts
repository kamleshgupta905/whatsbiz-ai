import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { existsSync } from "fs";
import { join } from "path";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const staticDirCandidates = [
  process.env.WEB_DIST_DIR,
  join(process.cwd(), "artifacts", "whatsbiz", "dist"),
  join(process.cwd(), "artifacts", "whatsbiz", "dist", "public"),
  join(process.cwd(), "..", "whatsbiz", "dist"),
  join(process.cwd(), "..", "whatsbiz", "dist", "public"),
].filter((dir): dir is string => Boolean(dir));
const webDistDir = staticDirCandidates.find((dir) => existsSync(join(dir, "index.html")));

if (webDistDir && existsSync(webDistDir)) {
  app.use(express.static(webDistDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(join(webDistDir, "index.html"));
  });
}

export default app;
