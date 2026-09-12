# Wireframes — import notes

HTML + CSS only. No JavaScript. Layout is **flexbox** (no CSS Grid) so tools such as html-to-design, Anima, Penpot, and Figma HTML import keep structure.

## Stylesheets (load in this order)

1. `css/tokens.css` — AU palette and type
2. `css/base.css` — reset and headings
3. `css/layout.css` — page, header, footer, clusters
4. `css/components.css` — buttons, cards, forms
5. `css/annotations.css` — yellow review notes; **omit this file** on import if you want production-like frames

## Fonts

Google stand-ins for AU’s licensed faces:

- Display: Barlow Condensed (stands in for National 2 Condensed)
- Body: Roboto Serif

## Shared chrome

Every screen repeats the same header/footer markup (HTML has no includes). Class names are stable: `.demo-banner`, `.utility`, `.masthead`, `.brand`, `.nav-main`, `.site-footer`.
