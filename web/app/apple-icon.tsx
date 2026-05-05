import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at top, #1a1f2e 0%, #07090d 70%)",
          borderRadius: 36,
        }}
      >
        <svg width="120" height="132" viewBox="0 0 2664.92 3138.62" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1320.51,3617.28h334.33l726.5-855.68h826l-193.76,855.68h261.22L3985.43,478.66ZM3265,2506.82H2597.65l910-1071.79Z"
            transform="translate(-1320.51 -478.66)"
            fill="#ECEDEE"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
