"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type CompanySettings = {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function handleSave() {
    if (!settings) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success("Einstellungen gespeichert");
      else toast.error("Fehler beim Speichern");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  }

  if (!settings) {
    return <div className="text-muted-foreground">Laden...</div>;
  }

  function update(field: string, value: string) {
    setSettings((prev) => prev && { ...prev, [field]: value });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Firmendaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Firmenname</Label>
            <Input
              value={settings.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Straße</Label>
              <Input
                value={settings.street}
                onChange={(e) => update("street", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>PLZ</Label>
              <Input
                value={settings.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Stadt</Label>
            <Input
              value={settings.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={settings.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                value={settings.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={settings.website || ""}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => update("secondaryColor", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => update("secondaryColor", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Speichern..." : "Einstellungen speichern"}
      </Button>
    </div>
  );
}
