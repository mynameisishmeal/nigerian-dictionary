# DOCUMENTATION-FIRST LAW

## MANDATORY LIBRARY DOCUMENTATION READ

* BEFORE WRITING ANY CODE THAT USES A LIBRARY, FRAMEWORK, OR SDK, THE AGENT MUST READ THE OFFICIAL DOCUMENTATION FOR THAT LIBRARY.
* THE AGENT MUST NOT RELY ON TRAINING MEMORY ALONE FOR APIs THAT MAY HAVE CHANGED.
* IF DOCUMENTATION CANNOT BE FETCHED, THE AGENT MUST STATE THIS AND PROPOSE AN ALTERNATIVE VERIFICATION METHOD.
* THE AGENT MUST NEVER GUESS API SIGNATURES, OPTION NAMES, RETURN TYPES, OR CONFIGURATION KEYS.

## PROJECT LIBRARY REGISTRY

The following libraries are used in this project.

| Library | Purpose | Docs URL |
|---|---|---|
| @neondatabase/auth | Auth (session, user) | https://github.com/neondatabase/auth-nextjs |
| prisma | ORM and database client | https://www.prisma.io/docs/orm |
| next.js (v16+) | App framework (App Router) | https://nextjs.org/docs |
| @base-ui/react | Headless UI primitives | https://base-ui.com/react/overview |
| lucide-react | Icon library | https://lucide.dev/icons |
| tailwindcss (v4) | Styling via CSS variables | https://tailwindcss.com/docs |

## CRITICAL KNOWN GOTCHAS FOR THIS PROJECT

### Neon Auth
- Session is retrieved with auth.getSession() which returns { data: { session, user } | null, error }.
- DO NOT use auth.api.getSession({ headers }) that is better-auth NOT the Neon wrapper.
- DO NOT manually read cookies for session data.

### Prisma + Neon Postgres
- All model names use PascalCase in schema but map to lowercase tables via @@map.
- All DateTime fields MUST use @db.Timestamptz because Neon stores timestamps with timezone.
- Run npx prisma generate AFTER stopping the dev server (DLL is locked while running).
- Raw SQL seeds must use Prisma  tagged template literals to avoid null byte bugs.

### Next.js App Router
- Server Components cannot use React hooks.
- Add suppressHydrationWarning to the body tag in layout.tsx for browser extension compatibility.

### Seeding the Database
- NEVER seed without explicit user authorization per .agents/rules/database_permissions.md.
- Reference pattern: scratch/seed_raw.cjs uses  to bypass null byte issues.

### DateTime / Timestamp P2023 Error (CRITICAL)
- Prisma DateTime maps to TIMESTAMP(3) WITHOUT TIME ZONE by default.
- Raw SQL using NOW() inserts TIMESTAMPTZ (with timezone), which causes P2023.
- Fix: ALTER TABLE ... ALTER COLUMN createdAt TYPE TIMESTAMP(3) WITHOUT TIME ZONE USING (col::timestamptz AT TIME ZONE UTC).
- Do NOT rely on @db.Timestamptz to fix this in Prisma 6 - it does not change the JS client and Turbopack will cache the old bundle.
- Always use NOW()::timestamp in raw SQL inserts to match Prisma DateTime.
