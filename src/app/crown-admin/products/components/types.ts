export interface Variation {
  id: number;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  weight_g: number | null;
  position: number;
  image?: ProductImage;
  attributes: { attribute_id: number; name: string; slug: string; value: string }[];
}

export interface ProductAttribute {
  id: number;
  attribute_id: number;
  name: string;
  slug: string;
  values: string;
  is_visible: boolean;
  is_for_variation: boolean;
}

export interface Category {
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
  in_stock: boolean;
  created_at: string;
  updated_at: string;
  attributes: ProductAttribute[];
  variations: Variation[];
  categories: Category[];
  images: ProductImage[];
}
