import { all, db, migrate } from "../db";

/**
 * Kala Bazaar marketplace seed. Local image paths under /public/art keep the
 * demo self-hosted (no third-party hotlinks); drop your own files there or
 * point rows at any URL via /admin.
 */

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 19); // YYYY-MM-DDTHH:MM:SS

const products = [
  { id: 1, name: "Heritage Teak Frame — 16\"×20\"", category: "Frames", price: 9800, image: "/art/teak-frame.jpg", description: "A finished Heritage Teak frame in the classic 16×20 size — hand-joined, hand-finished, ready to hang.", stock: 6, featured: 1 },
  { id: 2, name: "Metro Slim Frame — 11\"×14\"", category: "Frames", price: 5600, image: "/art/metal-frame.jpg", description: "Sleek brushed-aluminium frame with precision-mitered corners and a deep shadow gap.", stock: 10, featured: 0 },
  { id: 3, name: "Thangka — Green Tara", category: "Art", price: 45000, image: "/art/thangka.jpg", description: "Original Green Tara thangka painted by hand, brocade-mounted and ready for its shadow box.", stock: 2, featured: 1 },
  { id: 4, name: "Boudhanath at Dawn — Giclée Print", category: "Art", price: 4200, image: "/art/boudhanath.jpg", description: "Museum-grade giclée print of Boudhanath at first light, on archival paper.", stock: 20, featured: 1 },
  { id: 5, name: "Patan Durbar Square — Giclée Print", category: "Art", price: 3800, image: "/art/patan-durbar.jpg", description: "Limited-run print of Patan Durbar Square's pagoda roofs, archival inks.", stock: 15, featured: 0 },
  { id: 6, name: "Dubo Mala Shadow Box", category: "Decor", price: 6500, image: "/art/dubo-mala.jpg", description: "Preserve your wedding dubo mala in a handcrafted shadow box — heirloom-grade sealing.", stock: 0, featured: 0 },
  { id: 7, name: "Brocade Silk Mount (Thangka)", category: "Decor", price: 1500, image: "/art/brocade.jpg", description: "Traditional brocade silk border, cut and fitted for a standard thangka mount.", stock: 12, featured: 0 },
  { id: 8, name: "Renaissance Gold Frame — 20\"×24\"", category: "Frames", price: 22000, image: "/art/gold-frame.jpg", description: "24k gold-leaf frame, individually burnished — ready for a statement piece.", stock: 3, featured: 1 },
  { id: 9, name: "Gallery Stretch Canvas — 24\"×36\"", category: "Frames", price: 7800, image: "/art/canvas.jpg", description: "Gallery-wrapped canvas on kiln-dried pine stretcher bars, cross-braced.", stock: 5, featured: 0 },
  { id: 10, name: "Memory Keeper Photo Frame — 5\"×7\"", category: "Decor", price: 2900, image: "/art/photo-frame.jpg", description: "Solid walnut photo frame with a stepped profile — a gift-ready classic.", stock: 18, featured: 0 },
  // Auction-only items — bidding opens at starting_bid, closes at ends_at.
  { id: 11, name: "Original Paubha — White Jambala", category: "Art", price: 0, image: "/art/white-jambala-paubha.jpg", description: "Hand-painted White Jambala paubha, mineral pigments on cotton, brocade border included. One of a kind.", stock: 1, featured: 1, auction: 1, startingBid: 12000, minIncrement: 500, endsAt: daysFromNow(7), sellerEmail: "anita@paubhastudio.com.np" },
  { id: 12, name: "Miniature Thangka — Chenrezig", category: "Art", price: 0, image: "/art/chenrezig-thangka.jpg", description: "Tiny hand-painted Chenrezig thangka (8×10), perfect for a travel altar or desk.", stock: 1, featured: 0, auction: 1, startingBid: 4500, minIncrement: 250, endsAt: daysFromNow(4), sellerEmail: "anita@paubhastudio.com.np" },
  { id: 13, name: "Carved Wood Wall Panel — Sun Mandala", category: "Art Decor", price: 0, image: "/art/newari-panel.jpg", description: "Hand-carved Newari sun mandala panel, seasoned pine, ready to hang. One-of-one piece.", stock: 1, featured: 0, auction: 1, startingBid: 8000, minIncrement: 500, endsAt: daysFromNow(10), sellerEmail: "anita@paubhastudio.com.np" },

  // Affordable catalog (under NPR 5,000) — gifts, prints, small decor.
  { id: 14, name: "Greeting Card Set — Kathmandu Streets (5-pack)", category: "Art", price: 450, image: "/art/boudhanath.jpg", description: "Five archival-art greeting cards featuring hand-drawn Kathmandu street scenes. Envelopes included.", stock: 40, featured: 0, sellerEmail: "anita@paubhastudio.com.np" },
  { id: 15, name: "Vinyl Sticker Pack — Paubha Motifs (8-pack)", category: "Art", price: 250, image: "/art/sticker-pack.jpg", description: "Weatherproof vinyl stickers featuring traditional paubha motifs — for laptops, water bottles, journals.", stock: 80, featured: 0, sellerEmail: "anita@paubhastudio.com.np" },
  { id: 16, name: "Mini Paubha Print — Lotus Mandala (A5)", category: "Art", price: 950, image: "/art/lotus-mandala-print.jpg", description: "Hand-printed mini paubha on archival cotton rag paper, A5 size — perfect for a desk or altar corner.", stock: 35, featured: 1, sellerEmail: "anita@paubhastudio.com.np" },
  { id: 17, name: "Wooden Bookmark — Carved Lotus", category: "Decor", price: 350, image: "/art/bookmark.jpg", description: "Hand-carved walnut bookmark with a tiny lotus motif — finished with natural beeswax.", stock: 60, featured: 0, sellerEmail: "anita@paubhastudio.com.np" },
  { id: 18, name: "Fridge Magnet Set — Temples of Nepal (4-pack)", category: "Decor", price: 1200, image: "/art/fridge-magnets.jpg", description: "Four glossy ceramic fridge magnets featuring Patan, Boudhanath, Swayambhunath and Changu Narayan.", stock: 25, featured: 0, sellerEmail: "anita@paubhastudio.com.np" },

  // Dev test item — NPR 5 price floor (for checkout / payment min-amount testing).
  { id: 19, name: "Test Item — NPR 5 Candle", category: "Decor", price: 5, image: "/art/candle.jpg", description: "Tiny dev/test item priced at NPR 5. Use this to exercise minimum-price checkout, payment-gateway rounding, and email-receipt flows. Not for sale.", stock: 999, featured: 0, sellerEmail: "anita@paubhastudio.com.np" },
];

// `stock` is deliberately excluded from the DO UPDATE clause: a reseed must
// never clobber live inventory that orders have already reduced. Auction
// prices/deadlines are content, so they DO refresh on reseed.
const UPSERT_PRODUCT = `
  INSERT INTO products (id, name, category, price, image, description, stock, featured,
                        auction, starting_bid, min_increment, ends_at, seller_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price,
    image = EXCLUDED.image, description = EXCLUDED.description,
    featured = EXCLUDED.featured, auction = EXCLUDED.auction,
    starting_bid = EXCLUDED.starting_bid, min_increment = EXCLUDED.min_increment,
    ends_at = EXCLUDED.ends_at
`;

/** Shop settings defaults — only inserted when missing so admin edits win. */
export const shopSettings: Record<string, string> = {
  phone: "+977 9843082974",
  whatsapp: "9779843082974",
  email: "namaste@kalabazaar.com.np",
  address: "Kathmandu, Nepal",
  hours: "Sun–Fri: 9:00 – 18:00\nSaturday: Closed",
  instagram: "#",
  facebook: "#",
};

/**
 * Sync identity sequences so admin/seller-created rows never collide with the
 * explicit seed ids. `setval(seq, MAX+1, false)` makes the next nextval equal
 * MAX+1 (and 1 on an empty table). Runs on every boot path.
 */
async function syncSequences() {
  for (const table of ["products"]) {
    await db.unsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM ${table}`
    );
  }
}

/** Seed just the shop inventory (used when the catalog already exists). */
export async function seedProductsOnly() {
  for (const p of products) {
    await all(UPSERT_PRODUCT, productParams(p));
  }
  await syncSequences();
}

/** Map a seed product to UPSERT_PRODUCT params (auction fields + owner). */
function productParams(p: (typeof products)[number]) {
  return [
    p.id,
    p.name,
    p.category,
    p.price,
    p.image,
    p.description,
    p.stock,
    p.featured,
    p.auction ? 1 : 0,
    p.auction ? p.startingBid : null,
    p.auction ? (p.minIncrement ?? 100) : 100,
    p.auction ? (p.endsAt ?? null) : null,
    null, // seller_id resolved separately (see seedMarketplace)
  ];
}

/** Insert any missing shop_settings keys (idempotent, preserves edits). */
export async function seedShopSettings() {
  for (const [key, value] of Object.entries(shopSettings)) {
    await all(
      "INSERT INTO shop_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
      [key, value]
    );
  }
}

/**
 * Create/rotate the seller account from SELLER_EMAIL / SELLER_PASSWORD env vars
 * (no-op when unset — the bootstrap endpoint covers that case).
 */
export async function seedSellerIfConfigured() {
  const email = process.env.SELLER_EMAIL?.trim();
  const password = process.env.SELLER_PASSWORD;
  if (!email || !password) return;
  const hash = await Bun.password.hash(password);
  const name = process.env.SELLER_NAME?.trim() ?? "Kala Bazaar Studio";
  await all(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'seller')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [name, email, hash]
  );
  console.log(`[seed] seller account ready for ${email}`);
}

/**
 * Marketplace demo content: one curated seller shop with auction lots and a
 * blog. Idempotent — the seller is keyed by email, posts only seed when the
 * blog is empty, and product ownership is set once.
 */
const demoPosts = [
  {
    slug: "from-apprentice-to-paubha-painter",
    title: "From Apprentice to Paubha Painter",
    excerpt:
      "Twelve years ago I ground my first mineral pigment in a Patan courtyard. This is the story of how that morning changed everything.",
    coverImage: "/art/thangka.jpg",
    content:
      "I grew up above my grandfather's workshop in Patan, where the smell of pine resin and ochre was the smell of home. At thirteen I was grinding lapis lazuli by hand — my grandfather insisted pigments be ground fresh every morning, because a paubha's soul lives in its colour.\n\nTwelve years on, I still grind my own colours. The technique has not changed in five hundred years: mineral stone, water, and patience. What has changed is that the world found its way to our courtyard. Today my small studio ships paubhas and thangkas to collectors from Kathmandu to Kyoto, and every piece still begins the same way — with a morning of grinding, and a blank canvas.",
  },
  {
    slug: "why-mineral-pigments-outlive-us-all",
    title: "Why Mineral Pigments Outlive Us All",
    excerpt:
      "Blue from lapis, red from cinnabar, gold from the leaf itself — a short essay on why a properly made thangka can outlive its painter by centuries.",
    coverImage: "/art/boudhanath.jpg",
    content:
      "A well-made thangka is built to outlive everyone who touches it. The colours are ground from stone that formed millions of years ago; the canvas is sized with hide glue and kaolin; the gold is hammered to a leaf thinner than a mosquito's wing.\n\nWhat makes it last is not the materials alone — it is the discipline. A paubha painter never works in humid air. Never shortcuts the sizing. Never lets a brush touch a surface that is not perfectly smooth. That discipline is why the great thangkas of the fifteenth century still glow. If you are buying sacred art, buy it from someone who treats the process as ritual, not as production.",
  },
];

export async function seedMarketplace() {
  // 1. The demo seller (idempotent by email).
  const hash = await Bun.password.hash("demo123456");
  const inserted = await all<{ id: number }>(
    `INSERT INTO users (name, email, password_hash, role, bio, avatar, shop_name, location, website)
     VALUES ($1, $2, $3, 'seller', $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       role = 'seller',
       bio = EXCLUDED.bio,
       avatar = EXCLUDED.avatar,
       shop_name = EXCLUDED.shop_name
     RETURNING id`,
    [
      "Anita Maharjan",
      "anita@paubhastudio.com.np",
      hash,
      "Third-generation paubha painter from Patan. I grind my own mineral pigments, paint sacred art, and carve the occasional sun mandala.",
      "/art/anita.jpg",
      "Maharjan Paubha Studio",
      "Patan, Lalitpur",
      "",
    ]
  );
  const sellerId = inserted[0].id;

  // 2. Hand the auction lots and affordable catalog to the demo seller (once).
  const own = await all<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM products WHERE seller_id = $1",
    [sellerId]
  );
  if (Number(own[0]?.count ?? 0) === 0) {
    await all(
      "UPDATE products SET seller_id = $1 WHERE id IN (11, 12, 13, 14, 15, 16, 17, 18, 19)",
      [sellerId]
    );
  }

  // 3. Blog posts (only when the blog is empty).
  const postRows = await all<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM posts"
  );
  if (Number(postRows[0]?.count ?? 0) === 0) {
    for (const post of demoPosts) {
      await all(
        `INSERT INTO posts (seller_id, title, slug, excerpt, content, cover_image, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'published')`,
        [sellerId, post.title, post.slug, post.excerpt, post.content, post.coverImage]
      );
    }
  }
  console.log("[seed] marketplace ready — demo seller + auctions + blog");
}

/** Seed the marketplace inventory (idempotent — upserts on fixed ids). */
export async function seed() {
  await migrate();

  await db.begin(async (tx) => {
    for (const p of products) {
      await tx.unsafe(UPSERT_PRODUCT, productParams(p));
    }
  });

  await syncSequences();
}

/** Seed only when the catalog is empty (used on first server start). */
export async function seedIfEmpty() {
  const rows = await all<{ count: number }>("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0]?.count === 0) {
    await seed();
  } else {
    // Pre-existing catalog: still upsert products (idempotent, preserves live
    // stock) so auction lots 11–13 appear and the sequence guard runs.
    await seedProductsOnly();
  }
  await seedShopSettings();
  await seedSellerIfConfigured();
  await seedMarketplace();
}

// Direct execution: `bun run seed`
if (import.meta.main) {
  await seed();
  await seedShopSettings();
  await seedSellerIfConfigured();
  await seedMarketplace();
  console.log("✅ Seeded Kala Bazaar database");
}
