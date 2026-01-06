-- Add expected_approach column to coding_questions for richer technical challenges details.
USE careerpilot;

ALTER TABLE coding_questions
  ADD COLUMN expected_approach TEXT NULL AFTER constraints;



