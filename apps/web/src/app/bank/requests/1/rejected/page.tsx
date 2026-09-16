import { BankRequestResultDetail } from "../request-detail-state";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/c8da81f6-e3a8-4654-bfb5-8a6c169e9762.png",
  logo: "https://www.figma.com/api/mcp/asset/78920320-b2ad-4232-b64e-b71fafebfb48.png",
  dot: "https://www.figma.com/api/mcp/asset/e4cdc405-62f7-461e-8a44-cc3088b47dc9.svg",
  check: "https://www.figma.com/api/mcp/asset/d5630b1b-05e6-4e15-9def-2b14e157b0a1.svg",
  home: "https://www.figma.com/api/mcp/asset/b457dfe3-6743-48c7-a5de-aa7aaccce8df.svg",
  requests: "https://www.figma.com/api/mcp/asset/3b42e012-2221-4e1a-bf63-9635ce56742a.svg",
  plans: "https://www.figma.com/api/mcp/asset/acbcb7d2-d910-4a18-9532-085b443e7a29.svg",
  payments: "https://www.figma.com/api/mcp/asset/0891db41-d993-4c4c-a81b-23f6b5f657a4.svg",
  settings: "https://www.figma.com/api/mcp/asset/dcdeb8a9-f0bb-46c8-a940-eb50915690f1.svg",
  logout: "https://www.figma.com/api/mcp/asset/722f30c2-510b-40ef-8fcf-e58941ed7d94.svg",
} as const;

export default function BankRequestRejectedPage() {
  return <BankRequestResultDetail variant="rejected" assets={assets} nodeId="309:208" />;
}
