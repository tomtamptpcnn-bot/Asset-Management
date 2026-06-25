import { AssetType } from "@prisma/client";

export type MarketQuote = {
  price: number;
  currency: "THB" | "USD";
  source: string;
  pricedAt: Date;
};

const auroraGoldPriceUrl =
  "https://www.aurora.co.th/price/gold_pricelist/%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%97%E0%B8%AD%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B8%99%E0%B8%B5%E0%B9%89";

export async function getMarketQuote(type: AssetType, symbol?: string | null): Promise<MarketQuote> {
  if (type === "GOLD") return getGoldQuote();
  if (type === "CRYPTO") return getCryptoQuote(symbol);
  if (type === "STOCK" || type === "FUND") return getStockQuote(symbol);
  throw new Error("สินทรัพย์ประเภทนี้ยังไม่มี market price provider");
}

async function getStockQuote(symbol?: string | null): Promise<MarketQuote> {
  if (!symbol) throw new Error("กรุณาระบุ symbol หุ้นก่อน เช่น AAPL หรือ SET:AOT");
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("กรุณาตั้งค่า FINNHUB_API_KEY ใน .env เพื่อดึงราคาหุ้น");

  const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`, {
    next: { revalidate: 0 }
  });
  if (!response.ok) throw new Error("ดึงราคาหุ้นไม่สำเร็จ");

  const data = (await response.json()) as { c?: number; t?: number };
  if (!data.c) throw new Error("ไม่พบราคาล่าสุดของหุ้นนี้");

  return {
    price: data.c,
    currency: "USD",
    source: "Finnhub",
    pricedAt: data.t ? new Date(data.t * 1000) : new Date()
  };
}

async function getCryptoQuote(symbol?: string | null): Promise<MarketQuote> {
  if (!symbol) throw new Error("กรุณาระบุ symbol เหรียญก่อน เช่น BTC หรือ ETH");
  const apiKey = process.env.COINGECKO_API_KEY;
  const baseUrl = apiKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
  const headers = apiKey ? { "x-cg-pro-api-key": apiKey } : undefined;
  const url = `${baseUrl}/simple/price?symbols=${encodeURIComponent(symbol.toLowerCase())}&vs_currencies=thb&include_last_updated_at=true`;

  const response = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!response.ok) throw new Error("ดึงราคาคริปโตไม่สำเร็จ");

  const data = (await response.json()) as Record<string, { thb?: number; last_updated_at?: number }>;
  const row = data[symbol.toLowerCase()];
  if (!row?.thb) throw new Error("ไม่พบราคาล่าสุดของเหรียญนี้");

  return {
    price: row.thb,
    currency: "THB",
    source: "CoinGecko",
    pricedAt: row.last_updated_at ? new Date(row.last_updated_at * 1000) : new Date()
  };
}

async function getGoldQuote(): Promise<MarketQuote> {
  const response = await fetch(auroraGoldPriceUrl, {
    headers: {
      "user-agent": "AssetLedger/1.0 (+https://localhost)"
    },
    next: { revalidate: 0 }
  });
  if (!response.ok) throw new Error("ดึงราคาทอง Aurora ไม่สำเร็จ");

  const html = await response.text();
  const text = normalizeHtmlText(html);
  const prices = parseAuroraGoldPrices(text);
  const priceMode = process.env.AURORA_GOLD_PRICE_MODE === "SELL" ? "SELL" : "BUYBACK";
  const price = priceMode === "SELL" ? prices.sell : prices.buyback;

  return {
    price,
    currency: "THB",
    source: `Aurora Gold ${priceMode === "SELL" ? "ขายออก" : "รับซื้อคืน"}`,
    pricedAt: new Date()
  };
}

function normalizeHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAuroraGoldPrices(text: string) {
  const summaryMatch = text.match(/ทองคำแท่ง\s+รับซื้อคืน\s+([\d,]+(?:\.\d+)?)\s+บาท\s+ขายออก\s+([\d,]+(?:\.\d+)?)/);
  if (summaryMatch) {
    return {
      buyback: parsePrice(summaryMatch[1]),
      sell: parsePrice(summaryMatch[2])
    };
  }

  const tableMatch = text.match(/\d{1,2}:\d{2}(?::\d{2})?\s*น\.\s*\d+\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
  if (tableMatch) {
    return {
      buyback: parsePrice(tableMatch[1]),
      sell: parsePrice(tableMatch[2])
    };
  }

  throw new Error("ไม่พบราคาทอง Aurora ล่าสุดบนหน้าเว็บ");
}

function parsePrice(value: string) {
  return Number(value.replace(/,/g, ""));
}
