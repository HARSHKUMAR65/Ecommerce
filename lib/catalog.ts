import data from "./catalog-data.json";

export type ProductKind =
  "Top" | "Outerwear" | "Bottom" | "Shoes" | "Accessory";
export interface Product {
  id: string;
  name: string;
  kind: ProductKind;
  priceCents: number;
  sizes: string[];
  li: number;
  pi: number;
  look: string;
  color: string;
  swatch: string;
  description: string;
  image: string;
  model: string;
}
export interface Look {
  name: string;
  foot: number;
  tags: number[][];
  subtotal: number;
}
export const products = data.products as Product[];
export const looks = data.looks as Look[];
export const productById = (id: string) => products.find((p) => p.id === id);
export const lookProducts = (index: number) =>
  products.filter((p) => p.li === index);
export const categories = [
  "All",
  "Top",
  "Outerwear",
  "Bottom",
  "Shoes",
  "Accessory",
] as const;
export const categoryLabel = (value: string) =>
  ({
    All: "All pieces",
    Top: "Tops",
    Bottom: "Bottoms",
    Outerwear: "Outerwear",
    Shoes: "Footwear",
    Accessory: "Accessories",
  })[value] || value;
