import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		cacheComponents: true,
		reactCompiler: true,
		ppr: true,
	},
};

export default nextConfig;
