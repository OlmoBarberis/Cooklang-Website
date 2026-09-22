# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People visiting a public Italian-language recipe resource to find a recipe and follow it while cooking. Most visitors use the site on mobile devices.

## Product Purpose

Publish a searchable collection of Cooklang recipes that visitors can browse, filter, read, and use while preparing food.

## Operating Context

Visitors browse recipes by title, category, tag, or ingredient; open a recipe; adjust ingredient quantities for the desired serving scale; and check off ingredients while cooking. Search and filter selections can be shared through the URL.

## Capabilities and Constraints

- Preserve the existing Italian-language content and terminology.
- Preserve recipe discovery by search, tags, ingredients, alphabetical browsing, and category labels.
- Preserve readable server-rendered recipes and the client-side serving multiplier and ingredient checklist.
- Recipes are Cooklang `.cook` files with YAML frontmatter. Subdirectories supply categories; local images live alongside the mounted recipe collection.
- The site uses Astro with Node server output. The recipe catalog is cached for the production server process, so recipe changes require a restart.

## Brand Commitments

The site is an Italian-language recipe resource. No further brand commitments were specified during init.

## Evidence on Hand

- Real recipe content and images are available in the local `recipes/` directory; this directory is mounted at runtime rather than bundled into the application image.
- The current routes and components in `src/` demonstrate the public browsing and cooking workflows.

## Product Principles

- Help visitors reach a relevant recipe quickly.
- Make quantities and ingredient progress practical during cooking.
- Keep recipes readable without relying on client-side JavaScript.
- Treat the existing Italian recipe collection as the source of content truth.
