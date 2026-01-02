-- Add unique constraint to prevent duplicate skills per user.
-- Safe migration: remove duplicates first, then add UNIQUE KEY.

USE careerpilot;

-- Remove duplicate skills (keep the lowest id per (user_id, skill_name))
DELETE s1
FROM skills s1
INNER JOIN skills s2
  ON s1.user_id = s2.user_id
 AND s1.skill_name = s2.skill_name
 AND s1.id > s2.id;

-- Add unique key (only if not already present)
ALTER TABLE skills
  ADD UNIQUE KEY unique_user_skill (user_id, skill_name);


