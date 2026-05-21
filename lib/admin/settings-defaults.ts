export type ProductSettings = {
  name: string;
  description: string;
  prices: { "1": number; "2": number; "3": number };
  images: string[];
};

export type BrandSettings = {
  name: string;
  tagline: string;
  logo_url: string;
};

export const DEFAULT_PRODUCT_SETTINGS: ProductSettings = {
  name: "Олон цэцгийн 100% цэвэр зөгийн бал",
  description:
    "Байгалийн цэвэр, химийн бодис агуулаагүй, шууд үйлдвэрлэгчээс",
  prices: { "1": 39000, "2": 78000, "3": 117000 },
  images: [],
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  name: "ТИТЭМ",
  tagline: "Premium Honey",
  logo_url: "",
};

export type SettingsKey = "product" | "brand";
