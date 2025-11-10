/** @type {import('next').NextConfig} */
const isPerfHardening = process.env.NEXT_PUBLIC_PERF_HARDENING === 'true'

// Bundle analyzer is optional - only load if package is installed and ANALYZE=true
let withBundleAnalyzer = null
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    })
  }
} catch (e) {
  // Bundle analyzer not installed, skip it
  console.log('Bundle analyzer not installed, skipping...')
}

const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable compression
  compress: true,
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    return config
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize for production
  productionBrowserSourceMaps: false,
}

// Only wrap with bundle analyzer if it's available
module.exports = withBundleAnalyzer ? withBundleAnalyzer(nextConfig) : nextConfig
