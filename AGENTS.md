# Harmony project guidance

## Approved design reference

Before planning, implementing or reviewing any visual/UI change, read the complete [DESIGN.md](./DESIGN.md). It records Connor's approved Harmony branding, final component states, exact runtime values and rejected approaches.

- Use this reference and the approved landing page as the design baseline. Previous AURA marketing, auth and dashboard styling is not the Harmony visual specification.
- Reuse the maintained Harmony components and tokens. Both Get started buttons share InteractiveHoverButton; keep their distinct approved resting colours.
- Check the proposed change against the design review checklist in DESIGN.md before implementation, then check the rendered result against it afterwards.
- Preserve the supplied logo, Pacifico contours, approved writing sequence, centred wordmark and scroll portal unless the current request changes them. Do not rewrite pen paths as an incidental layout fix.
- Separate approved decisions from recommendations for future screens. Do not silently invent new brand colours, fonts or decorative treatments.
- When the user approves a lasting design change, update DESIGN.md in the same changeset as its runtime implementation. Keep one canonical design reference rather than competing brand guides.
- Explicit current user instructions take precedence over this baseline. These notes require no additional approval flow.

The design reference is retained in this repository with its visual examples under docs/design/. Future tasks should consult these files rather than rely on conversation memory alone.
