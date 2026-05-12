-- Shift order of existing sections so DELIVERY_NOTE can occupy order=2
UPDATE "project_sections" SET "order" = "order" + 1 WHERE "order" >= 2;

-- Insert DELIVERY_NOTE section for every project that doesn't already have one
INSERT INTO "project_sections" ("id", "type", "order", "data", "completed", "projectId", "createdAt", "updatedAt")
SELECT
  'cm' || replace(gen_random_uuid()::text, '-', ''),
  'DELIVERY_NOTE'::"SectionType",
  2,
  '{"files": []}'::jsonb,
  false,
  p."id",
  NOW(),
  NOW()
FROM "projects" p
WHERE NOT EXISTS (
  SELECT 1 FROM "project_sections" ps
  WHERE ps."projectId" = p."id" AND ps."type" = 'DELIVERY_NOTE'
);
