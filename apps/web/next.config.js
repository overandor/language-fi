/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    "@languagefi/db",
    "@languagefi/core",
    "@languagefi/oracle",
    "@languagefi/providers",
    "@languagefi/reports",
    "@languagefi/yield",
    "@languagefi/arb",
    "@languagefi/engine",
    "@languagefi/indexer",
    "@languagefi/registry",
    "@languagefi/staking",
  ],
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_LGU_CONTRACT: process.env.NEXT_PUBLIC_LGU_CONTRACT,
    NEXT_PUBLIC_STAKING_CONTRACT: process.env.NEXT_PUBLIC_STAKING_CONTRACT,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'pdfkit', 'fontkit', 'iconv-lite', 'restructure');
    return config;
  },
}

module.exports = nextConfig
