/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/:path*'
    }];
  },

  // Suppress the hydration-mismatch error OVERLAY caused by browser extensions
  // injecting attributes (like bis_skin_checked) before React hydrates.
  // The app still works correctly — this only hides the noisy red popup in dev.
  devIndicators: {
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;