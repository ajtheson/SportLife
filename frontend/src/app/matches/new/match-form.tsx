"use client";

import { useState } from "react";
import type { Area, SkillLevel, Sport } from "@prisma/client";

import { createMatchAction } from "@/features/matches/match-actions";

type SportWithLevels = Sport & { skillLevels: SkillLevel[] };

type MatchFormProps = {
  areas: Area[];
  sports: SportWithLevels[];
};

export function MatchForm({ areas, sports }: MatchFormProps) {
  const [selectedSportId, setSelectedSportId] = useState("");
  const selectedSport = sports.find((sport) => sport.id === selectedSportId);

  return (
    <form action={createMatchAction} className="grid gap-5 rounded-lg border border-[#d9d2c1] bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Sport
          <select
            className="rounded-md border border-[#d9d2c1] px-3 py-2"
            name="sportId"
            onChange={(event) => setSelectedSportId(event.target.value)}
            value={selectedSportId}
            required
          >
            <option value="">Select sport</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Area
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="areaId" required>
            <option value="">Select area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Detailed address
        <input
          className="rounded-md border border-[#d9d2c1] px-3 py-2"
          name="detailedAddress"
          maxLength={240}
          placeholder="Example: Court 2, 123 Tran Duy Hung"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Time
          <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="time" type="datetime-local" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Required players
          <input
            className="rounded-md border border-[#d9d2c1] px-3 py-2"
            name="requiredPlayers"
            type="number"
            min={1}
            max={50}
            required
          />
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Expected levels</legend>
        {selectedSport ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {selectedSport.skillLevels.map((level) => (
              <label key={level.id} className="flex items-center gap-2 rounded-md border border-[#e6dfd0] p-3 text-sm">
                <input name="expectedLevelIds" type="checkbox" value={level.id} />
                {level.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5f6b63]">Select a sport first.</p>
        )}
      </fieldset>

      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea className="min-h-28 rounded-md border border-[#d9d2c1] px-3 py-2" name="description" maxLength={1000} />
      </label>

      <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
        Create match
      </button>
    </form>
  );
}
