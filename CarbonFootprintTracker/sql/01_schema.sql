-- =====================================================================
-- Household Carbon Footprint Tracker - Database Schema
-- File: sql/01_schema.sql
--
-- Requires: MySQL 8.0.16 or newer (CHECK constraints are enforced
--           from that version onward; older versions ignore them).
--
-- WARNING: Running this script DROPS and recreates all four tables.
--          That is convenient while developing, but do not run it on
--          a database that holds data you want to keep.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS carbon_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE carbon_tracker;

-- Drop tables in reverse order of dependency (child tables first)
DROP TABLE IF EXISTS carbon_records;
DROP TABLE IF EXISTS household_profiles;
DROP TABLE IF EXISTS emission_factors;
DROP TABLE IF EXISTS users;


-- ---------------------------------------------------------------------
-- 1. USERS
--    One row per registered account.
--    Java: model/User.java, dao/UserDAO.java
--    password_hash will hold the salted hash produced by PasswordUtil
--    (never store the plain password).
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id        INT           NOT NULL AUTO_INCREMENT,
    full_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(150)  NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;


-- ---------------------------------------------------------------------
-- 2. HOUSEHOLD_PROFILES
--    Exactly one profile per user (one-to-one, enforced by UNIQUE user_id).
--    Java: model/HouseholdProfile.java, dao/HouseholdProfileDAO.java
--    monthly_target_kg is the user's optional CO2e goal for the dashboard.
-- ---------------------------------------------------------------------
CREATE TABLE household_profiles (
    profile_id         INT            NOT NULL AUTO_INCREMENT,
    user_id            INT            NOT NULL,
    household_name     VARCHAR(100)   NULL,
    num_members        INT            NOT NULL DEFAULT 1,
    home_type          ENUM('Apartment', 'Independent House', 'Villa',
                            'Shared Room', 'Other')
                                      NOT NULL DEFAULT 'Apartment',
    home_area_sqft     INT            NULL,
    city               VARCHAR(100)   NULL,
    country            VARCHAR(100)   NULL,
    monthly_target_kg  DECIMAL(10,2)  NULL,
    created_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (profile_id),
    UNIQUE KEY uq_household_user (user_id),
    CONSTRAINT fk_household_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_household_members CHECK (num_members >= 1),
    CONSTRAINT chk_household_area    CHECK (home_area_sqft IS NULL OR home_area_sqft > 0),
    CONSTRAINT chk_household_target  CHECK (monthly_target_kg IS NULL OR monthly_target_kg > 0)
) ENGINE=InnoDB;


-- ---------------------------------------------------------------------
-- 3. EMISSION_FACTORS
--    Lookup table: how many kg of CO2e one unit of an activity produces.
--    Java: model/EmissionFactor.java, dao/EmissionFactorDAO.java
--    is_active lets you retire a factor without deleting it, because old
--    carbon_records may still point to it.
-- ---------------------------------------------------------------------
CREATE TABLE emission_factors (
    factor_id       INT            NOT NULL AUTO_INCREMENT,
    category        VARCHAR(50)    NOT NULL,
    activity_type   VARCHAR(100)   NOT NULL,
    unit            VARCHAR(30)    NOT NULL,
    factor_kg_co2e  DECIMAL(10,4)  NOT NULL,
    source_note     VARCHAR(255)   NULL,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (factor_id),
    UNIQUE KEY uq_factor_category_activity (category, activity_type),
    CONSTRAINT chk_factor_value CHECK (factor_kg_co2e >= 0)
) ENGINE=InnoDB;


-- ---------------------------------------------------------------------
-- 4. CARBON_RECORDS
--    One row per logged activity (e.g. "240 kWh of electricity on 5 Aug").
--    Java: model/CarbonRecord.java, dao/CarbonRecordDAO.java
--    co2e_kg is calculated by EmissionCalculator (quantity x factor) and
--    STORED at entry time, so old history does not change if a factor is
--    edited later.
-- ---------------------------------------------------------------------
CREATE TABLE carbon_records (
    record_id    INT            NOT NULL AUTO_INCREMENT,
    user_id      INT            NOT NULL,
    factor_id    INT            NOT NULL,
    quantity     DECIMAL(12,3)  NOT NULL,
    record_date  DATE           NOT NULL,
    co2e_kg      DECIMAL(14,4)  NOT NULL,
    notes        VARCHAR(255)   NULL,
    -- 'MANUAL' = Add Record screen, 'CALCULATOR' = saved from the Calculator screen
    source       VARCHAR(20)    NOT NULL DEFAULT 'MANUAL',
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (record_id),
    -- Speeds up the most common query: "this user's records for a month"
    KEY idx_records_user_date (user_id, record_date),
    CONSTRAINT fk_records_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_records_factor
        FOREIGN KEY (factor_id) REFERENCES emission_factors (factor_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_records_quantity CHECK (quantity > 0),
    CONSTRAINT chk_records_co2e     CHECK (co2e_kg >= 0)
) ENGINE=InnoDB;


-- ---------------------------------------------------------------------
-- OPTIONAL: a dedicated MySQL account for the Java app (better practice
-- than connecting as root). Remove the leading "-- " from the lines below,
-- change the password, and run them once.
-- ---------------------------------------------------------------------
-- CREATE USER 'carbon_app'@'localhost' IDENTIFIED BY 'ChangeThisPassword#1';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON carbon_tracker.* TO 'carbon_app'@'localhost';
-- FLUSH PRIVILEGES;
