ALTER TABLE "offer_templates"
  ADD COLUMN "nennleistungKw"          DOUBLE PRECISION,
  ADD COLUMN "warmwasserSpeicherLiter" INTEGER,
  ADD COLUMN "heizkreiseAnzahl"        INTEGER,
  ADD COLUMN "mitSolar"                BOOLEAN NOT NULL DEFAULT false;
