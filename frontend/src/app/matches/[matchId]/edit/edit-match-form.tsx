"use client";

import { useState } from "react";
import type { Area, SkillLevel, Sport, Match, MatchExpectedLevel } from "@prisma/client";

import { editMatchAction } from "@/features/matches/match-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type SportWithLevels = Sport & { skillLevels: SkillLevel[] };
type MatchData = Match & { expectedLevels: MatchExpectedLevel[] };

type EditMatchFormProps = {
  match: MatchData;
  areas: Area[];
  sports: SportWithLevels[];
};

export function EditMatchForm({ match, areas, sports }: EditMatchFormProps) {
  const [selectedSportId, setSelectedSportId] = useState(match.sportId);
  const selectedSport = sports.find((sport) => sport.id === selectedSportId);

  // Format date to local datetime string for input type="datetime-local"
  // Note: match.time is a Date object, need to convert it to YYYY-MM-DDThh:mm
  const formattedTime = new Date(match.time.getTime() - match.time.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={editMatchAction} className="grid gap-6">
          <input type="hidden" name="matchId" value={match.id} />
          
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Lưu ý khi sửa trận đấu</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Nếu bạn thay đổi thông tin, tất cả các yêu cầu xin tham gia hiện tại (bao gồm cả đã duyệt) sẽ bị hủy và trận đấu sẽ trở lại trạng thái OPEN. Người chơi cũ sẽ nhận được thông báo về sự thay đổi này.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                name="areaId" 
                defaultValue={match.areaId}
                required
              >
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
              defaultValue={match.detailedAddress || ""}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Thời gian diễn ra</Label>
              <Input name="time" type="datetime-local" defaultValue={formattedTime} required />
            </div>
            <div className="grid gap-2">
              <Label>Số người cần tuyển</Label>
              <Input
                name="requiredPlayers"
                type="number"
                min={1}
                max={50}
                defaultValue={match.requiredPlayers}
                required
              />
            </div>
          </div>

          <fieldset className="grid gap-3 rounded-xl border border-border p-4">
            <legend className="-ml-1 bg-card px-1 text-sm font-semibold">Trình độ mong muốn</legend>
            {selectedSport ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {selectedSport.skillLevels.map((level) => {
                  const isChecked = match.expectedLevels.some((el) => el.skillLevelId === level.id);
                  return (
                    <Label key={level.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-input p-3 font-normal transition-colors hover:bg-muted/50">
                      <input 
                        className="size-4 accent-primary" 
                        name="expectedLevelIds" 
                        type="checkbox" 
                        value={level.id} 
                        defaultChecked={isChecked}
                      />
                      {level.name}
                    </Label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Vui lòng chọn môn thể thao trước.</p>
            )}
          </fieldset>

          <div className="grid gap-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea 
              className="min-h-28" 
              name="description" 
              maxLength={1000} 
              defaultValue={match.description || ""}
            />
          </div>

          <Button type="submit" className="w-full sm:w-fit">
            Lưu thay đổi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
