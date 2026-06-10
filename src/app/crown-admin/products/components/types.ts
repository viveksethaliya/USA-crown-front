export interface Variation {
  id: number;
  sku: string;
  enabled: boolean;
  manage_stock: boolean;
  stock_qty: number | null;
  in_stock: boolean;
  low_stock_amount: number | null;
  backorders_allowed: boolean;
  regular_price: number | null;
  sale_price: number | null;
  date_sale_starts: string | null;
  date_sale_ends: string | null;
  weight_g: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  position: number;
  image?: ProductImage;
  attributes: { attribute_id: number; term_id?: number | null; name: string; slug: string; value: string }[];
}

export interface ProductAttribute {
  id: number;
  attribute_id: number;
  name: string;
  slug: string;
  values: string;
  term_ids?: number[];
  is_visible: boolean;
  is_for_variation: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
  alt_text: string | null;
  product_id: number | null;
  variation_id: number | null;
}

export interface ProductData {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  published: boolean;
  is_featured: boolean;
  visibility: string;
  short_description: string;
  description: string;
  tax_status: string;
  tax_class: string;
  weight_g: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  allow_reviews: boolean;
  purchase_note: string;
  position: number;
  regular_price: number | null;
  sale_price: number | null;
  date_sale_starts: string | null;
  date_sale_ends: string | null;
  manage_stock: boolean;
  stock_qty: number | null;
  low_stock_amount: number | null;
  backorders_allowed: boolean;
  sold_individually: boolean;
  meta_title: string;
  meta_description: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
  attributes: ProductAttribute[];
  variations: Variation[];
  categories: Category[];
  tags: Tag[];
  images: ProductImage[];
}
