module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "your-cdn.example.com" },
      { protocol: "https", hostname: "supabase.co" }, // ถ้าใช้ Supabase
      // เพิ่มโดเมนรูปอื่น ๆ ที่ใช้จริง
    ],
  },
};
