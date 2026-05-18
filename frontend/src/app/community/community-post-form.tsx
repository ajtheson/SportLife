import type { Area, CommunityPost, CommunityPostType, Sport } from "@prisma/client";

import { saveCommunityPostAction } from "@/features/community/community-actions";

type CommunityPostFormProps = {
  areas: Area[];
  post?: CommunityPost;
  postTypes: CommunityPostType[];
  sports: Sport[];
};

export function CommunityPostForm({ areas, post, postTypes, sports }: CommunityPostFormProps) {
  return (
    <form action={saveCommunityPostAction} className="grid gap-5 rounded-lg border border-[#d9d2c1] bg-white p-6">
      {post ? <input name="postId" type="hidden" value={post.id} /> : null}

      <label className="grid gap-2 text-sm font-medium">
        Title
        <input
          className="rounded-md border border-[#d9d2c1] px-3 py-2"
          maxLength={80}
          minLength={5}
          name="title"
          required
          defaultValue={post?.title ?? ""}
          placeholder="Keep it clear and short"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Sport
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" defaultValue={post?.sportId ?? ""} required>
            <option value="" disabled>
              Select sport
            </option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Type
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="postType" defaultValue={post?.postType ?? "DISCUSSION"} required>
            {postTypes.map((postType) => (
              <option key={postType} value={postType}>
                {postTypeLabel(postType)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Area
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="areaId" defaultValue={post?.areaId ?? ""}>
            <option value="">No specific area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          className="min-h-64 rounded-md border border-[#d9d2c1] px-3 py-2 leading-7"
          maxLength={3000}
          minLength={10}
          name="content"
          required
          defaultValue={post?.content ?? ""}
          placeholder="Ask for advice, share equipment experience, announce an event, or start a sport discussion."
        />
      </label>

      <button className="w-fit rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
        {post ? "Save for review" : "Submit for review"}
      </button>
    </form>
  );
}

function postTypeLabel(postType: CommunityPostType) {
  return postType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
