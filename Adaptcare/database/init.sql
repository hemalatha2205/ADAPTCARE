-- ===========================================
-- ADAPTCARE Database Setup Script
-- ===========================================
-- Run this script to create the database
-- MySQL 8.x required

-- Create database
CREATE DATABASE IF NOT EXISTS adaptcare
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create application user (optional - you can use root for local dev)
-- CREATE USER IF NOT EXISTS 'adaptcare_user'@'localhost' IDENTIFIED BY 'your_password_here';
-- GRANT ALL PRIVILEGES ON adaptcare.* TO 'adaptcare_user'@'localhost';
-- FLUSH PRIVILEGES;

USE adaptcare;

-- The schema is managed by Spring Boot JPA (ddl-auto: update)
-- Tables will be created automatically on first startup
-- This script is for initial database creation only

SELECT 'ADAPTCARE database created successfully!' AS status;
