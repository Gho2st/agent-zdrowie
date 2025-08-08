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
};

export default nextConfig;
