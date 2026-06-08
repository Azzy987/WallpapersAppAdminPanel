import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { ServerResponse } from "http";
import { componentTagger } from "lovable-tagger";

function createVercelResponseAdapter(res: ServerResponse) {
  let statusCode = 200;
  const adapter = {
    status(code: number) {
      statusCode = code;
      return adapter;
    },
    setHeader(key: string, value: string) {
      res.setHeader(key, value);
      return adapter;
    },
    json(data: unknown) {
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
      return adapter;
    },
    end() {
      res.statusCode = statusCode;
      res.end();
      return adapter;
    },
  };
  return adapter;
}

function apiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "vite-api-dev",
    configureServer(server) {
      const envKeys = [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_S3_REGION",
        "AWS_S3_BUCKET",
        "CLOUDFRONT_DOMAIN",
        "IMAGE_TRANSFORM_PATTERN",
      ];
      for (const key of envKeys) {
        if (env[key]) process.env[key] = env[key];
      }

      server.middlewares.use((req, res, next) => {
        const apiRoutes: Record<string, string> = {
          "/api/s3-presign-upload": "./api/s3-presign-upload.ts",
          "/api/image-metadata": "./api/image-metadata.ts",
        };
        const apiRoute = Object.keys(apiRoutes).find((route) => req.url?.startsWith(route));

        if (!apiRoute) {
          return next();
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "authorization, x-client-info, apikey, content-type"
          );
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const { default: handler } = await import(apiRoutes[apiRoute]);
            const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
            const vercelReq = {
              method: "POST" as const,
              body,
              headers: req.headers,
            };
            await handler(vercelReq, createVercelResponseAdapter(res));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && apiDevPlugin(env),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
