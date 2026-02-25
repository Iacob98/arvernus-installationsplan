"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Calendar } from "lucide-react";

type TemplateCardProps = {
  id: string;
  name: string;
  subject: string;
  imageCount: number;
  createdAt: Date;
};

export function TemplateCard({
  id,
  name,
  subject,
  imageCount,
  createdAt,
}: TemplateCardProps) {
  return (
    <Link href={`/campaigns/templates/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground truncate">{subject}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              {imageCount} Bilder
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(createdAt).toLocaleDateString("de-DE")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
