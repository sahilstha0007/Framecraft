import { all, db, migrate } from "../db";

/**
 * Seed data mirroring the FrameCraft catalog (previously hardcoded in the
 * frontend's `src/lib/data.ts`). Kept here so the API owns its data and the
 * frontend can consume it over HTTP.
 */

const frames = [
  { id: 1, name: "Heritage Teak", category: "Classic Wooden Frames", material: "Solid Teak Wood", sizes: ['8"×10"', '11"×14"', '16"×20"', '20"×24"', '24"×36"'], priceRange: "NPR 6,500 - 18,500", image: "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=800&q=80", description: "Timeless frames handcrafted from kiln-dried Nepali teak. Each piece features traditional joinery and a hand-rubbed natural finish.", popular: true },
  { id: 2, name: "Metro Slim", category: "Modern Metal Frames", material: "Brushed Aluminum", sizes: ['8"×10"', '11"×14"', '16"×20"', '20"×24"'], priceRange: "NPR 4,500 - 12,500", image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80", description: "Sleek aluminum frames with precision-mitered corners and a deep shadow gap for a contemporary gallery look.", popular: true },
  { id: 3, name: "Renaissance Gold", category: "Luxury Gold Frames", material: "24K Gold Leaf over Wood", sizes: ['8"×10"', '11"×14"', '16"×20"', '20"×24"', '30"×40"'], priceRange: "NPR 15,000 - 45,000", image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&q=80", description: "Ornate gold-leaf frames crafted using centuries-old gilding techniques. Each frame is individually burnished for a luminous finish.", popular: true },
  { id: 4, name: "Pure Line", category: "Minimalist Frames", material: "Bamboo Composite", sizes: ['8"×10"', '11"×14"', '16"×20"', '20"×24"', '24"×36"'], priceRange: "NPR 3,500 - 9,500", image: "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?w=800&q=80", description: "Clean, minimal frames with ultra-slim profiles. Made from sustainable bamboo composite with a matte finish.", popular: false },
  { id: 5, name: "Gallery Stretch", category: "Canvas Frames", material: "Kiln-Dried Pine with Cotton Canvas", sizes: ['12"×12"', '16"×20"', '18"×24"', '24"×36"', '30"×40"'], priceRange: "NPR 4,000 - 12,000", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80", description: "Professional gallery-wrap canvas frames. Kiln-dried pine stretcher bars with cross-bracing for large formats.", popular: false },
  { id: 6, name: "Memory Keeper", category: "Photo Frames", material: "Solid Walnut", sizes: ['4"×6"', '5"×7"', '8"×10"', '11"×14"'], priceRange: "NPR 2,500 - 7,500", image: "https://images.unsplash.com/photo-1515288207449-100e125abccb?w=800&q=80", description: "Elegant photo frames in rich walnut. Features a stepped profile that adds depth to your treasured photographs.", popular: true },
  { id: 7, name: "Diplomat", category: "Certificate Frames", material: "Mahogany with Gold Accent", sizes: ['8.5"×11"', '9"×12"', '11"×14"', '14"×17"'], priceRange: "NPR 5,000 - 14,000", image: "https://images.unsplash.com/photo-1609811692040-35b06faddb8d?w=800&q=80", description: "Distinguished frames for certificates and awards. Dark mahogany with a gold inner lip that commands respect.", popular: false },
  { id: 8, name: "Artisan Custom", category: "Custom Designer Frames", material: "Your Choice with Milled Wood", sizes: ["Any Size", "Custom Dimensions"], priceRange: "NPR 10,000 - 60,000+", image: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&q=80", description: "Fully bespoke frames crafted to your specifications. Choose from premium hardwoods, custom finishes, and dimensional profiles.", popular: false },
  { id: 9, name: "Thangka Heritage", category: "Thangka & Paubha Frames", material: "Teak with Silk Brocade Mount", sizes: ['30"×40"', '40"×60"', "Custom Dimensions"], priceRange: "NPR 8,000 - 25,000", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", description: "Specialist shadow-box framing for thangka and paubha paintings. Air-gapped glass protects mineral pigments and gold leaf from monsoon humidity.", popular: false },
];

const galleryItems = [
  { id: 1, title: "Abstract Reverie", category: "Artwork Framing", image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80", description: "Original abstract painting framed in a floating shadow box with museum-grade UV glass.", client: "Siddhartha Art Gallery" },
  { id: 2, title: "Eternal Vows", category: "Wedding Photo Frames", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", description: "Wedding photograph framed in hand-carved white oak with silver leaf accents.", client: "Aakash & Smriti" },
  { id: 3, title: "Vintage Map Collection", category: "Museum-Style Framing", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80", description: "Historic Kathmandu Valley map reproduction with archival matting and UV-protective glass.", client: "National Museum of Nepal" },
  { id: 4, title: "Corporate Lobby Triptych", category: "Office Decoration Frames", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", description: "Three-panel abstract series in matching charcoal aluminum frames for a corporate headquarters lobby.", client: "eSewa HQ, Baneshwor" },
  { id: 5, title: "Pokhara Serenity", category: "Interior Framing", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", description: "Lakeside photography collection framed in weathered driftwood-finish frames for a Pokhara residence.", client: "Pokhara Lakeside Residence" },
  { id: 6, title: "Botanical Studies", category: "Artwork Framing", image: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800&q=80", description: "Vintage botanical prints in matching gold oval frames with cream silk matting.", client: "Park Gallery Collection" },
  { id: 7, title: "Family Legacy Wall", category: "Interior Framing", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80", description: "Multi-generational family photographs arranged in a curated gallery wall with matching walnut frames.", client: "The Shrestha Family" },
  { id: 8, title: "Limited Edition Print", category: "Museum-Style Framing", image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80", description: "Signed limited edition art print framed with archival materials and anti-reflective glass.", client: "NAFA Collection" },
  { id: 9, title: "Heritage Hotel Gallery", category: "Office Decoration Frames", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", description: "Newari woodwork-inspired framing collection for a heritage hotel's private dining room.", client: "Dwarika's Hotel" },
];

const services = [
  { id: 1, title: "Custom Picture Framing", description: "Bespoke framing solutions tailored to your artwork, photograph, or treasured item. Choose from hundreds of moulding profiles and finishes.", icon: "Frame", features: ["Hundreds of moulding options", "Custom mat cutting", "Preservation-grade materials", "Design consultation included"] },
  { id: 2, title: "Art Restoration & Conservation", description: "Professional restoration services for damaged artwork, photographs, and documents. Museum-quality conservation framing available.", icon: "Paintbrush", features: ["Surface cleaning & repair", "Color restoration", "Tear repair & reinforcement", "UV-protective framing"] },
  { id: 3, title: "Canvas Stretching", description: "Expert canvas stretching on premium kiln-dried stretcher bars. Gallery-wrap and museum-wrap techniques available.", icon: "StretchHorizontal", features: ["Gallery-wrap technique", "Museum-wrap option", "Custom bar depth", "Cross-bracing for large works"] },
  { id: 4, title: "Fine Art Printing", description: "Giclée printing on archival papers and canvas. Museum-grade pigment inks for museum-quality reproductions.", icon: "Printer", features: ["Giclée on archival paper", "Canvas printing available", "Color-matched proofing", "Edition numbering service"] },
  { id: 5, title: "Corporate Framing", description: "Complete framing solutions for offices, hotels, and commercial spaces across the Kathmandu Valley. Volume pricing and installation included.", icon: "Building2", features: ["Bulk order discounts", "Brand-consistent design", "On-site installation", "Ongoing maintenance"] },
  { id: 6, title: "Home Consultation", description: "Our expert designers visit your home to measure spaces, recommend frame styles, and create a cohesive gallery design.", icon: "Home", features: ["Free in-home visit", "Wall layout planning", "Style & color consultation", "Virtual preview available"] },
  { id: 7, title: "Delivery & Installation", description: "White-glove delivery and professional hanging service across the Kathmandu Valley. We handle everything from packaging to perfect placement.", icon: "Truck", features: ["White-glove delivery", "Professional hanging", "Picture rail & wire setup", "Lighting recommendations"] },
  { id: 8, title: "Thangka & Paubha Framing", description: "Specialist conservation framing for thangka and paubha paintings — shadow-boxed with an air gap to protect mineral pigments and gold leaf from humidity.", icon: "Brush", features: ["Custom shadow-box with air gap", "Brocade & silk mounting", "Mineral pigment protection", "Monsoon-safe dust sealing"] },
  { id: 9, title: "Dubo Mala Preservation", description: "We preserve your wedding Dubo Mala and ceremonial items in hand-crafted shadow boxes, keeping these heirlooms safe for generations.", icon: "Sprout", features: ["Custom box compartments", "Treated garland preservation", "Photo & memento mounting", "Heirloom-grade sealing"] },
];

const testimonials = [
  { id: 1, name: "Anita Shrestha", role: "Art Collector", content: "FrameCraft transformed my art collection. Their conservation-grade framing preserved a 19th-century watercolor that other framers said was too fragile. The gold-leaf frame they recommended is simply stunning.", rating: 5, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
  { id: 2, name: "Bibek Maharjan", role: "Interior Designer", content: "I've worked with FrameCraft on over a dozen projects for my clients across Patan and Kathmandu. Their attention to detail and willingness to create custom profiles sets them apart from any other framing studio I've encountered.", rating: 5, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80" },
  { id: 3, name: "Sunita Gurung", role: "Photographer", content: "Having my photography exhibited at Siddhartha Art Gallery required museum-quality framing. FrameCraft delivered exceptional work with archival materials that perfectly complement my images without overwhelming them.", rating: 5, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80" },
  { id: 4, name: "Rajesh Shrestha", role: "Homeowner", content: "The home consultation was a game-changer. They came to our house in Jhamsikhel, measured everything, and designed a gallery wall that completely transformed our hallway. The installation team was meticulous and left no mess.", rating: 4, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  { id: 5, name: "Meera Thapa", role: "Gallery Curator", content: "FrameCraft's museum-style framing is top-notch. Their understanding of conservation standards rivals the best museums. We trust them with all our institution's framing needs.", rating: 5, image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80" },
];

const teamMembers = [
  { id: 1, name: "Rajan Shakya", role: "Master Framer & Founder", bio: "A third-generation Newar woodworker from Patan, Rajan founded FrameCraft with a vision to bridge traditional craftsmanship with contemporary design. He trained with master gilders of the Kathmandu Valley and specializes in thangka and paubha framing.", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80", experience: "25+ Years" },
  { id: 2, name: "Pragya Shrestha", role: "Lead Designer", bio: "Pragya brings a refined eye for proportion and color from her background in interior architecture. She specializes in helping clients visualize framing solutions that enhance their spaces.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", experience: "15 Years" },
  { id: 3, name: "Sushil Joshi", role: "Conservation Specialist", bio: "Sushil is our preservation expert, trained in conservation science in Kyoto and London. He handles all museum-grade framing and restoration projects with meticulous care.", image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&q=80", experience: "18 Years" },
  { id: 4, name: "Lhakpa Sherpa", role: "Artisan Framer", bio: "Lhakpa's background in fine woodworking and thangka mounting brings a unique precision to our sacred art framing. She specializes in brocade mounting and complex multi-layered matting designs.", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80", experience: "12 Years" },
];

const glassTypes = [
  { id: "standard", name: "Standard Glass", description: "Clear float glass with basic protection", price: 0, features: ["Clear clarity", "Basic dust protection", "Standard weight"] },
  { id: "nonglare", name: "Non-Glare Glass", description: "Etched surface reduces reflections by 80%", price: 1800, features: ["Reduced reflections", "Better viewing", "Slightly matte finish"] },
  { id: "uv", name: "UV-Protective Glass", description: "Blocks 97% of harmful UV rays", price: 3200, features: ["UV protection", "Color preservation", "Premium clarity"] },
  { id: "museum", name: "Museum-Grade Glass", description: "Premium conservation glass with 99% UV block", price: 6000, features: ["99% UV protection", "Anti-reflective", "Anti-static", "Shatter-resistant"] },
];

const matOptions = [
  { id: "none", name: "No Mat", color: "transparent", price: 0, description: "Direct frame fit" },
  { id: "cream", name: "Cream White", color: "#f5f0e8", price: 1800, description: "Warm archival mat board" },
  { id: "white", name: "Bright White", color: "#ffffff", price: 1800, description: "Clean white presentation" },
  { id: "charcoal", name: "Charcoal", color: "#404040", price: 2200, description: "Dramatic dark contrast" },
  { id: "walnut", name: "Walnut", color: "#6e4f2e", price: 2600, description: "Rich brown accent" },
  { id: "ivory", name: "Ivory", color: "#fffff0", price: 2000, description: "Classic off-white matting" },
  { id: "black", name: "Black", color: "#121212", price: 2200, description: "Bold modern border" },
  { id: "double", name: "Double Mat", color: "#e8d5c0", price: 4000, description: "Two-tone professional look" },
];

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 19); // YYYY-MM-DDTHH:MM:SS

const products = [
  { id: 1, name: "Heritage Teak Frame — 16\"×20\"", category: "Frames", price: 9800, image: "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=800&q=80", description: "A finished Heritage Teak frame in the classic 16×20 size — hand-joined, hand-finished, ready to hang.", stock: 6, featured: 1 },
  { id: 2, name: "Metro Slim Frame — 11\"×14\"", category: "Frames", price: 5600, image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80", description: "Sleek brushed-aluminium frame with precision-mitered corners and a deep shadow gap.", stock: 10, featured: 0 },
  { id: 3, name: "Thangka — Green Tara", category: "Art", price: 45000, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", description: "Original Green Tara thangka painted by hand, brocade-mounted and ready for its shadow box.", stock: 2, featured: 1 },
  { id: 4, name: "Boudhanath at Dawn — Giclée Print", category: "Art", price: 4200, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80", description: "Museum-grade giclée print of Boudhanath at first light, on archival paper.", stock: 20, featured: 1 },
  { id: 5, name: "Patan Durbar Square — Giclée Print", category: "Art", price: 3800, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", description: "Limited-run print of Patan Durbar Square's pagoda roofs, archival inks.", stock: 15, featured: 0 },
  { id: 6, name: "Dubo Mala Shadow Box", category: "Products", price: 6500, image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", description: "Preserve your wedding dubo mala in a handcrafted shadow box — heirloom-grade sealing.", stock: 0, featured: 0 },
  { id: 7, name: "Brocade Silk Mount (Thangka)", category: "Products", price: 1500, image: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&q=80", description: "Traditional brocade silk border, cut and fitted for a standard thangka mount.", stock: 12, featured: 0 },
  { id: 8, name: "Renaissance Gold Frame — 20\"×24\"", category: "Frames", price: 22000, image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&q=80", description: "24k gold-leaf frame, individually burnished — ready for a statement piece.", stock: 3, featured: 1 },
  { id: 9, name: "Gallery Stretch Canvas — 24\"×36\"", category: "Frames", price: 7800, image: "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?w=800&q=80", description: "Gallery-wrapped canvas on kiln-dried pine stretcher bars, cross-braced.", stock: 5, featured: 0 },
  { id: 10, name: "Memory Keeper Photo Frame — 5\"×7\"", category: "Products", price: 2900, image: "https://images.unsplash.com/photo-1515288207449-100e125abccb?w=800&q=80", description: "Solid walnut photo frame with a stepped profile — a gift-ready classic.", stock: 18, featured: 0 },
  // Auction-only items — bidding opens at starting_bid, closes at ends_at.
  { id: 11, name: "Original Paubha — White Jambala", category: "Art", price: 0, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", description: "Hand-painted White Jambala paubha, mineral pigments on cotton, brocade border included. One of a kind.", stock: 1, featured: 1, auction: 1, startingBid: 12000, minIncrement: 500, endsAt: daysFromNow(7), sellerEmail: "anita@paubhastudio.com.np" },
  { id: 12, name: "Miniature Thangka — Chenrezig", category: "Art", price: 0, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80", description: "Tiny hand-painted Chenrezig thangka (8×10), perfect for a travel altar or desk.", stock: 1, featured: 0, auction: 1, startingBid: 4500, minIncrement: 250, endsAt: daysFromNow(4), sellerEmail: "anita@paubhastudio.com.np" },
  { id: 13, name: "Carved Wood Wall Panel — Sun Mandala", category: "Art Decor", price: 0, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", description: "Hand-carved Newari sun mandala panel, seasoned pine, ready to hang. One-of-one piece.", stock: 1, featured: 0, auction: 1, startingBid: 8000, minIncrement: 500, endsAt: daysFromNow(10), sellerEmail: "anita@paubhastudio.com.np" },
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

const UPSERT_FRAME = `
  INSERT INTO frames (id, name, category, material, sizes, price_range, image, description, popular)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, category = EXCLUDED.category, material = EXCLUDED.material,
    sizes = EXCLUDED.sizes, price_range = EXCLUDED.price_range, image = EXCLUDED.image,
    description = EXCLUDED.description, popular = EXCLUDED.popular
`;
const UPSERT_GALLERY = `
  INSERT INTO gallery_items (id, title, category, image, description, client)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, category = EXCLUDED.category, image = EXCLUDED.image,
    description = EXCLUDED.description, client = EXCLUDED.client
`;
const UPSERT_SERVICE = `
  INSERT INTO services (id, title, description, icon, features)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon,
    features = EXCLUDED.features
`;
const UPSERT_TESTIMONIAL = `
  INSERT INTO testimonials (id, name, role, content, rating, image)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, role = EXCLUDED.role, content = EXCLUDED.content,
    rating = EXCLUDED.rating, image = EXCLUDED.image
`;
const UPSERT_TEAM = `
  INSERT INTO team_members (id, name, role, bio, image, experience)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, role = EXCLUDED.role, bio = EXCLUDED.bio,
    image = EXCLUDED.image, experience = EXCLUDED.experience
`;
const UPSERT_GLASS = `
  INSERT INTO glass_types (id, name, description, price, features)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
    features = EXCLUDED.features
`;
const UPSERT_MAT = `
  INSERT INTO mat_options (id, name, color, price, description)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, color = EXCLUDED.color, price = EXCLUDED.price,
    description = EXCLUDED.description
`;

/** Shop settings defaults — only inserted when missing so seller edits win. */
export const shopSettings: Record<string, string> = {
  phone: "+977 1-5531234",
  whatsapp: "9779843082974",
  email: "hello@framecraft.com.np",
  address: "Kumaripati, Lalitpur, Nepal",
  hours: "Sun–Fri: 9:00 – 18:00\nSaturday: Closed",
  instagram: "#",
  facebook: "#",
  pinterest: "#",
};

/**
 * Sync identity sequences so admin/seller-created rows never collide with the
 * explicit seed ids. `setval(seq, MAX+1, false)` makes the next nextval equal
 * MAX+1 (and 1 on an empty table). Runs on every boot path — not just a fresh
 * seed — so a DB seeded before this guard can never hand out a colliding id.
 */
async function syncSequences() {
  for (const table of ["frames", "gallery_items", "services", "testimonials", "team_members", "products"]) {
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
 * Create/rotate the studio seller from SELLER_EMAIL / SELLER_PASSWORD env vars
 * (no-op when unset — the bootstrap endpoint covers that case).
 */
export async function seedSellerIfConfigured() {
  const email = process.env.SELLER_EMAIL?.trim();
  const password = process.env.SELLER_PASSWORD;
  if (!email || !password) return;
  const hash = await Bun.password.hash(password);
  const name = process.env.SELLER_NAME?.trim() ?? "FrameCraft Studio";
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
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    content:
      "I grew up above my grandfather's workshop in Patan, where the smell of pine resin and ochre was the smell of home. At thirteen I was grinding lapis lazuli by hand — my grandfather insisted pigments be ground fresh every morning, because a paubha's soul lives in its colour.\n\nTwelve years on, I still grind my own colours. The technique has not changed in five hundred years: mineral stone, water, and patience. What has changed is that the world found its way to our courtyard. Today my small studio ships paubhas and thangkas to collectors from Kathmandu to Kyoto, and every piece still begins the same way — with a morning of grinding, and a blank canvas.",
  },
  {
    slug: "why-mineral-pigments-outlive-us-all",
    title: "Why Mineral Pigments Outlive Us All",
    excerpt:
      "Blue from lapis, red from cinnabar, gold from the leaf itself — a short essay on why a properly made thangka can outlive its painter by centuries.",
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80",
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
       role = 'seller',      -- a pre-split seed may have left this account as admin
       bio = EXCLUDED.bio,
       avatar = EXCLUDED.avatar,
       shop_name = EXCLUDED.shop_name
     RETURNING id`,
    [
      "Anita Maharjan",
      "anita@paubhastudio.com.np",
      hash,
      "Third-generation paubha painter from Patan. I grind my own mineral pigments, paint sacred art, and carve the occasional sun mandala.",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
      "Maharjan Paubha Studio",
      "Patan, Lalitpur",
      "",
    ]
  );
  const sellerId = inserted[0].id;

  // 2. Hand the auction lots to the demo seller (once).
  const own = await all<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM products WHERE seller_id = $1",
    [sellerId]
  );
  if (Number(own[0]?.count ?? 0) === 0) {
    await all("UPDATE products SET seller_id = $1 WHERE id IN (11, 12, 13)", [sellerId]);
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

/** Seed all catalog tables (idempotent — upserts on fixed ids). */
export async function seed() {
  await migrate();

  await db.begin(async (tx) => {
    for (const f of frames) {
      await tx.unsafe(UPSERT_FRAME, [
        f.id, f.name, f.category, f.material, JSON.stringify(f.sizes),
        f.priceRange, f.image, f.description, f.popular ? 1 : 0,
      ]);
    }
    for (const g of galleryItems) {
      await tx.unsafe(UPSERT_GALLERY, [g.id, g.title, g.category, g.image, g.description, g.client]);
    }
    for (const s of services) {
      await tx.unsafe(UPSERT_SERVICE, [s.id, s.title, s.description, s.icon, JSON.stringify(s.features)]);
    }
    for (const t of testimonials) {
      await tx.unsafe(UPSERT_TESTIMONIAL, [t.id, t.name, t.role, t.content, t.rating, t.image]);
    }
    for (const m of teamMembers) {
      await tx.unsafe(UPSERT_TEAM, [m.id, m.name, m.role, m.bio, m.image, m.experience]);
    }
    for (const g of glassTypes) {
      await tx.unsafe(UPSERT_GLASS, [g.id, g.name, g.description, g.price, JSON.stringify(g.features)]);
    }
    for (const m of matOptions) {
      await tx.unsafe(UPSERT_MAT, [m.id, m.name, m.color, m.price, m.description]);
    }
    for (const p of products) {
      await tx.unsafe(UPSERT_PRODUCT, productParams(p));
    }
  });

  await syncSequences();
}

/** Seed only when the catalog is empty (used on first server start). */
export async function seedIfEmpty() {
  const rows = await all<{ count: number }>("SELECT COUNT(*)::int AS count FROM frames");
  if (rows[0]?.count === 0) {
    await seed(); // fresh catalog: seeds everything, including products + sequences
  } else {
    // Pre-existing catalog: still upsert products (idempotent, preserves live
    // stock) so auction lots 11–13 appear and the sequence guard runs even for
    // DBs that predate it — the fix for the products_pkey collision.
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
  console.log("✅ Seeded FrameCraft database");
}
