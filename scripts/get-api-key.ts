// Local-only helper: prints Yogurtland's current flavorfinder API key.
//
// The key isn't in a JS bundle -- it's inline in the flavorfinder page's own
// <script> block ("headers: {'X-Api-Key' : '...'}"). This just re-derives it
// so you can check by hand if scripts/ingest.ts ever starts failing with an
// auth error (key rotation). Not wired into CI or `pnpm ingest` on purpose --
// run it yourself with `pnpm get-api-key` when needed.

const PAGE_URL = "https://www.yogurtland.com/flavorfinder";
const KEY_PATTERN = /X-Api-Key'\s*:\s*'([^']+)'/;

async function main() {
  const res = await fetch(PAGE_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${PAGE_URL}: ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(KEY_PATTERN);
  if (!match) {
    throw new Error(
      "Could not find an X-Api-Key value on the flavorfinder page. The site's markup may have changed.",
    );
  }

  console.log(match[1]);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
