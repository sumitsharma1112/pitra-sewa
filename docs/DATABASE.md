# Database design (Stage 4)

PostgreSQL + Prisma 7. The full draft is in `prisma/schema.prisma` (validated with
Prisma 7.10's schema validator; not yet wired into the app).
Hosting: Supabase or Neon Postgres both work with Vercel.

## Models

| Model | Purpose |
|---|---|
| `AdminUser` | Admin login. `passwordHash` (argon2id) only. Roles: Owner, Admin, Coordinator. |
| `Booking` | A Sewa request. Starts `PENDING`; only an admin can set `CONFIRMED`. Unique non-sequential reference (e.g. `PS-26-7K3Q9`). Stores a price snapshot so later price edits don't change old requests. |
| `BookingEvent` | Audit trail: every status change with who, when and why. |
| `SewaOption` | The Sewa cards. Bilingual text, starting price in paise (or none = "on request"), `isDemo` flag so demo data is labelled on the site. |
| `ServiceLocation` | Cities where Sewa is offered; linked many-to-many with Sewa options. |
| `CalendarConvention` | e.g. `north-purnimanta-lahiri-v1` with its rule version. |
| `ShraddhaCalculation` | Inputs, result, status, engine + rule versions, and the priest verification state. |
| `ContactMessage` | Contact form submissions. |
| `Faq`, `ContentPage` | Admin-editable bilingual content. |
| `SiteSetting` | Key/value settings: phone, email, WhatsApp, address (replaces the env vars used in Stage 1). |

## Privacy choices

- The departed person's name is **not** stored in calculation logs — it is only printed
  on the family's own result page. It is stored only when they make a booking.
- No government IDs, no payment data (payments, if ever added, go through a payment
  provider; we store only its reference).
- Admin notes are never exposed to families.
- Retention: calculation logs purged after a set period (proposed 24 months);
  cancelled/completed bookings anonymised after a set period — to be finalised in the
  privacy policy.
- All reads/writes happen server-side; customer data never ships to the browser except
  on authenticated admin pages.
