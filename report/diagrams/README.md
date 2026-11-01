# Report diagrams

The schedule, architecture, module hierarchy, ERD, DFDs, use cases, decision
states and deployment use deliberately positioned SVG layouts from
`../scripts/reference-diagrams.mjs`. These follow the reference report's
visual conventions rather than Mermaid's automatic layout. Edit that module
to change those figures; their `.mmd` files are conceptual outlines only.

The training and scoring flowcharts also use fixed SVG layouts so they fit
side by side on one report page. The API sequence uses fixed monochrome
lifelines and arrows without activation bars. Its `.mmd` is a conceptual outline.

Run `npm run diagrams` from `report/` to regenerate SVG and PNG assets, then
`npm run build` to rebuild the main report PDF with updated navigation.
