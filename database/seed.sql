-- Seed data for Squad Game
-- Run this after creating the schema

-- ============================================
-- POLL BANK SEED DATA
-- ============================================

INSERT INTO poll_bank (question, options, active) VALUES
-- Preference questions
('What would you rather do this weekend?', '["Stay home and relax", "Go on an adventure", "Hang out with friends", "Learn something new"]', true),
('If you could only eat one cuisine forever, which would it be?', '["Italian", "Japanese", "Mexican", "Indian"]', true),
('What is your ideal vacation?', '["Beach resort", "City exploration", "Mountain hiking", "Camping in nature"]', true),
('Morning person or night owl?', '["Definitely morning", "More morning", "More night", "Definitely night owl"]', true),
('How do you recharge after a long day?', '["Exercise", "Netflix/gaming", "Reading", "Socializing"]', true),

-- Would you rather questions
('Would you rather have the ability to fly or be invisible?', '["Fly", "Be invisible", "Neither", "Both but only for 1 hour/day"]', true),
('Would you rather never use social media again or never watch TV/movies?', '["No social media", "No TV/movies", "I need both", "Easy, no social media"]', true),
('Would you rather have unlimited money or unlimited time?', '["Money", "Time", "A balance of both", "Neither matters"]', true),
('Would you rather always be 10 minutes late or 20 minutes early?', '["10 min late", "20 min early", "Depends on the occasion", "I am always on time"]', true),
('Would you rather live in a big city or a small town?', '["Big city", "Small town", "Suburbs", "Remote countryside"]', true),

-- Opinion questions
('What is the best social media platform?', '["Instagram", "TikTok", "Twitter/X", "None of them"]', true),
('Pizza toppings: pineapple - yes or no?', '["Absolutely yes", "Never", "Depends on my mood", "I do not care about pizza"]', true),
('Is a hot dog a sandwich?', '["Yes", "No", "It is its own thing", "This is a dumb question"]', true),
('Should you put milk or cereal first?', '["Cereal first", "Milk first", "I do not eat cereal", "Depends on the cereal"]', true),
('What is the best season?', '["Spring", "Summer", "Fall", "Winter"]', true),

-- Fun hypotheticals
('If you were an animal, which would you be?', '["Dog", "Cat", "Bird", "Something exotic"]', true),
('What superpower would you want?', '["Mind reading", "Super strength", "Teleportation", "Time control"]', true),
('If you could live in any fictional world, which one?', '["Harry Potter", "Marvel/DC Universe", "Star Wars", "Lord of the Rings"]', true),
('What decade would you time travel to?', '["1960s", "1980s", "1990s", "2050s"]', true),
('If you won the lottery, first purchase?', '["House", "Car", "Trip around world", "Pay off debt"]', true),

-- Daily life questions
('What is your go-to coffee order?', '["Black coffee", "Latte/Cappuccino", "Iced coffee", "I do not drink coffee"]', true),
('Favorite time to workout?', '["Morning", "Afternoon", "Evening", "I do not work out"]', true),
('How many tabs do you usually have open?', '["Less than 5", "5-15", "15-30", "Too many to count"]', true),
('Text or call?', '["Always text", "Always call", "Depends on the situation", "Voice messages"]', true),
('How do you organize your apps?', '["By category/folder", "Most used on home", "Alphabetically", "Total chaos"]', true),

-- Friend group specific
('Who is most likely to be late today?', '["I am never late", "Fashionably late always", "Only late for unimportant things", "Time is a construct"]', true),
('Group chat etiquette: read receipts on or off?', '["Always on", "Always off", "Depends on who", "I did not know that was a setting"]', true),
('Best way to settle an argument?', '["Rock paper scissors", "Coin flip", "Debate it out", "Ask a neutral party"]', true),
('How often do you check your phone?', '["Constantly", "Every few minutes", "Only when notified", "I try to limit screen time"]', true),
('What makes a good friend?', '["Loyalty", "Humor", "Honesty", "All of the above"]', true);

-- ============================================
-- NOTES
-- ============================================
-- Each squad will get one random poll question per day when the event type is POLL
-- Questions are selected randomly from active polls
-- You can add more questions anytime by inserting into poll_bank
