
-- Update existing categories with the new Pennyekart ecosystem information
-- First, let's clear existing categories and insert the new ones with proper structure

-- Delete existing categories to start fresh
DELETE FROM categories;

-- Insert the new Pennyekart ecosystem categories
INSERT INTO categories (name, actual_fee, offer_fee, popup_image_url, is_active) VALUES 
('Pennyekart Free Registration', 500, 0, null, true),
('Pennyekart Paid Registration', 1000, 299, null, true),
('Farmelife - Dairy & Poultry Farm Connection', 800, 199, null, true),
('Organelife - Terrace & Organic Farming', 700, 149, null, true),
('Foodelife - Food Processing Business', 900, 249, null, true),
('Entrelife - Skilled Projects & Home Services', 750, 179, null, true),
('Job Card - Special Investment & Multi-Category Access', 1500, 499, null, true);
