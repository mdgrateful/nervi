import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // Enable DNS prefetching for faster page loads
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            // Enforce HTTPS in production (HTTP Strict Transport Security)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            // Prevent clickjacking attacks
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            // Enable XSS protection in older browsers
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            // Control referrer information sent to other sites
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Restrict which features and APIs can be used
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            // Content Security Policy - prevents XSS and injection attacks
            // Note: Adjust 'self' and domains as needed for your app
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval for dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.stripe.com https://api.anthropic.com",
              "frame-src 'self' https://*.stripe.com",
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
