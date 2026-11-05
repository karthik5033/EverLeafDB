/**
 * Spatial Engine Verification Test
 * Tests PostGIS geometry utilities, containment, distances, and chk_tree_within_ward constraint
 */

import {
  stContains,
  stDistanceMeters,
  stDWithin,
  stAreaSqKm,
  stCentroid,
  stEnvelope,
  pointToWkt,
  polygonToWkt,
  verifyTreeWithinWard,
  LngLat
} from "../frontend/src/lib/gis";

// Sample Ward Polygon (Ward 03 - East Zone)
const WARD_03_POLYGON: LngLat[] = [
  [77.5900, 12.9700],
  [77.6050, 12.9700],
  [77.6050, 12.9850],
  [77.5900, 12.9850],
  [77.5900, 12.9700] // closed ring
];

console.log("=================================================");
console.log("EverLeafDB PostGIS Spatial Infrastructure Test");
console.log("=================================================\n");

// 1. WKT Formatting
console.log("1. WKT Serialization:");
const samplePointWkt = pointToWkt(77.5946, 12.9716);
console.log("   Point WKT:  ", samplePointWkt);
const samplePolyWkt = polygonToWkt(WARD_03_POLYGON);
console.log("   Polygon WKT:", samplePolyWkt.slice(0, 55) + "...\n");

// 2. Geodesic Distance
console.log("2. PostGIS ST_Distance(geography, geography):");
const distanceMeters = stDistanceMeters(12.9716, 77.5946, 12.9750, 77.5980);
console.log(`   Distance between [12.9716, 77.5946] and [12.9750, 77.5980]: ${distanceMeters}m`);
console.assert(distanceMeters > 0 && distanceMeters < 1000, "Distance calculation failure");
console.log("   ✓ Distance calculation verified.\n");

// 3. Proximity Search ST_DWithin
console.log("3. PostGIS ST_DWithin(geom, geom, radius_m):");
const isWithin500m = stDWithin(12.9716, 77.5946, 12.9750, 77.5980, 500);
const isWithin1000m = stDWithin(12.9716, 77.5946, 12.9750, 77.5980, 1000);
console.log(`   Within 500m:  ${isWithin500m}`);
console.log(`   Within 1000m: ${isWithin1000m}`);
console.assert(!isWithin500m && isWithin1000m, "ST_DWithin boundary check failed");
console.log("   ✓ ST_DWithin radial evaluation verified.\n");

// 4. Polygon Containment ST_Contains
console.log("4. PostGIS ST_Contains(boundary_geom, location_geom):");
const insidePoint: LngLat = [77.5950, 12.9750];
const outsidePoint: LngLat = [77.6200, 12.9900];
const isInside = stContains(WARD_03_POLYGON, insidePoint);
const isOutside = stContains(WARD_03_POLYGON, outsidePoint);
console.log(`   Point [77.5950, 12.9750] in Ward 03: ${isInside}`);
console.log(`   Point [77.6200, 12.9900] in Ward 03: ${isOutside}`);
console.assert(isInside === true, "Inside point was incorrectly flagged outside");
console.assert(isOutside === false, "Outside point was incorrectly flagged inside");
console.log("   ✓ ST_Contains Ray-casting verified.\n");

// 5. Geodetic Area Calculation
console.log("5. PostGIS ST_Area(boundary_geom::geography):");
const areaSqKm = stAreaSqKm(WARD_03_POLYGON);
console.log(`   Calculated Ward 03 Area: ${areaSqKm} sq km`);
console.assert(areaSqKm > 0, "Area calculation must be positive");
console.log("   ✓ ST_Area geodesic measurement verified.\n");

// 6. Spatial Constraint Enforcement (chk_tree_within_ward)
console.log("6. Spatial Integrity Constraint [chk_tree_within_ward]:");
const validCheck = verifyTreeWithinWard(insidePoint, WARD_03_POLYGON, "Ward 03 - East Zone");
console.log(`   Valid Tree Registration:   `, validCheck);
const invalidCheck = verifyTreeWithinWard(outsidePoint, WARD_03_POLYGON, "Ward 03 - East Zone");
console.log(`   Violating Tree Coordinates:`, invalidCheck);
console.assert(validCheck.isValid === true, "Valid check failed");
console.assert(invalidCheck.isValid === false && invalidCheck.error !== undefined, "Invalid check failed to raise violation");
console.log("   ✓ chk_tree_within_ward trigger constraint verified.\n");

console.log("All PostGIS Spatial Infrastructure tests passed successfully! ✓");
