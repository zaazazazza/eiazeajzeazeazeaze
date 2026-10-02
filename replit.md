# Sicariostore

Catalogue indépendant en français : les visiteurs découvrent les offres et contactent l’équipe sur les réseaux, sans panier ni achat sur le site.

## Run & Operate

- `npm install` — install the workspace dependencies
- `npm start` — run the catalog frontend on the site port (terminal 1)
- `npm --prefix ./artifacts/api-server run dev` — run the API server on port 18213 (terminal 2)
- For local development, set `DATABASE_URL` to your Supabase PostgreSQL session-pooler connection string in the workspace-root `.env` (include `?sslmode=require`). Create a private Supabase Storage bucket named `product-images` and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET=product-images` in the same file. Keep the service-role key server-side and retain the Clerk credentials for authentication. Create the `sicariostore_products` and `sicariostore_admin_emails` tables before starting the API. Do not run `npm --prefix ./lib/db run push` against a shared Supabase project: Drizzle may propose dropping tables owned by other apps. Only use it with a dedicated database after reviewing its proposed changes.
- `npm run typecheck` — typecheck all workspace packages
- `PORT=18212 BASE_PATH=/ npm --prefix ./artifacts/sicariostore run build` — build the website artifact
- `npm --prefix ./artifacts/api-server run build` — build the API server
- `npm --prefix ./lib/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `npm --prefix ./lib/db run push` — push development database schema changes (dedicated database only; review proposed changes)
- After adding or removing administrator addresses, only the verified primary email in `SICARIO_ADMIN_EMAIL` can manage the list from `/admin`.
- Required configuration: Supabase database and private Storage bucket, Clerk auth, and `SICARIO_ADMIN_EMAIL` for the single authorized admin account
- The website loads frontend `VITE_` settings from the workspace-root `.env` file.

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, Clerk authentication
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild bundle

## Where things live

- `artifacts/sicariostore` — French catalog, admin UI, styles, and supplied brand logo
- `artifacts/api-server` — Express API, Clerk middleware, product routes, and object storage routes
- `lib/api-spec/openapi.yaml` — API contract and generated request/response validation schemas
- `lib/db/src/schema/products.ts` — persistent product schema

## Architecture decisions

- Public catalog responses include published products only; administrators can manage drafts separately.
- Every `/api/admin` operation and image-upload URL requires Clerk authentication and a verified primary email matching `SICARIO_ADMIN_EMAIL`. Account creation alone never grants admin access.
- Additional administrator emails are stored in `sicariostore_admin_emails`; apply the schema with `npm --prefix ./lib/db run push`. Only the verified primary admin can manage this allowlist.
- Product images upload directly to Replit Object Storage; PostgreSQL stores the object path.
- Product pages provide social contact links only. Do not add checkout, a shopping cart, or on-site payment.

## Product

- Browse, search, and filter the published product catalog.
- Contact the team through Discord, Telegram, or TikTok.
- Manage product details, images, publication status, featured placement, and ordering from `/admin`.

## User preferences

- Use the supplied Sicariostore logo and a dark black-and-violet palette with restrained glow and distinctive motion.
- Keep the site as a catalog only; visitors must contact the team off-site to discuss offers.

## Gotchas

- Keep generated API client and Zod files in sync with `lib/api-spec/openapi.yaml` by running codegen after contract changes.
- A signed-in Clerk user still needs the verified email allowlist entry before admin operations are available.
- Manual Vite artifact builds default to `PORT=18212` and `BASE_PATH=/`; set them explicitly for a custom deployment path.

## Pointers

- See the workspace structure, TypeScript setup, and package details in the project files
