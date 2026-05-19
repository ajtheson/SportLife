import type { Area, Sport, Venue, VenueImage, VenueSport } from "@prisma/client";

import { saveVenueAction } from "@/features/venues/venue-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VenueWithRelations = (Venue & { sports: VenueSport[]; images: VenueImage[] }) | null;

type VenueFormProps = {
  areas: Area[];
  sports: Sport[];
  venue: VenueWithRelations;
  defaultPhone: string;
};

export function VenueForm({ areas, sports, venue, defaultPhone }: VenueFormProps) {
  const selectedSportId = venue?.sports[0]?.sportId ?? "";
  const imageUrls = venue?.images.map((image) => image.url).join("\n") ?? "";
  const openingHours =
    venue?.openingHours && typeof venue.openingHours === "object" && "text" in venue.openingHours
      ? String(venue.openingHours.text)
      : "";

  return (
    <form action={saveVenueAction} className="grid gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      {venue ? <input name="venueId" type="hidden" value={venue.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Tên sân</Label>
          <Input name="name" defaultValue={venue?.name ?? ""} required maxLength={120} placeholder="Nhập tên sân..." />
        </div>
        <div className="grid gap-2">
          <Label>Số điện thoại liên hệ</Label>
          <Input
            name="phone"
            defaultValue={venue?.phone ?? defaultPhone}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
            placeholder="Ví dụ: 0912345678"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Địa chỉ chi tiết</Label>
        <Input name="address" defaultValue={venue?.address ?? ""} required maxLength={240} placeholder="Số nhà, ngõ, đường..." />
      </div>

      <div className="grid gap-2">
        <Label>Khu vực (Hà Nội)</Label>
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="areaId" defaultValue={venue?.areaId ?? ""} required>
          <option value="" disabled>
            Chọn khu vực
          </option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label>Môn thể thao</Label>
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" defaultValue={selectedSportId} required>
          <option value="" disabled>
            Chọn môn thể thao
          </option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Giờ mở cửa</Label>
          <Input name="openingHours" defaultValue={openingHours} maxLength={300} placeholder="Ví dụ: 06:00 - 22:00 hàng ngày" />
        </div>
        <div className="grid gap-2">
          <Label>Giá tham khảo</Label>
          <Input name="referencePrice" defaultValue={venue?.referencePrice ?? ""} maxLength={120} placeholder="Ví dụ: 100k - 200k/giờ" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Ghi chú hoạt động</Label>
        <Textarea
          className="min-h-24"
          name="availabilityNote"
          defaultValue={venue?.availabilityNote ?? ""}
          maxLength={300}
          placeholder="Ví dụ: Thường trống sân vào các tối ngày thường, vui lòng gọi trước."
        />
      </div>

      <div className="grid gap-2">
        <Label>Mô tả chi tiết</Label>
        <Textarea className="min-h-28" name="description" defaultValue={venue?.description ?? ""} maxLength={1000} placeholder="Thông tin thêm về sân, tiện ích, chỗ để xe..." />
      </div>

      <div className="grid gap-2">
        <Label>Hình ảnh (URL)</Label>
        <Textarea
          className="min-h-24"
          name="imageUrls"
          defaultValue={imageUrls}
          placeholder="https://example.com/hinh-anh.jpg (Mỗi link 1 dòng)"
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start">
        Gửi yêu cầu duyệt
      </Button>
    </form>
  );
}
