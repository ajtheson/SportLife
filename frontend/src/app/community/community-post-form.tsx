import type { Area, CommunityPost, CommunityPostType, Sport } from "@prisma/client";

import { saveCommunityPostAction } from "@/features/community/community-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { postTypeLabel } from "./page";

type CommunityPostFormProps = {
  areas: Area[];
  post?: CommunityPost;
  postTypes: CommunityPostType[];
  sports: Sport[];
};

export function CommunityPostForm({ areas, post, postTypes, sports }: CommunityPostFormProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form action={saveCommunityPostAction} className="grid gap-6">
          {post ? <input name="postId" type="hidden" value={post.id} /> : null}

          <div className="grid gap-2">
            <Label>Tiêu đề</Label>
            <Input
              maxLength={80}
              minLength={5}
              name="title"
              required
              defaultValue={post?.title ?? ""}
              placeholder="Ngắn gọn và rõ ràng"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Môn thể thao</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" defaultValue={post?.sportId ?? ""} required>
                <option value="" disabled>Chọn môn</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Chủ đề</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="postType" defaultValue={post?.postType ?? "DISCUSSION"} required>
                {postTypes.map((postType) => (
                  <option key={postType} value={postType}>
                    {postTypeLabel(postType)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Khu vực</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="areaId" defaultValue={post?.areaId ?? ""}>
                <option value="">Không có khu vực cụ thể</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Nội dung chi tiết</Label>
            <Textarea
              className="min-h-[16rem] leading-7"
              maxLength={3000}
              minLength={10}
              name="content"
              required
              defaultValue={post?.content ?? ""}
              placeholder="Xin lời khuyên, chia sẻ kinh nghiệm, thông báo sự kiện, v.v..."
            />
          </div>

          <Button type="submit" className="w-full sm:w-fit">
            {post ? "Lưu lại chờ duyệt" : "Đăng bài chờ duyệt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
