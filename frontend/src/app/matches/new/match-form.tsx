"use client";

import { useState } from "react";
import type { Area, SkillLevel, Sport } from "@prisma/client";

import { createMatchAction } from "@/features/matches/match-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type SportWithLevels = Sport & { skillLevels: SkillLevel[] };

type MatchFormProps = {
  areas: Area[];
  sports: SportWithLevels[];
};

export function MatchForm({ areas, sports }: MatchFormProps) {
  const [selectedSportId, setSelectedSportId] = useState("");
  const selectedSport = sports.find((sport) => sport.id === selectedSportId);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={createMatchAction} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Môn thể thao</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="sportId"
                onChange={(event) => setSelectedSportId(event.target.value)}
                value={selectedSportId}
                required
              >
                <option value="">Chọn môn</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Khu vực</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="areaId" required>
                <option value="">Chọn khu vực</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Địa chỉ chi tiết</Label>
            <Input
              name="detailedAddress"
              maxLength={240}
              placeholder="Ví dụ: Sân số 2, 123 Trần Duy Hưng"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Thời gian diễn ra</Label>
              <Input name="time" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label>Số người cần tuyển</Label>
              <Input
                name="requiredPlayers"
                type="number"
                min={1}
                max={50}
                required
              />
            </div>
          </div>

          <fieldset className="grid gap-3 rounded-xl border border-border p-4">
            <legend className="-ml-1 bg-card px-1 text-sm font-semibold">Trình độ mong muốn</legend>
            {selectedSport ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {selectedSport.skillLevels.map((level) => (
                  <Label key={level.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-3 font-normal transition-colors hover:bg-muted/50">
                    <input className="size-4 accent-primary" name="expectedLevelIds" type="checkbox" value={level.id} />
                    {level.name}
                  </Label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Vui lòng chọn môn thể thao trước.</p>
            )}
          </fieldset>

          <div className="grid gap-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea className="min-h-28" name="description" maxLength={1000} />
          </div>

          <Button type="submit" className="w-full sm:w-fit">
            Tạo trận đấu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
