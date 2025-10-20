/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' } // ให้โหลดรูปจากทุกโดเมนได้
    ]
  }
};
export default nextConfig;
