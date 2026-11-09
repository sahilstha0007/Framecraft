export type FieldType = "text" | "textarea" | "number" | "checkbox" | "tags" | "datetime" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  hint?: string;
  /** Options for a `select` field. */
  options?: string[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  image?: boolean;
  color?: boolean;
}

export interface ResourceConfig {
  slug: string;
  title: string;
  description: string;
  /** Field used for the row title and delete confirmation. */
  nameKey: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  emptyText: string;
  /** Optional API path prefix — defaults to /api/{slug} (used by the seller shop). */
  apiPrefix?: string;
  /** Optional separate list endpoint (e.g. own posts incl. drafts) — defaults to apiPrefix. */
  listPath?: string;
}

export const RESOURCES: ResourceConfig[] = [
  {
    slug: "products",
    title: "Products",
    description: "Art and products customers can buy in the shop — fixed price or auction.",
    nameKey: "name",
    fields: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category", placeholder: "e.g. Art, Frames, Products" },
      { key: "price", label: "Price (NPR)", type: "number", hint: "Fixed-price items only — auctions start at the opening bid" },
      { key: "image", label: "Image URL", placeholder: "https://…" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "stock", label: "Stock", type: "number", hint: "Available units — 0 hides it from sale" },
      { key: "featured", label: "Featured", type: "checkbox", hint: "Show at the top of the shop" },
      { key: "auction", label: "Auction item", type: "checkbox", hint: "Customers bid on this instead of buying it" },
      { key: "startingBid", label: "Opening bid (NPR)", type: "number", hint: "Required for auctions" },
      { key: "minIncrement", label: "Min. bid increment (NPR)", type: "number", hint: "Default 100" },
      { key: "endsAt", label: "Auction ends at", type: "datetime", hint: "Local time — bidding closes automatically" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "ended", "sold", "cancelled"],
      },
    ],
    columns: [
      { key: "image", label: "", image: true },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price" },
      { key: "stock", label: "Stock" },
    ],
    emptyText: "No products yet — add your first item.",
  },
  {
    slug: "seller-products",
    title: "My products",
    description: "Your shop — list fixed-price items or run an auction.",
    nameKey: "name",
    apiPrefix: "/api/seller/products",
    fields: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category", placeholder: "e.g. Art, Frames, Decor" },
      { key: "price", label: "Price (NPR)", type: "number", hint: "Fixed-price items only — auctions start at the opening bid" },
      { key: "image", label: "Image URL", placeholder: "https://…" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "stock", label: "Stock", type: "number" },
      { key: "featured", label: "Featured", type: "checkbox" },
      { key: "auction", label: "Auction item", type: "checkbox", hint: "Customers bid instead of buying" },
      { key: "startingBid", label: "Opening bid (NPR)", type: "number" },
      { key: "minIncrement", label: "Min. bid increment (NPR)", type: "number", hint: "Default 100" },
      { key: "endsAt", label: "Auction ends at", type: "datetime", hint: "Bidding closes automatically" },
    ],
    columns: [
      { key: "image", label: "", image: true },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price" },
      { key: "auction", label: "Auction" },
    ],
    emptyText: "No products yet — list your first piece.",
  },
  {
    slug: "seller-posts",
    title: "My stories",
    description: "Blog posts about your art — share the story behind your work.",
    nameKey: "title",
    apiPrefix: "/api/posts",
    listPath: "/api/seller/posts",
    fields: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug", placeholder: "leave blank to auto-generate" },
      { key: "excerpt", label: "Excerpt", placeholder: "One-line summary shown in feeds" },
      { key: "coverImage", label: "Cover image URL", placeholder: "https://…" },
      { key: "content", label: "Story", type: "textarea", placeholder: "Write your story — blank lines become paragraphs" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["published", "draft"],
      },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "status", label: "Status" }],
    emptyText: "No stories yet — write your first post.",
  },
];
