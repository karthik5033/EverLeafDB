-- ============================================================================
-- EverLeafDB: Municipal Wards & Geofence Boundary Layer Seeding
-- Phase 7: Administrative Wards with PostGIS Polygon Boundaries (SRID 4326)
-- ============================================================================

INSERT INTO wards (ward_id, ward_number, name, boundary_geom, area_sq_km)
VALUES
  (
    1,
    'WARD-01',
    'Central Business District',
    ST_GeomFromText('POLYGON((77.592 12.968, 77.612 12.969, 77.611 12.982, 77.593 12.981, 77.592 12.968))', 4326),
    3.800
  ),
  (
    2,
    'WARD-02',
    'Lalbagh Botanical Zone',
    ST_GeomFromText('POLYGON((77.575 12.942, 77.595 12.943, 77.593 12.959, 77.576 12.958, 77.575 12.942))', 4326),
    4.200
  ),
  (
    3,
    'WARD-03',
    'Cubbon Park Heritage',
    ST_GeomFromText('POLYGON((77.586 12.966, 77.604 12.967, 77.603 12.980, 77.587 12.979, 77.586 12.966))', 4326),
    2.900
  ),
  (
    4,
    'WARD-04',
    'Indiranagar Urban Forest',
    ST_GeomFromText('POLYGON((77.630 12.969, 77.652 12.970, 77.651 12.988, 77.631 12.987, 77.630 12.969))', 4326),
    5.100
  ),
  (
    5,
    'WARD-05',
    'Koramangala Canopy Corridor',
    ST_GeomFromText('POLYGON((77.610 12.925, 77.632 12.926, 77.631 12.943, 77.612 12.942, 77.610 12.925))', 4326),
    4.600
  ),
  (
    6,
    'WARD-06',
    'Malleswaram Heritage Precinct',
    ST_GeomFromText('POLYGON((77.560 12.993, 77.582 12.994, 77.581 13.013, 77.561 13.012, 77.560 12.993))', 4326),
    4.800
  ),
  (
    7,
    'WARD-07',
    'Jayanagar Green Belt',
    ST_GeomFromText('POLYGON((77.570 12.915, 77.592 12.916, 77.590 12.935, 77.571 12.934, 77.570 12.915))', 4326),
    5.200
  ),
  (
    8,
    'WARD-08',
    'Whitefield Tech Corridor',
    ST_GeomFromText('POLYGON((77.730 12.960, 77.760 12.961, 77.758 12.985, 77.732 12.984, 77.730 12.960))', 4326),
    7.500
  ),
  (
    9,
    'WARD-09',
    'Hebbal Lake Sanctuary',
    ST_GeomFromText('POLYGON((77.580 13.030, 77.610 13.031, 77.608 13.055, 77.582 13.054, 77.580 13.030))', 4326),
    6.400
  ),
  (
    14,
    'WARD-14',
    'Ulsoor Lake Catchment',
    ST_GeomFromText('POLYGON((77.615 12.975, 77.635 12.976, 77.634 12.991, 77.616 12.990, 77.615 12.975))', 4326),
    3.500
  )
ON CONFLICT (ward_id) DO UPDATE SET
  ward_number = EXCLUDED.ward_number,
  name = EXCLUDED.name,
  boundary_geom = EXCLUDED.boundary_geom,
  area_sq_km = EXCLUDED.area_sq_km;

SELECT setval('wards_ward_id_seq', (SELECT MAX(ward_id) FROM wards));
