/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // For Google profile images
        port: "",
        pathname: "**",
      },
    ],
  },
  experimental: {
    nodeMiddleware: true, // 👈 WYMAGANE do runtime: "nodejs"
  },
};

export default nextConfig;
