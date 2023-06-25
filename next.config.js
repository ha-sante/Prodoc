const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/product', destination: '/', permanent: true },
    ]
  },

  async rewrites() {
    return [
      { source: '/docs', destination: '/' },
      { source: '/docs/api', destination: '/product-api-ref' },
      { source: '/docs/api/:slug*', destination: '/product-api-ref/:slug*' },
    ]
  },

  experimental: {
    swcPlugins: [['@swc-jotai/react-refresh', {}]],
  },

  webpack: (config) => {
    // this will override the experiments
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // this will just update topLevelAwait property of config.experiments
    // config.experiments.topLevelAwait = true 
    return config;
  },
}

// The above is made to support all domain use-cases
// Think doc.example.com (Goes to product-docs-page)
// example.com/docs (Goes to product-docs-page)
// example.com/docs/api (Main page for the api page)
// docs.example.com/docs/api (- Less pleasing but forgivable as the main dapi ocs page)

module.exports = nextConfig