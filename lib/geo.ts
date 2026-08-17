// ZIP -> coordinates lookup and distance math, both done entirely in the
// browser against the bundled zip-centroids.json (US Census Gazetteer data),
// so a search never depends on a geocoding API being up.

type Coords = [lat: number, lng: number];

let centroidsPromise: Promise<Record<string, Coords>> | null = null;

export function loadZipCentroids(): Promise<Record<string, Coords>> {
  if (!centroidsPromise) {
    centroidsPromise = fetch("/data/zip-centroids.json").then((res) => {
      if (!res.ok) throw new Error(`Failed to load zip centroids: ${res.status}`);
      return res.json() as Promise<Record<string, Coords>>;
    });
  }
  return centroidsPromise;
}

export function lookupZip(zip: string, centroids: Record<string, Coords>): Coords | null {
  return centroids[zip] ?? null;
}

const EARTH_RADIUS_MI = 3958.8;

export function haversineMiles(a: Coords, b: Coords): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
