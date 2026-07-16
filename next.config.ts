import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Раннер песочницы грузится в iframe c sandbox="allow-scripts" — у него
 * opaque origin, поэтому X-Frame-Options DENY/SAMEORIGIN его блокируют.
 * Разрешаем фрейминг только собственному приложению через CSP frame-ancestors
 * (матчится по URL родительского документа, а не по origin фрейма) и запрещаем
 * раннеру всё лишнее: сеть — только jsdelivr (Pyodide), никаких форм и фреймов.
 */
const sandboxHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'none'",
      "script-src 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
      "worker-src blob:",
      "connect-src https://cdn.jsdelivr.net",
      "frame-ancestors 'self'",
      "form-action 'none'",
      "base-uri 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sandbox/:path*",
        headers: sandboxHeaders,
      },
      {
        source: "/((?!sandbox/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
