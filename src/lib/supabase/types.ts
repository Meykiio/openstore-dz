/**
 * GENERATED FILE — do not hand-edit the shape of it.
 *
 * Regenerate after every schema change:
 *   npx supabase gen types typescript --project-id <project-ref> \
 *     > src/lib/supabase/types.ts
 * or the `generate_typescript_types` MCP tool against the linked project.
 *
 * The project ref is deliberately not recorded here. This repository is public
 * and meant to be forked, so it should not pin the original author's live
 * backend; `VITE_SUPABASE_PROJECT_ID` in `.env` is the source of that value.
 *
 * Two deviations from the raw generator output, both documented:
 *
 * 1. `order_items.product_name` and `unit_price` are marked required on Insert
 *    because they carry no SQL DEFAULT. They are actually filled by the
 *    `validate_order_item` BEFORE INSERT trigger from the catalogue. Clients
 *    never insert into `order_items` directly — `place_order()` is the path — so
 *    this only shows up if someone bypasses the RPC.
 *
 * 2. The `CompositeTypes` branch that indexes `DefaultSchema["CompositeTypes"]`
 *    is narrowed to `never`. This schema defines no composite types, so that
 *    mapped type is `{}`, and TypeScript 5 refuses to index `{}` with a generic
 *    type parameter. If a composite type is ever added, restore the generated
 *    branch.
 *
 * One addition rather than a deviation: `order_export_log` and
 * `order_export_targets` were written by hand in the generator's exact shape,
 * because regenerating the whole file to add two tables is a large diff to review
 * for no benefit. Regenerating will reproduce them; if it ever differs, the
 * generator wins.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      blocked_phones: {
        Row: {
          created_at: string;
          phone: string;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          phone: string;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          phone?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          name_fr: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          name_fr?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          name_fr?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          created_at: string;
          eta_days: number;
          fee: number;
          is_active: boolean;
          stopdesk_fee: number | null;
          updated_at: string;
          wilaya: string;
        };
        Insert: {
          created_at?: string;
          eta_days?: number;
          fee?: number;
          is_active?: boolean;
          stopdesk_fee?: number | null;
          updated_at?: string;
          wilaya: string;
        };
        Update: {
          created_at?: string;
          eta_days?: number;
          fee?: number;
          is_active?: boolean;
          stopdesk_fee?: number | null;
          updated_at?: string;
          wilaya?: string;
        };
        Relationships: [];
      };
      order_export_log: {
        Row: {
          created_at: string;
          event: string;
          id: number;
          order_id: string | null;
          request_id: number | null;
          status: string;
          target_id: string;
        };
        Insert: {
          created_at?: string;
          event: string;
          id?: number;
          order_id?: string | null;
          request_id?: number | null;
          status: string;
          target_id: string;
        };
        Update: {
          created_at?: string;
          event?: string;
          id?: number;
          order_id?: string | null;
          request_id?: number | null;
          status?: string;
          target_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_export_log_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "order_export_targets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_export_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_export_targets: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          label: string;
          secret: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          label: string;
          secret?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          label?: string;
          secret?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          variant_id: string | null;
          variant_label: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          carrier: string | null;
          commune: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          customer_name: string;
          delivered_at: string | null;
          delivery_method: string;
          delivery_fee: number;
          id: string;
          note: string | null;
          phone: string;
          public_token: string;
          refused_at: string | null;
          refused_reason: string | null;
          shipped_at: string | null;
          status: Database["public"]["Enums"]["order_status"];
          stopdesk_id: number | null;
          stopdesk_name: string | null;
          subtotal: number;
          total: number;
          tracking_number: string | null;
          tracking_url: string | null;
          updated_at: string;
          wilaya: string;
        };
        Insert: {
          address: string;
          carrier?: string | null;
          commune?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          customer_name: string;
          delivered_at?: string | null;
          delivery_method?: string;
          delivery_fee?: number;
          id?: string;
          note?: string | null;
          phone: string;
          public_token?: string;
          refused_at?: string | null;
          refused_reason?: string | null;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stopdesk_id?: number | null;
          stopdesk_name?: string | null;
          subtotal?: number;
          total?: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string;
          wilaya: string;
        };
        Update: {
          address?: string;
          carrier?: string | null;
          commune?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          customer_name?: string;
          delivered_at?: string | null;
          delivery_method?: string;
          delivery_fee?: number;
          id?: string;
          note?: string | null;
          phone?: string;
          public_token?: string;
          refused_at?: string | null;
          refused_reason?: string | null;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stopdesk_id?: number | null;
          stopdesk_name?: string | null;
          subtotal?: number;
          total?: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string;
          wilaya?: string;
        };
        Relationships: [];
      };
      pack_items: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          sort_order: number;
          variant_id: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity?: number;
          sort_order?: number;
          variant_id: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity?: number;
          sort_order?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pack_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pack_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          color_hex: string | null;
          color_name: string | null;
          compare_at_price: number | null;
          created_at: string;
          height_cm: number | null;
          id: string;
          is_active: boolean;
          length_cm: number | null;
          price: number;
          product_id: string;
          size: string | null;
          sku: string | null;
          sort_order: number;
          stock: number;
          updated_at: string;
          weight_grams: number | null;
          width_cm: number | null;
        };
        Insert: {
          color_hex?: string | null;
          color_name?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          height_cm?: number | null;
          id?: string;
          is_active?: boolean;
          length_cm?: number | null;
          price: number;
          product_id: string;
          size?: string | null;
          sku?: string | null;
          sort_order?: number;
          stock?: number;
          updated_at?: string;
          weight_grams?: number | null;
          width_cm?: number | null;
        };
        Update: {
          color_hex?: string | null;
          color_name?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          height_cm?: number | null;
          id?: string;
          is_active?: boolean;
          length_cm?: number | null;
          price?: number;
          product_id?: string;
          size?: string | null;
          sku?: string | null;
          sort_order?: number;
          stock?: number;
          updated_at?: string;
          weight_grams?: number | null;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          description_fr: string | null;
          id: string;
          kind: Database["public"]["Enums"]["product_kind"];
          name: string;
          name_fr: string | null;
          published_at: string | null;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          description_fr?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["product_kind"];
          name: string;
          name_fr?: string | null;
          published_at?: string | null;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          description_fr?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["product_kind"];
          name?: string;
          name_fr?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string;
          created_at: string;
          customer_name: string;
          id: string;
          image_url: string | null;
          is_approved: boolean;
          product_id: string | null;
          rating: number;
        };
        Insert: {
          comment: string;
          created_at?: string;
          customer_name: string;
          id?: string;
          image_url?: string | null;
          is_approved?: boolean;
          product_id?: string | null;
          rating: number;
        };
        Update: {
          comment?: string;
          created_at?: string;
          customer_name?: string;
          id?: string;
          image_url?: string | null;
          is_approved?: boolean;
          product_id?: string | null;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      size_guides: {
        Row: {
          created_at: string;
          headers: string[];
          id: string;
          name: string;
          note: string | null;
          note_fr: string | null;
          product_id: string | null;
          rows: Json;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          headers?: string[];
          id?: string;
          name: string;
          note?: string | null;
          note_fr?: string | null;
          product_id?: string | null;
          rows?: Json;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          headers?: string[];
          id?: string;
          name?: string;
          note?: string | null;
          note_fr?: string | null;
          product_id?: string | null;
          rows?: Json;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "size_guides_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          accepts_cod: boolean;
          address: string | null;
          banner_url: string | null;
          brand_color: string | null;
          created_at: string;
          address_fr: string | null;
          description_fr: string | null;
          tagline_fr: string | null;
          currency: string;
          delivery_eta_days: number;
          delivery_fee_flat: number;
          delivery_wilayas: string[];
          description: string | null;
          email: string | null;
          free_shipping_threshold: number;
          guepex_from_wilaya: string | null;
          id: number;
          legal_name: string | null;
          logo_url: string | null;
          name: string;
          nif: string | null;
          phone: string | null;
          rc_number: string | null;
          returns_days: number;
          tagline: string | null;
          updated_at: string;
          whatsapp: string | null;
          announcement: string | null;
          announcement_enabled: boolean;
          facebook_url: string | null;
          instagram_url: string | null;
          returns_note: string | null;
          tiktok_url: string | null;
        };
        Insert: {
          accepts_cod?: boolean;
          address?: string | null;
          banner_url?: string | null;
          brand_color?: string | null;
          created_at?: string;
          address_fr?: string | null;
          description_fr?: string | null;
          tagline_fr?: string | null;
          currency?: string;
          delivery_eta_days?: number;
          delivery_fee_flat?: number;
          delivery_wilayas?: string[];
          description?: string | null;
          email?: string | null;
          free_shipping_threshold?: number;
          guepex_from_wilaya?: string | null;
          id?: number;
          legal_name?: string | null;
          logo_url?: string | null;
          name?: string;
          nif?: string | null;
          phone?: string | null;
          rc_number?: string | null;
          returns_days?: number;
          tagline?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          announcement?: string | null;
          announcement_enabled?: boolean;
          facebook_url?: string | null;
          instagram_url?: string | null;
          returns_note?: string | null;
          tiktok_url?: string | null;
        };
        Update: {
          accepts_cod?: boolean;
          address?: string | null;
          banner_url?: string | null;
          brand_color?: string | null;
          created_at?: string;
          address_fr?: string | null;
          description_fr?: string | null;
          tagline_fr?: string | null;
          currency?: string;
          delivery_eta_days?: number;
          delivery_fee_flat?: number;
          delivery_wilayas?: string[];
          description?: string | null;
          email?: string | null;
          free_shipping_threshold?: number;
          guepex_from_wilaya?: string | null;
          id?: number;
          legal_name?: string | null;
          logo_url?: string | null;
          name?: string;
          nif?: string | null;
          phone?: string | null;
          rc_number?: string | null;
          returns_days?: number;
          tagline?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          announcement?: string | null;
          announcement_enabled?: boolean;
          facebook_url?: string | null;
          instagram_url?: string | null;
          returns_note?: string | null;
          tiktok_url?: string | null;
        };
        Relationships: [];
      };
      variant_images: {
        Row: {
          alt: string | null;
          created_at: string;
          id: string;
          sort_order: number;
          url: string;
          variant_id: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          url: string;
          variant_id: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          url?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_analytics: {
        Args: { p_days?: number };
        Returns: Json;
      };
      admin_phone_history: {
        Args: { p_phones: string[] };
        Returns: {
          blocked: boolean;
          delivered: number;
          orders: number;
          phone: string;
          refused: number;
        }[];
      };
      admin_exists: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      category_product_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          category_id: string;
          product_count: number;
        }[];
      };
      catalogue_page: {
        Args: {
          p_category_slug?: string | null;
          p_colors?: string[] | null;
          p_in_stock?: boolean;
          p_limit?: number;
          p_max_price?: number | null;
          p_min_price?: number | null;
          p_offset?: number;
          p_query?: string | null;
          p_sizes?: string[] | null;
          p_sort?: string;
        };
        Returns: Json;
      };
      normalize_arabic: {
        Args: { input: string };
        Returns: string;
      };
      claim_store: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["admin_role"];
      };
      has_admin_role: {
        Args: {
          _roles: Database["public"]["Enums"]["admin_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
      place_order: {
        Args: { p_customer: Json; p_items: Json };
        Returns: string;
      };
      recalculate_for_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      track_order: { Args: { p_token: string }; Returns: Json };
    };
    Enums: {
      admin_role: "owner" | "staff";
      order_status:
        "pending" | "confirmed" | "refused" | "shipped" | "delivered" | "cancelled" | "returned";
      product_kind: "single" | "pack";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : never;
// The non-schema branch is `never` on purpose — see the header note. This schema
// defines no composite types, so the generated branch would index `{}`.

export const Constants = {
  public: {
    Enums: {
      admin_role: ["owner", "staff"],
      order_status: [
        "pending",
        "confirmed",
        "refused",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      product_kind: ["single", "pack"],
    },
  },
} as const;
