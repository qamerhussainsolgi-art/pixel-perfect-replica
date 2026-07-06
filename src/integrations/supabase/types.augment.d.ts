// Manual augmentation of the auto-generated Supabase Database type.
// Added because the migration for seasonal_categories, product_type_categories,
// and the extended `products` columns was run directly in Supabase and the
// auto-generated types.ts has not been regenerated. Safe to delete once
// `types.ts` is regenerated to include the same shape.

import type { Database as GeneratedDatabase } from "./types";

type WithExtras = GeneratedDatabase & {
  public: {
    Tables: {
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
      products: {
        Row: GeneratedDatabase["public"]["Tables"]["products"]["Row"] & {
          discount_percentage: number | null;
          image_url_1: string | null;
          image_url_2: string | null;
          image_url_3: string | null;
          image_url_4: string | null;
          seasonal_category_id: string | null;
          product_type_category_id: string | null;
        };
        Insert: GeneratedDatabase["public"]["Tables"]["products"]["Insert"] & {
          discount_percentage?: number | null;
          image_url_1?: string | null;
          image_url_2?: string | null;
          image_url_3?: string | null;
          image_url_4?: string | null;
          seasonal_category_id?: string | null;
          product_type_category_id?: string | null;
        };
        Update: GeneratedDatabase["public"]["Tables"]["products"]["Update"] & {
          discount_percentage?: number | null;
          image_url_1?: string | null;
          image_url_2?: string | null;
          image_url_3?: string | null;
          image_url_4?: string | null;
          seasonal_category_id?: string | null;
          product_type_category_id?: string | null;
        };
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
    };
  };
};

declare module "./types" {
  // Re-declare Database as the augmented shape. Type-only override.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Database extends WithExtras {}
}
