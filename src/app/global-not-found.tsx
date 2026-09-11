import type { Metadata } from "next";
import Link from "next/link";
import "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: "पृष्ठ नहीं मिला | Page not found — Pitra Sewa" };

/** Used only for URLs that match no route at all (the proxy prevents most of these). */
export default function GlobalNotFound() {
  return (
    <html lang="hi">
      <body className="flex min-h-dvh items-center justify-center bg-ivory p-6">
        <main className="max-w-md text-center">
          <h1 className="text-h2">यह पृष्ठ नहीं मिला</h1>
          <p lang="en" className="mt-2 text-muted">
            We couldn’t find this page.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-maroon px-6 text-lg font-semibold text-ivory"
          >
            मुखपृष्ठ / Home
          </Link>
        </main>
      </body>
    </html>
  );
}
