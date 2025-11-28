/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    allowedDevOrigins: ["http://localhost:3000", "http://192.168.1.32:3000"],
    images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "zwwjpxdlvyeyqpegphuu.supabase.co",
            pathname: "**",
          },
        ],
      },
};

export default config;
