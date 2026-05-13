import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const reactQueryAlias = "./node_modules/@tanstack/react-query";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  transpilePackages: ["@workspace/api-client-react"],
  turbopack: {
    root: resolve(appDir, "../.."),
    resolveAlias: {
      "@tanstack/react-query": reactQueryAlias,
    },
  },
  webpack(config) {
    config.resolve.alias["@tanstack/react-query"] = resolve(appDir, "node_modules/@tanstack/react-query");
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
