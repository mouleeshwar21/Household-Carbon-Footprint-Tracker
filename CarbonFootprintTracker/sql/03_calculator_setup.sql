-- =====================================================================
-- Household Carbon Footprint Tracker - Calculator setup
-- File: sql/03_calculator_setup.sql
--
-- Run this ONCE on your EXISTING carbon_tracker database
-- (after 01_schema.sql and 02_sample_data.sql).
-- It is safe to run again: the second time it changes nothing.
-- =====================================================================

USE carbon_tracker;

-- ---------------------------------------------------------------------
-- 1. Emission factors for fuel measured in LITRES.
--    (The older 'Petrol car' / 'Diesel car' rows are per KILOMETRE.)
--    Values are approximate - replace them with an official source.
--    ON DUPLICATE KEY ... makes the insert a no-op if the rows exist.
-- ---------------------------------------------------------------------
INSERT INTO emission_factors (category, activity_type, unit, factor_kg_co2e, source_note) VALUES
('Transport', 'Petrol fuel', 'litre', 2.3100, 'Approximate - verify'),
('Transport', 'Diesel fuel', 'litre', 2.6800, 'Approximate - verify')
ON DUPLICATE KEY UPDATE factor_id = factor_id;

-- ---------------------------------------------------------------------
-- 2. carbon_records.source tells us where a row came from:
--      'MANUAL'     = added on the Add Record screen (all existing rows)
--      'CALCULATOR' = saved from the Calculator screen
--    The calculator uses it to REPLACE its own rows for a month
--    without ever touching manual entries.
--    (MySQL has no "ADD COLUMN IF NOT EXISTS", so we check first.)
-- ---------------------------------------------------------------------
SET @has_source = (SELECT COUNT(*)
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = 'carbon_tracker'
                     AND TABLE_NAME   = 'carbon_records'
                     AND COLUMN_NAME  = 'source');

SET @ddl = IF(@has_source = 0,
    'ALTER TABLE carbon_records ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT ''MANUAL'' AFTER notes',
    'SELECT ''carbon_records.source already exists - nothing to do'' AS info');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 3. Check the result
--    Expect 5 rows below, and one row (source) from SHOW COLUMNS.
-- ---------------------------------------------------------------------
SELECT category, activity_type, unit, factor_kg_co2e
FROM emission_factors
WHERE activity_type IN ('Grid electricity', 'LPG', 'Petrol fuel', 'Diesel fuel', 'General waste (landfill)')
ORDER BY category, activity_type;

SHOW COLUMNS FROM carbon_records LIKE 'source';
