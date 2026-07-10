export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  how_did_you_hear_about_us?: string;
  status?: string;
  created_at?: string;
}

export interface B2BApplication {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  how_did_you_hear_about_us?: string;
  company_name?: string;
  company_website?: string;
  resale_tax_id_number?: string;
  fax?: string;
  wants_credit_application?: string | boolean;
  additional_company_details?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  approval_status: string;
  created_at: string;
  documents?: { file_url: string; original_filename: string }[];
  review_notes?: string;
  users?: { email: string };
  business_type?: string;
  resale_license?: string;
  wholesale_discount_pct?: number;
  notes?: string;
  tax_id?: string;
  website?: string;
  addresses?: any[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  is_active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  position?: number;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_global: boolean;
  attribute_values?: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  label?: string;
  color_hex?: string;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  regular_price?: number;
  sale_price?: number;
  stock_status?: string;
  stock_quantity?: number;
  is_published?: boolean;
  brands?: { id: string; name: string };
  product_tags?: any[];
}
