import { SQL } from "bun";
import { config } from "./config";

/** PostgreSQL client (Bun.sql — built-in, Promise-based, tagged templates, pooling). */
export const db = new SQL(config.databaseUrl);

/**
 * Create the schema if needed. Postgres notes vs. the old SQLite schema:
 *  - SERIAL gives auto-incrementing ids for rows created without an explicit id
 *    (seed rows use fixed ids; seed() syncs the sequences afterwards).
 *  - created_at stays TEXT so the wire format is identical to before.
 */
export async function migrate() {
  // Multiple statements are allowed when no parameters are used.
  await db.unsafe(`
    CREATE TABLE IF NOT EXISTS frames (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      material TEXT NOT NULL,
      sizes TEXT NOT NULL,
      price_range TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      popular INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      client TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      features TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT NOT NULL,
      image TEXT NOT NULL,
      experience TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS glass_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      features TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mat_options (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      service TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS custom_quotes (
      id SERIAL PRIMARY KEY,
      frame_id INTEGER NOT NULL,
      frame_name TEXT NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      mat_id TEXT,
      mat_name TEXT,
      glass_id TEXT,
      glass_name TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      base_price REAL NOT NULL,
      mat_price REAL NOT NULL DEFAULT 0,
      glass_price REAL NOT NULL DEFAULT 0,
      size_factor REAL NOT NULL DEFAULT 1,
      total REAL NOT NULL,
      name TEXT,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    -- Three-role marketplace: customers (buyers), sellers (marketplace vendors
    -- with their own shop), admin (the studio owner running the whole console).
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'seller', 'admin')),
      bio TEXT,
      avatar TEXT,
      shop_name TEXT,
      location TEXT,
      website TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    -- Existing DBs still carry the two-role constraint; widen it and promote
    -- the old studio sellers to admins.
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('customer', 'seller', 'admin'));
    UPDATE users SET role = 'admin' WHERE role = 'seller';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shop_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Link bookings/quotes to accounts (when the visitor is signed in) and
    -- give sellers a status + internal notes field for each.
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE custom_quotes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
    ALTER TABLE custom_quotes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

    -- Shop: products (art & goods) and the orders customers place.
    -- auction = 1 marks an auction-only item: no fixed price, bidding starts
    -- at starting_bid and rises in min_increment steps until ends_at, when the
    -- highest bidder (winner_id) wins automatically. status: active | ended | sold.
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      auction INTEGER NOT NULL DEFAULT 0,
      starting_bid REAL,
      min_increment REAL NOT NULL DEFAULT 100,
      ends_at TEXT,
      current_bid REAL,
      bid_count INTEGER NOT NULL DEFAULT 0,
      winner_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'active',
      seller_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS auction INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS starting_bid REAL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS min_increment REAL NOT NULL DEFAULT 100;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS ends_at TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS current_bid REAL;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS bid_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS winner_id INTEGER REFERENCES users(id);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);

    -- payment_status is written by the real eSewa/Khalti gateways after
    -- server-side verification (payment_ref holds the gateway transaction id).
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_ref TEXT,
      gateway TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway TEXT;

    -- Auctions: one row per bid. The product row caches current_bid/bid_count.
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE INDEX IF NOT EXISTS idx_bids_product ON bids(product_id, amount DESC);

    -- Order status timeline: one row per status transition, oldest first.
    -- Written at placement ('pending') and on every admin/seller status change.
    CREATE TABLE IF NOT EXISTS order_events (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, id);

    -- Seller blog: art stories and studio notes.
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      updated_at TEXT
    );

    -- Social graph: follows (users → sellers), likes (users → products) and
    -- polymorphic comments (products and blog posts).
    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS product_likes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      target_type TEXT NOT NULL CHECK (target_type IN ('product', 'post')),
      target_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);

    -- Product reviews & ratings: one review per user per product, 1-5 stars,
    -- with an optional seller reply. Sellers see the aggregate on their
    -- profile (rating / review_count).
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title TEXT,
      body TEXT,
      reply TEXT,
      replied_at TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      UNIQUE (product_id, user_id)
    );

    -- In-app notification center. Triggered by marketplace events:
    -- outbid, auction_won, order_status, new_order, new_follower,
    -- new_comment, review_received.
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, id);

    -- Product view tracking: one row per product-page visit (the signed-in
    -- user when available; guests carry a localStorage visitor id). Drives the
    -- "trending" score and co-occurrence recommendations. Views are deduped
    -- per identity per product within an hour so the ranking can't be gamed
    -- by hammering the view endpoint.
    CREATE TABLE IF NOT EXISTS product_views (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      visitor_id TEXT,
      viewed_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    ALTER TABLE product_views ADD COLUMN IF NOT EXISTS visitor_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id, viewed_at);
    CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id, viewed_at);
    CREATE INDEX IF NOT EXISTS idx_product_views_visitor ON product_views(visitor_id, product_id, viewed_at);
  `);
}

/**
 * Run a query and resolve to typed rows. `db.unsafe` itself is untyped (`any`),
 * so routes get real row types through this tiny wrapper. Omit `params` when
 * the SQL has no `$n` placeholders.
 */
export const all = <T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> =>
  (params && params.length ? db.unsafe(sql, params) : db.unsafe(sql)) as unknown as Promise<T[]>;

/** Safely parse a JSON-encoded column (sizes, features, ...). */
export function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
