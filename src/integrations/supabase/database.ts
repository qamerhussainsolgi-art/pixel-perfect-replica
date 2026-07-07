// Manually-augmented Database type to cover schema changes applied
// directly in Supabase that the auto-generated `./types` file has not
// been regenerated for yet: `seasonal_categories`, `product_type_categories`,
// and the extended columns on `products`.

import type { Database as GeneratedDatabase } from "./types";

type Extras = {
  seasonal_categories: {
    Row: { id: string; name: string; created_at: string };
    Insert: { id?: string; name: string; created_at?: string };
    Update: { id?: string; name?: string; created_at?: string };
    Relationships: [];
  };
  product_type_categories: {
    Row: { id: string; name: string; created_at: string };
    Insert: { id?: string; name: string; created_at?: string };
    Update: { id?: string; name?: string; created_at?: string };
    Relationships: [];
  };
  contact_submissions: {
    Row: { id: string; name: string; email: string; message: string; created_at: string };
    Insert: { id?: string; name: string; email: string; message: string; created_at?: string };
    Update: { id?: string; name?: string; email?: string; message?: string; created_at?: string };
    Relationships: [];
  };
  custom_order_requests: {
    Row: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      garment_type: string;
      fabric_preference: string | null;
      budget_range: string | null;
      reference_image_url: string | null;
      details: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      phone: string;
      email?: string | null;
      garment_type: string;
      fabric_preference?: string | null;
      budget_range?: string | null;
      reference_image_url?: string | null;
      details?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string | null;
      garment_type?: string;
      fabric_preference?: string | null;
      budget_range?: string | null;
      reference_image_url?: string | null;
      details?: string | null;
      created_at?: string;
    };
    Relationships: [];
  };
};

type ProductExtras = {
  discount_percentage: number | null;
  image_url_1: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  seasonal_category_id: string | null;
  product_type_category_id: string | null;
};

type ProductExtrasOptional = {
  discount_percentage?: number | null;
  image_url_1?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  seasonal_category_id?: string | null;
  product_type_category_id?: string | null;
};

type BaseProducts = GeneratedDatabase["public"]["Tables"]["products"];

type ExtendedProducts = {
  Row: BaseProducts["Row"] & ProductExtras;
  Insert: BaseProducts["Insert"] & ProductExtrasOptional;
  Update: BaseProducts["Update"] & ProductExtrasOptional;
  Relationships: [
    {
      foreignKeyName: "products_seasonal_category_id_fkey";
      columns: ["seasonal_category_id"];
      isOneToOne: false;
      referencedRelation: "seasonal_categories";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "products_product_type_category_id_fkey";
      columns: ["product_type_category_id"];
      isOneToOne: false;
      referencedRelation: "product_type_categories";
      referencedColumns: ["id"];
    }
  ];
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: Omit<GeneratedDatabase["public"]["Tables"], "products"> &
      Extras & {
        products: ExtendedProducts;
      };
  };
};
