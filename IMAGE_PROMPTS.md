# Kala Bazaar — replacement image prompts

All prompts are self-contained (no reference image needed) and follow the chosen **editorial product photography** direction: single centered subject, soft diffused daylight, warm ivory / soft warm-grey seamless studio background unless noted, gentle natural shadow, high detail, true-to-life colour, shallow depth of field.

**Universal negative constraints** (append to every prompt if your generator supports a negative field):
`no text, no lettering, no typography, no watermark, no logo, no signature, no frame-within-frame labels, no distorted hands, no extra fingers`

**Suggested aspect:** 4:3 for all product images, 1:1 for the avatar, 16:9 for the OG hero. If your generator has no aspect control, generate square and crop.

Save each result into `frontend/public/art/` using the **exact filename** listed below. Filenames already used by `seed.ts` need no code change; the 9 marked **NEW** require me to update `backend/src/db/seed.ts` (and `layout.tsx` for the OG image) once the files exist.

---

## Existing filenames — regenerate in place (10 product images + 1 avatar)

### 1. `teak-frame.jpg` — Heritage Teak Frame (16"×20")
A hand-joined teak wood picture frame in a classic 16×20 inch profile, rich honey-brown wood grain, empty cream mat inside, leaning against a warm ivory plaster studio wall, soft diffused daylight from upper left, gentle natural shadow, centered, clean museum-catalog composition, no text, no lettering, no typography, no watermark, 4:3.

### 2. `metal-frame.jpg` — Metro Slim Frame (11"×14")
A sleek slim brushed-aluminium picture frame, 11×14 inch, precision-mitered corners, deep shadow gap, cool satin silver finish, standing upright on a soft warm-grey seamless studio background, soft directional light with crisp metallic reflections, centered, modern minimal museum-shop aesthetic, no text, no lettering, no typography, no watermark, 4:3.

### 3. `thangka.jpg` — Thangka, Green Tara
A traditional Nepalese Green Tara thangka painting, hand-painted with mineral pigments on cotton canvas, intricate gilded detail, rich emerald green, crimson and gold palette, the deity seated on a lotus throne within an ornate brocade silk border, hanging flat against a warm dark plaster wall, gentle museum spotlight, centered, devotional and finely detailed, no text, no lettering, no typography, no watermark, 4:3.

### 4. `boudhanath.jpg` — Boudhanath at Dawn, giclée print
A fine-art giclée print of Boudhanath stupa at dawn: the great white dome and golden spire glowing in first light, prayer flags strung across the frame, soft Himalayan mist, visible archival cotton-paper texture, the unframed print leaning against a warm ivory wall, soft daylight, centered, museum-catalog composition, no text, no lettering, no typography, no watermark, 4:3.

### 5. `dubo-mala.jpg` — Dubo Mala Shadow Box
A preserved dubo mala — a traditional Nepali wedding garland of white and red flowers — displayed inside a handcrafted dark walnut shadow box with a glass front, heirloom keepsake presentation, warm neutral studio background, soft directional light catching the glass, centered, no text, no lettering, no typography, no watermark, 4:3.

### 6. `brocade.jpg` — Brocade Silk Mount (Thangka)
A length of traditional Nepalese brocade silk in deep crimson and gold with finely woven floral motifs, folded and draped over a dark wooden display table, rich fabric sheen, warm directional light, Close detail of the weave, centered composition, no text, no lettering, no typography, no watermark, 4:3.

### 7. `gold-frame.jpg` — Renaissance Gold Frame (20"×24")
An ornate Renaissance-style 20×24 inch picture frame finished in genuine 24k gold leaf, individually burnished, elaborate carved floral and acanthus detailing, empty center, leaning against a deep charcoal studio wall, dramatic warm side light, luxurious museum quality, centered, no text, no lettering, no typography, no watermark, 4:3.

### 8. `canvas.jpg` — Gallery Stretch Canvas (24"×36")
A gallery-wrapped stretched canvas on visible kiln-dried pine stretcher bars, cross-braced back edge, blank primed cotton surface, standing upright at a slight side angle to show the depth of the stretch, warm grey seamless studio background, soft daylight, clean craft-shop product photography, no text, no lettering, no typography, no watermark, 4:3.

### 9. `photo-frame.jpg` — Memory Keeper Photo Frame (5"×7")
A solid walnut 5×7 inch photograph frame with a stepped profile, empty, resting on a light oak tabletop, soft window light from the left, a warm home interior blurred in the background, shallow depth of field, centered, no text, no lettering, no typography, no watermark, 4:3.

### 10. `newari-panel.jpg` — Carved Wood Wall Panel, Sun Mandala
A hand-carved Newari wood wall panel featuring a circular sun mandala with intricate floral and geometric carving, seasoned pine with a dark walnut stain, hanging on a warm ivory plaster wall, raking light to reveal the depth of the carving, centered, artisan craft detail, no text, no lettering, no typography, no watermark, 4:3.

### 11. `anita.jpg` — seller portrait (avatar)
An editorial portrait of a Nepali woman artist in her early 30s, warm genuine expression, short dark hair, wearing a subtle patterned blouse, seated in a softly lit studio with a warm terracotta wall background, shallow depth of field, natural window light, respectful authentic representation, centered head and shoulders, no text, no lettering, no typography, no watermark, 1:1.

---

## NEW filenames — generate and tell me, I'll wire the references (8 product images + 1 OG hero)

### 12. `patan-durbar.jpg` — NEW — Patan Durbar Square, giclée print
A fine-art giclée print of Patan Durbar Square in Nepal: pagoda-roofed Newari temple buildings, richly carved wooden facades, a historic stone courtyard, warm morning light, visible archival paper texture, the unframed print leaning against a warm ivory wall, soft daylight, centered, museum-catalog composition, no text, no lettering, no typography, no watermark, 4:3.

### 13. `white-jambala-paubha.jpg` — NEW — Original Paubha, White Jambala
An original Nepalese paubha painting of White Jambala, the Buddhist deity of wealth and compassion, hand-painted with mineral pigments on cotton, intricate fine gold detailing, serene expression, seated on a lotus throne, framed by a traditional brocade border, warm museum lighting, flat front-on view, no text, no lettering, no typography, no watermark, 4:3.

### 14. `chenrezig-thangka.jpg` — NEW — Miniature Thangka, Chenrezig
A miniature hand-painted thangka of Chenrezig (Avalokiteshvara), the four-armed compassionate deity, fine mineral-pigment detail on cotton, delicate gold linework, small 8×10 inch size suggested by placing it beside a simple coin for scale, warm neutral studio background, soft daylight, no text, no lettering, no typography, no watermark, 4:3.

### 15. `lotus-mandala-print.jpg` — NEW — Mini Paubha Print, Lotus Mandala (A5)
A miniature A5 paubha-style art print of a lotus mandala, hand-printed on textured archival cotton rag paper, delicate mineral-pigment colours of crimson, gold and teal, lying on a warm wooden desk beside a small brass object, soft directional daylight, centered top-down view, no text, no lettering, no typography, no watermark, 4:3.

### 16. `greeting-cards.jpg` — NEW — Greeting Card Set, Kathmandu Streets
A fanned set of five archival-art greeting cards illustrated with hand-drawn Kathmandu street scenes — narrow old lanes, Newari houses, temple spires — together with plain cream envelopes, arranged on a warm linen surface, top-down flat lay, soft daylight, no readable text, no lettering, no typography, no watermark, 4:3.

### 17. `sticker-pack.jpg` — NEW — Vinyl Sticker Pack, Paubha Motifs
A pack of eight weatherproof vinyl stickers featuring traditional Nepali paubha motifs — lotus flowers, mandalas, deity figures, temple motifs — arranged in a neat overlapping fan on a warm grey surface, subtle gloss reflecting soft daylight, centered, clean product photography, no readable text, no lettering, no typography, no watermark, 4:3.

### 18. `bookmark.jpg` — NEW — Wooden Bookmark, Carved Lotus
A hand-carved walnut wooden bookmark with a small intricate lotus motif carved at the tip, finished with natural beeswax, lying diagonally across an open cream notebook, warm soft daylight, shallow depth of field, artisan craft product shot, no text, no lettering, no typography, no watermark, 4:3.

### 19. `fridge-magnets.jpg` — NEW — Fridge Magnet Set, Temples of Nepal
A set of four glossy ceramic fridge magnets, each illustrated with a different Nepali temple — Patan, Boudhanath, Swayambhunath and Changu Narayan — arranged in an even row on a clean cream surface, soft reflections, centered, editorial product photography, no readable text, no lettering, no typography, no watermark, 4:3.

### 20. `candle.jpg` — NEW — Test Item, NPR 5 Candle
A small hand-poured soy wax candle in a simple amber glass jar, unlit with a clean cotton wick, sitting on a warm neutral surface, soft diffused daylight, minimal editorial product photograph, centered, no text, no lettering, no typography, no watermark, 4:3.

### 21. `og-hero.jpg` — NEW — Open Graph / social hero image
Wide editorial still life for a Nepali art marketplace: a curated arrangement of rolled thangka paintings, carved wooden picture frames and a small brass Buddhist statue on a dark warm charcoal surface, golden directional light from the left, rich shadows, luxurious museum-gallery mood, generous empty negative space on the left for a text overlay, no text, no lettering, no typography, no watermark, 16:9.

---

## After you generate

Drop all files into `frontend/public/art/` with the exact names above, then tell me. I will:

1. Update `backend/src/db/seed.ts` so products 5, 11, 12, 14, 15, 16, 17, 18, 19 point at their new filenames (the "NEW" images).
2. Update `frontend/src/app/[locale]/layout.tsx` so the Open Graph image uses `/art/og-hero.jpg`.
3. Reseed the demo database and re-verify the pages in the browser.

No code changes are needed for the 10 regenerated existing filenames — those swap in automatically.
