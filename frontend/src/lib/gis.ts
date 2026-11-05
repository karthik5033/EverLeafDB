/**
 * EverLeafDB PostGIS Spatial Engine & GIS Utilities
 * Standard: WGS 84 (EPSG:4326)
 * Phase 4: Spatial Infrastructure, GiST Indexing & Spatial Constraints
 */

export interface CoordinatePoint {
  latitude: number;
  longitude: number;
}

export type LngLat = [number, number]; // [longitude, latitude]

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * WGS-84 Earth Radius in meters
 */
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * PostGIS ST_Distance(geography, geography): Computes geodesic distance between two points in meters
 * Uses high-accuracy Haversine formulation over the WGS 84 ellipsoid.
 */
export function stDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * PostGIS ST_DWithin(geography, geography, radius_meters):
 * Returns true if two spatial points are within distance R meters of each other.
 */
export function stDWithin(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number
): boolean {
  return stDistanceMeters(lat1, lon1, lat2, lon2) <= radiusMeters;
}

/**
 * PostGIS ST_Contains(polygon_geom, point_geom):
 * Jordan curve ray-casting algorithm to test if a 2D coordinate falls strictly within a closed polygon ring.
 * @param polygon Array of [longitude, latitude] coordinates forming the closed ring
 * @param point [longitude, latitude] of the test point
 */
export function stContains(polygon: LngLat[], point: LngLat): boolean {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * PostGIS ST_Area(geography) / 1000000.0:
 * Calculates the geodesic surface area of a spherical polygon in square kilometers.
 */
export function stAreaSqKm(polygon: LngLat[]): number {
  if (polygon.length < 3) return 0;
  let total = 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [lon1, lat1] = polygon[i];
    const [lon2, lat2] = polygon[j];
    total +=
      toRad(lon2 - lon1) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }

  const areaM2 = (Math.abs(total) * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 4.0;
  return Math.round((areaM2 / 1000000.0) * 1000) / 1000;
}

/**
 * PostGIS ST_Centroid(geometry):
 * Computes the geometric barycenter centroid [lng, lat] of a polygon.
 */
export function stCentroid(polygon: LngLat[]): LngLat {
  let cx = 0;
  let cy = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    cx += polygon[i][0];
    cy += polygon[i][1];
  }
  return [
    Math.round((cx / n) * 1000000) / 1000000,
    Math.round((cy / n) * 1000000) / 1000000
  ];
}

/**
 * PostGIS ST_Envelope(geometry):
 * Generates the minimal 2D axis-aligned bounding box (BBox) for spatial candidate indexing.
 */
export function stEnvelope(polygon: LngLat[]): BoundingBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of polygon) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Checks if a bounding box overlaps a search envelope (GiST Index Scan simulator &&)
 */
export function stIntersectsBBox(b1: BoundingBox, b2: BoundingBox): boolean {
  return !(
    b1.maxLng < b2.minLng ||
    b1.minLng > b2.maxLng ||
    b1.maxLat < b2.minLat ||
    b1.minLat > b2.maxLat
  );
}

/**
 * Well-Known Text (WKT) Formatter: Converts point coordinates to PostGIS WKT
 */
export function pointToWkt(lng: number, lat: number): string {
  return `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
}

/**
 * Well-Known Text (WKT) Formatter: Converts polygon coordinates to PostGIS WKT
 */
export function polygonToWkt(ring: LngLat[]): string {
  const pairs = ring.map(([lng, lat]) => `${lng.toFixed(6)} ${lat.toFixed(6)}`).join(", ");
  return `SRID=4326;POLYGON((${pairs}))`;
}

/**
 * Spatial Verification Constraint: chk_tree_within_ward
 * Validates that a tree point [longitude, latitude] is strictly inside the assigned ward boundary.
 */
export function verifyTreeWithinWard(
  treePoint: LngLat,
  wardPolygon: LngLat[],
  wardName: string
): { isValid: boolean; error?: string } {
  const isContained = stContains(wardPolygon, treePoint);
  if (!isContained) {
    return {
      isValid: false,
      error: `Spatial Constraint Violation [chk_tree_within_ward]: Coordinates [${treePoint[1]}, ${treePoint[0]}] fall outside polygon boundary of assigned ward: ${wardName}.`
    };
  }
  return { isValid: true };
}

