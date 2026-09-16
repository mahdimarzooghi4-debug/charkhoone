import { BankRequestResultDetail } from "../request-detail-state";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/7dcbda3b-12da-4b64-a402-408a5de554a2.png",
  logo: "https://www.figma.com/api/mcp/asset/3389382b-0334-4214-883b-99e2515cac2e.png",
  dot: "https://www.figma.com/api/mcp/asset/30d9b783-9c38-4a27-8fc1-6e0655d95a98.svg",
  check: "https://www.figma.com/api/mcp/asset/c3007365-a07e-43e5-b161-2d05badcd643.svg",
  home: "https://www.figma.com/api/mcp/asset/03d9bfc5-6b8d-436a-9a41-b180b675876f.svg",
  requests: "https://www.figma.com/api/mcp/asset/2d8565ff-8e23-4eef-b76b-638aae3cf9cd.svg",
  plans: "https://www.figma.com/api/mcp/asset/172edc81-fe21-4ead-a489-ff394c13de55.svg",
  payments: "https://www.figma.com/api/mcp/asset/9ebd740f-031a-4323-b300-d4206c3c755f.svg",
  settings: "https://www.figma.com/api/mcp/asset/f7ec7f3d-cd1e-4576-ae13-5526030ddd1a.svg",
  logout: "https://www.figma.com/api/mcp/asset/1e12d5cb-d0e8-4892-85cc-b9572f297ea9.svg",
} as const;

export default function BankRequestApprovedPage() {
  return <BankRequestResultDetail variant="approved" assets={assets} nodeId="314:2" />;
}
