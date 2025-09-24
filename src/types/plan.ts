export type Plan = {
  id: string;
  key: string; // ownedPackages için
  name: string;
  price: number;
  currency: "TRY";
  periodMonths: number;
  isActive: boolean;
  index: number;
  features: string[];
};
