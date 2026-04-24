import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Finance - Track your income and expenses";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(to bottom right, #10b981, #047857)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          style={{ width: "80px", height: "80px", marginRight: "20px" }}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="14" rx="2" width="20" x="2" y="5" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
        <h1 style={{ fontSize: "80px", fontWeight: "bold", margin: 0 }}>
          Finance
        </h1>
      </div>
      <p
        style={{
          fontSize: "40px",
          marginTop: "20px",
          textAlign: "center",
          maxWidth: "800px",
        }}
      >
        Track your income and expenses with ease.
      </p>
    </div>,
    {
      ...size,
    },
  );
}
