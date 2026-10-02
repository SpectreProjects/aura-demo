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

## Harmony app reset, 2 October 2026

Connor explicitly retired all AURA-era application design. Treat the customer-facing app, authentication and onboarding as a fresh Harmony design and journey, not a recolour of the existing dashboard.

- Read [APP_BEHAVIOUR.md](./APP_BEHAVIOUR.md) before redesigning an app workflow. It retains current functional evidence, including what form steps collect and what submissions do.
- Retain the working data requirements, validation, permissions, consent, persistence and side effects. Check the actual handlers and server contracts before changing a workflow.
- Existing page order, navigation, modal format, step grouping, copy, fonts, colours, spacing and animations are not approved Harmony requirements. They can be redesigned.
- Reuse established business logic where appropriate; do not import old AURA presentation components as the new design baseline. New app primitives should implement Harmony's approved design language.
- The approved Harmony landing, branding and motion remain the visual reference. Detailed app layouts and the new customer journey are still to be designed.
- Current implementation defects are not requirements to preserve. Flag or fix them as part of the relevant task, rather than reproducing them in the new experience.

The design reference is retained in this repository with its visual examples under docs/design/. Future tasks should consult these files rather than rely on conversation memory alone.
