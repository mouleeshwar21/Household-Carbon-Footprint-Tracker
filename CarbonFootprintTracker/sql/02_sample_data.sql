-- =====================================================================
-- Household Carbon Footprint Tracker - Sample Data
-- File: sql/02_sample_data.sql
-- Run AFTER 01_schema.sql.
-- =====================================================================

USE carbon_tracker;

-- ---------------------------------------------------------------------
-- 1. EMISSION FACTORS  (kg CO2e per one unit)
--    IMPORTANT: these numbers are approximate, for development only.
--    Grid electricity in particular differs a lot from country to country.
--    Before you submit, replace them with values from an official source
--    for your country and record that source in source_note.
-- ---------------------------------------------------------------------
INSERT INTO emission_factors (category, activity_type, unit, factor_kg_co2e, source_note) VALUES
('Electricity', 'Grid electricity',          'kWh',  0.7100, 'Approximate - verify'),
('Transport',   'Petrol car',                'km',   0.1920, 'Approximate - verify'),
('Transport',   'Diesel car',                'km',   0.1710, 'Approximate - verify'),
('Transport',   'Petrol fuel',               'litre',2.3100, 'Approximate - verify'),
('Transport',   'Diesel fuel',               'litre',2.6800, 'Approximate - verify'),
('Transport',   'Motorcycle / scooter',      'km',   0.0840, 'Approximate - verify'),
('Transport',   'Bus',                       'km',   0.1050, 'Approximate - verify'),
('Transport',   'Metro / train',             'km',   0.0410, 'Approximate - verify'),
('Transport',   'Domestic flight',           'km',   0.2550, 'Approximate - verify'),
('Cooking',     'LPG',                       'kg',   2.9800, 'Approximate - verify'),
('Cooking',     'Piped natural gas',         'm3',   2.0300, 'Approximate - verify'),
('Water',       'Tap water supply',          'kL',   0.3440, 'Approximate - verify'),
('Waste',       'General waste (landfill)',  'kg',   0.4500, 'Approximate - verify'),
('Waste',       'Recycled waste',            'kg',   0.0210, 'Approximate - verify'),
('Food',        'Vegan meal',                'meal', 0.5000, 'Approximate - verify'),
('Food',        'Vegetarian meal',           'meal', 0.7500, 'Approximate - verify'),
('Food',        'Chicken meal',              'meal', 1.8000, 'Approximate - verify'),
('Food',        'Red meat meal',             'meal', 6.0000, 'Approximate - verify');


-- ---------------------------------------------------------------------
-- 2. OPTIONAL DEMO DATA - lets you test queries and screens before the
--    Register screen exists. The password hash below is a fake placeholder,
--    so this account cannot log in.
--    To remove it later:  DELETE FROM users WHERE email = 'demo@example.com';
--    (household profile and records are deleted automatically - CASCADE)
-- ---------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash)
VALUES ('Demo User', 'demo@example.com', 'TEST_ONLY_NOT_A_REAL_HASH');

SET @demo_id = LAST_INSERT_ID();

INSERT INTO household_profiles
    (user_id, household_name, num_members, home_type, home_area_sqft, city, country, monthly_target_kg)
VALUES
    (@demo_id, 'Demo Household', 4, 'Apartment', 1200, 'Demo City', 'Demo Country', 300.00);

-- Each record looks up its factor and calculates co2e_kg = quantity x factor
INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 240, '2026-08-05', ROUND(240 * factor_kg_co2e, 4), 'August electricity bill'
FROM emission_factors WHERE category = 'Electricity' AND activity_type = 'Grid electricity';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 14.2, '2026-08-12', ROUND(14.2 * factor_kg_co2e, 4), 'LPG cylinder'
FROM emission_factors WHERE category = 'Cooking' AND activity_type = 'LPG';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 180, '2026-08-20', ROUND(180 * factor_kg_co2e, 4), 'Weekend trip'
FROM emission_factors WHERE category = 'Transport' AND activity_type = 'Petrol car';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 60, '2026-09-03', ROUND(60 * factor_kg_co2e, 4), 'Office commute'
FROM emission_factors WHERE category = 'Transport' AND activity_type = 'Bus';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 210, '2026-09-05', ROUND(210 * factor_kg_co2e, 4), 'September electricity bill'
FROM emission_factors WHERE category = 'Electricity' AND activity_type = 'Grid electricity';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 20, '2026-09-10', ROUND(20 * factor_kg_co2e, 4), 'Vegetarian meals this week'
FROM emission_factors WHERE category = 'Food' AND activity_type = 'Vegetarian meal';

INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes)
SELECT @demo_id, factor_id, 12, '2026-09-15', ROUND(12 * factor_kg_co2e, 4), 'Weekly household waste'
FROM emission_factors WHERE category = 'Waste' AND activity_type = 'General waste (landfill)';
