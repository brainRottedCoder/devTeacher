/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com', 'logo.clearbit.com'],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'zustand',
    ],
    serverComponentsExternalPackages: [
      '@anthropic-ai/sdk',
      'openai',
      'megallm',
    ],
  },
};

export default nextConfig;

