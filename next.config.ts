import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  typescript: {
    ignoreBuildErrors: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
=======
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
>>>>>>> fb21639a15403d6ae108c5df209a8645bddce4ad
};

export default nextConfig;
