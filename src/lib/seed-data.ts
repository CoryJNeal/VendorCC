export const CRM_VENDOR = {
  id: "crm-footwear-vendor",
  name: "Footwear Vendor",
  category: "Footwear",
  source: "Internal CRM",
} as const;

export const YTD_METRICS = {
  orders: 4_842_650,
  returns: 312_480,
} as const;

export type TopStyle = {
  styleNumber: string;
  name: string;
  brand: string;
  revenue: number;
};

export const TOP_STYLES: TopStyle[] = [
  {
    styleNumber: "FW-2104",
    name: "Trailridge Boot",
    brand: "RidgeLine",
    revenue: 612_400,
  },
  {
    styleNumber: "FW-1882",
    name: "Harbor Slip-On",
    brand: "CoastForm",
    revenue: 498_220,
  },
  {
    styleNumber: "FW-3051",
    name: "Metro Flex Runner",
    brand: "StrideWorks",
    revenue: 441_875,
  },
  {
    styleNumber: "FW-0944",
    name: "Forge Safety Toe",
    brand: "RidgeLine",
    revenue: 387_150,
  },
  {
    styleNumber: "FW-2710",
    name: "Summit Hiker Mid",
    brand: "PeakPath",
    revenue: 329_960,
  },
  {
    styleNumber: "FW-4418",
    name: "Canvas Court Low",
    brand: "CoastForm",
    revenue: 286_410,
  },
  {
    styleNumber: "FW-1190",
    name: "Nightshift Clog",
    brand: "StrideWorks",
    revenue: 241_775,
  },
  {
    styleNumber: "FW-3302",
    name: "Alpine Insulated",
    brand: "PeakPath",
    revenue: 198_640,
  },
  {
    styleNumber: "FW-0771",
    name: "Dockside Oxford",
    brand: "CoastForm",
    revenue: 164_330,
  },
  {
    styleNumber: "FW-5520",
    name: "Workshop Slip Resistant",
    brand: "RidgeLine",
    revenue: 142_890,
  },
];

export type MonthlyRow = {
  month: string;
  orders: number;
  returns: number;
};

export const MONTHLY_PERFORMANCE: MonthlyRow[] = [
  { month: "Jan 2026", orders: 480_200, returns: 28_140 },
  { month: "Feb 2026", orders: 509_850, returns: 31_220 },
  { month: "Mar 2026", orders: 545_410, returns: 29_680 },
  { month: "Apr 2026", orders: 589_760, returns: 38_410 },
  { month: "May 2026", orders: 620_140, returns: 42_050 },
  { month: "Jun 2026", orders: 579_880, returns: 36_190 },
  { month: "Jul 2026", orders: 530_225, returns: 34_760 },
  { month: "Aug 2026", orders: 494_610, returns: 38_090 },
  { month: "Sep 2026", orders: 492_575, returns: 33_940 },
];

export const PIE_COLORS = [
  "#1a6b63",
  "#2f8a7e",
  "#0f2a32",
  "#4aa394",
  "#5f7a76",
  "#7eb8ad",
  "#c46b2d",
  "#3d6b8a",
  "#8a6b3d",
  "#6b4a8a",
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
