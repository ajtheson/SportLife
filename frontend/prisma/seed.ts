import {
  ApprovalStatus,
  CommunityPostType,
  ContentStatus,
  JoinRequestStatus,
  MatchStatus,
  NotificationType,
  PrismaClient,
  UserRole,
  UserStatus,
  VisibilityStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const initialSports = ["Bida", "Cầu lông", "Pickleball"];
const defaultLevels = ["Mới chơi", "Trung bình", "Khá giỏi"];
const initialAreas = [
  "Phường Ba Đình",
  "Phường Ngọc Hà",
  "Phường Giảng Võ",
  "Phường Hoàn Kiếm",
  "Phường Cửa Nam",
  "Phường Phú Thượng",
  "Phường Hồng Hà",
  "Phường Tây Hồ",
  "Phường Bồ Đề",
  "Phường Việt Hưng",
  "Phường Phúc Lợi",
  "Phường Long Biên",
  "Phường Nghĩa Đô",
  "Phường Cầu Giấy",
  "Phường Yên Hòa",
  "Phường Ô Chợ Dừa",
  "Phường Láng",
  "Phường Văn Miếu - Quốc Tử Giám",
  "Phường Kim Liên",
  "Phường Đống Đa",
  "Phường Hai Bà Trưng",
  "Phường Vĩnh Tuy",
  "Phường Bạch Mai",
  "Phường Vĩnh Hưng",
  "Phường Định Công",
  "Phường Tương Mai",
  "Phường Lĩnh Nam",
  "Phường Hoàng Mai",
  "Phường Hoàng Liệt",
  "Phường Yên Sở",
  "Phường Phương Liệt",
  "Phường Khương Đình",
  "Phường Thanh Xuân",
  "Phường Từ Liêm",
  "Phường Thượng Cát",
  "Phường Đông Ngạc",
  "Phường Xuân Đỉnh",
  "Phường Tây Tựu",
  "Phường Phú Diễn",
  "Phường Xuân Phương",
  "Phường Tây Mỗ",
  "Phường Đại Mỗ",
  "Phường Thanh Liệt",
  "Phường Kiến Hưng",
  "Phường Hà Đông",
  "Phường Yên Nghĩa",
  "Phường Phú Lương",
  "Phường Sơn Tây",
  "Phường Tùng Thiện",
  "Phường Dương Nội",
  "Phường Chương Mỹ",
  "Xã Sóc Sơn",
  "Xã Kim Anh",
  "Xã Trung Giã",
  "Xã Đa Phúc",
  "Xã Nội Bài",
  "Xã Đông Anh",
  "Xã Phúc Thịnh",
  "Xã Thư Lâm",
  "Xã Thiên Lộc",
  "Xã Vĩnh Thanh",
  "Xã Phù Đổng",
  "Xã Thuận An",
  "Xã Gia Lâm",
  "Xã Bát Tràng",
  "Xã Thanh Trì",
  "Xã Đại Thanh",
  "Xã Ngọc Hồi",
  "Xã Nam Phù",
  "Xã Yên Xuân",
  "Xã Quang Minh",
  "Xã Yên Lãng",
  "Xã Tiến Thắng",
  "Xã Mê Linh",
  "Xã Đoài Phương",
  "Xã Quảng Oai",
  "Xã Cổ Đô",
  "Xã Minh Châu",
  "Xã Vật Lại",
  "Xã Bất Bạt",
  "Xã Suối Hai",
  "Xã Ba Vì",
  "Xã Yên Bài",
  "Xã Phúc Thọ",
  "Xã Phúc Lộc",
  "Xã Hát Môn",
  "Xã Đan Phượng",
  "Xã Liên Minh",
  "Xã Ô Diên",
  "Xã Hoài Đức",
  "Xã Dương Hòa",
  "Xã Sơn Đồng",
  "Xã An Khánh",
  "Xã Quốc Oai",
  "Xã Kiều Phú",
  "Xã Hưng Đạo",
  "Xã Phú Cát",
  "Xã Thạch Thất",
  "Xã Hạ Bằng",
  "Xã Hòa Lạc",
  "Xã Tây Phương",
  "Xã Phú Nghĩa",
  "Xã Xuân Mai",
  "Xã Quảng Bị",
  "Xã Trần Phú",
  "Xã Hòa Phú",
  "Xã Thanh Oai",
  "Xã Bình Minh",
  "Xã Tam Hưng",
  "Xã Dân Hòa",
  "Xã Thường Tín",
  "Xã Hồng Vân",
  "Xã Thượng Phúc",
  "Xã Chương Dương",
  "Xã Phú Xuyên",
  "Xã Phượng Dực",
  "Xã Chuyên Mỹ",
  "Xã Đại Xuyên",
  "Xã Vân Đình",
  "Xã Ứng Thiên",
  "Xã Ứng Hòa",
  "Xã Hòa Xá",
  "Xã Mỹ Đức",
  "Xã Phúc Sơn",
  "Xã Hồng Sơn",
  "Xã Hương Sơn",
];

function areaType(areaName: string) {
  return areaName.startsWith("Phường ") ? "ward" : "commune";
}

const demoPassword = "Demo123456!";

const explicitPlayers = [
  {
    email: "player.anh@sportlife.local",
    displayName: "Nguyễn Anh",
    phone: "0900000001",
    areaIndex: 13,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Cầu lông", level: "Trung bình" },
      { sport: "Pickleball", level: "Mới chơi" },
    ],
  },
  {
    email: "player.binh@sportlife.local",
    displayName: "Trần Bình",
    phone: "0900000002",
    areaIndex: 16,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Cầu lông", level: "Khá giỏi" },
      { sport: "Bida", level: "Trung bình" },
    ],
  },
  {
    email: "player.chi@sportlife.local",
    displayName: "Lê Chi",
    phone: "0900000003",
    areaIndex: 21,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Pickleball", level: "Trung bình" },
      { sport: "Cầu lông", level: "Mới chơi" },
    ],
  },
  {
    email: "player.duy@sportlife.local",
    displayName: "Phạm Duy",
    phone: "0900000004",
    areaIndex: 31,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Bida", level: "Khá giỏi" },
      { sport: "Pickleball", level: "Trung bình" },
    ],
  },
  {
    email: "player.ha@sportlife.local",
    displayName: "Đỗ Hà",
    phone: "0900000005",
    areaIndex: 44,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Cầu lông", level: "Mới chơi" },
      { sport: "Bida", level: "Mới chơi" },
    ],
  },
  {
    email: "player.linh@sportlife.local",
    displayName: "Vũ Linh",
    phone: "0900000006",
    areaIndex: 49,
    status: UserStatus.ACTIVE,
    sports: [
      { sport: "Pickleball", level: "Khá giỏi" },
      { sport: "Cầu lông", level: "Trung bình" },
    ],
  },
];

const generatedPlayers = Array.from({ length: 20 }).map((_, i) => ({
  email: `player.gen${i + 1}@sportlife.local`,
  displayName: `Người chơi tự động ${i + 1}`,
  phone: `0901000${(i + 1).toString().padStart(3, "0")}`,
  areaIndex: i % 145,
  status: i % 5 === 0 ? UserStatus.LOCKED : UserStatus.ACTIVE,
  sports: [{ sport: initialSports[i % 3], level: defaultLevels[i % 3] }],
}));

const demoPlayers = [...explicitPlayers, ...generatedPlayers];

const demoOwners = [
  { email: "owner.caugiay@sportlife.local", businessName: "Trung tâm Thể thao Cầu Giấy", phone: "0910000001" },
  { email: "owner.hadong@sportlife.local", businessName: "Câu lạc bộ Năng động Hà Đông", phone: "0910000002" },
  { email: "owner.longbien@sportlife.local", businessName: "Cụm Sân Long Biên", phone: "0910000003" },
];

const demoEmails = [...demoPlayers.map((player) => player.email), ...demoOwners.map((owner) => owner.email)];

function addDays(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function seedDemoData() {
  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const sports = await prisma.sport.findMany({ include: { skillLevels: true } });
  const areas = await prisma.area.findMany({
    where: { city: "Hanoi", status: "ACTIVE" },
    orderBy: [{ type: "desc" }, { name: "asc" }],
  });
  const sportByName = new Map(sports.map((sport) => [sport.name, sport]));
  const areaAt = (index: number) => areas[index % areas.length];
  const levelId = (sportName: string, levelName: string) => {
    const sport = sportByName.get(sportName);
    const level = sport?.skillLevels.find((item) => item.name === levelName);

    if (!sport || !level) {
      throw new Error(`Missing seed config for ${sportName}/${levelName}`);
    }

    return { sportId: sport.id, skillLevelId: level.id };
  };

  const players = [];

  for (const player of demoPlayers) {
    const user = await prisma.user.create({
      data: {
        email: player.email,
        emailVerified: new Date(),
        passwordHash,
        role: UserRole.PLAYER,
        status: (player as any).status || UserStatus.ACTIVE,
        name: player.displayName,
        playerProfile: {
          create: {
            displayName: player.displayName,
            phone: player.phone,
            areaId: areaAt(player.areaIndex).id,
            availability: "Các buổi tối trong tuần và sáng cuối tuần",
            introduction: `${player.displayName} đang tìm kiếm những trận đấu giao lưu thân thiện và chia sẻ về thể thao.`,
            contactInfo: { phone: player.phone },
            sportLevels: {
              create: player.sports.map((item) => levelId(item.sport, item.level)),
            },
          },
        },
      },
      include: { playerProfile: true },
    });

    players.push(user);
  }

  const owners = [];

  for (const owner of demoOwners) {
    const user = await prisma.user.create({
      data: {
        email: owner.email,
        emailVerified: new Date(),
        passwordHash,
        role: UserRole.VENUE_OWNER,
        status: UserStatus.ACTIVE,
        name: owner.businessName,
        venueOwnerProfile: {
          create: {
            businessName: owner.businessName,
            phone: owner.phone,
            contactInfo: { phone: owner.phone },
          },
        },
      },
      include: { venueOwnerProfile: true },
    });

    owners.push(user);
  }

  const venueSeeds = [
    [owners[0], "Sân Cầu lông Cầu Giấy", "Cầu lông", areaAt(13), "0920000001", "12 Trần Thái Tông", "120,000 VNĐ/giờ", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[0], "Quán Bida Láng", "Bida", areaAt(16), "0920000002", "45 Đường Láng", "90,000 VNĐ/giờ", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[1], "Sân Pickleball Hà Đông", "Pickleball", areaAt(44), "0920000003", "8 Tô Hiệu", "180,000 VNĐ/giờ", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[1], "Câu lạc bộ Cầu lông Văn Quán", "Cầu lông", areaAt(45), "0920000004", "22 Văn Quán", "110,000 VNĐ/giờ", ApprovalStatus.PENDING_APPROVAL, VisibilityStatus.ACTIVE, null],
    [owners[2], "Sân Đa Năng Long Biên", "Pickleball", areaAt(11), "0920000005", "5 Nguyễn Văn Cừ", "160,000 VNĐ/giờ", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[2], "Bida Bồ Đề", "Bida", areaAt(8), "0920000006", "31 Bồ Đề", "100,000 VNĐ/giờ", ApprovalStatus.REJECTED, VisibilityStatus.ACTIVE, "Thiếu thông tin giờ mở cửa rõ ràng."],
  ] as const;

  for (const [owner, name, sportName, area, phone, address, price, approvalStatus, visibilityStatus, rejectionReason] of venueSeeds) {
    const sport = sportByName.get(sportName);

    if (!sport) throw new Error(`Missing sport ${sportName}`);

    await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name,
        address,
        areaId: area.id,
        phone,
        description: `${name} là sân demo để duyệt thử chức năng và tìm kiếm.`,
        availabilityNote: "Giờ trống được chủ sân cập nhật hàng ngày.",
        openingHours: { text: "08:00 - 22:00" },
        referencePrice: price,
        contactInfo: { phone },
        approvalStatus,
        visibilityStatus,
        rejectionReason,
        sports: { create: [{ sportId: sport.id }] },
        images: {
          create: [{ url: `https://placehold.co/800x500?text=${encodeURIComponent(name)}`, altText: name }],
        },
      },
    });
  }

  const matchSeeds = [
    {
      owner: players[0],
      sport: "Cầu lông",
      area: areaAt(13),
      time: addDays(1, 19),
      requiredPlayers: 2,
      levels: ["Mới chơi", "Trung bình"],
      description: "Giao lưu đánh đôi sau giờ làm. Vui lòng mang theo vợt.",
      requests: [
        { player: players[1], status: JoinRequestStatus.APPROVED, message: "Tôi có thể tham gia sau 18:30." },
        { player: players[4], status: JoinRequestStatus.PENDING, message: "Mình mới tập chơi nhưng rất nhiệt tình." },
      ],
    },
    {
      owner: players[2],
      sport: "Pickleball",
      area: areaAt(44),
      time: addDays(2, 8),
      requiredPlayers: 3,
      levels: ["Trung bình"],
      description: "Tập luyện pickleball buổi sáng, đánh nhẹ nhàng giao lưu.",
      requests: [{ player: players[5], status: JoinRequestStatus.APPROVED, message: "Mình có sẵn bóng nhé." }],
    },
    {
      owner: players[3],
      sport: "Bida",
      area: areaAt(16),
      time: addDays(3, 20),
      requiredPlayers: 1,
      levels: ["Khá giỏi"],
      description: "Cần tìm 1 bạn trình độ khá để luyện tập bida lỗ 9 bóng.",
      requests: [{ player: players[1], status: JoinRequestStatus.PENDING, message: "Chạm 7 không bạn?" }],
    },
    {
      owner: players[5],
      sport: "Pickleball",
      area: areaAt(11),
      time: addDays(4, 18),
      requiredPlayers: 2,
      levels: ["Trung bình", "Khá giỏi"],
      description: "Các trận đấu nhịp độ nhanh khu vực Long Biên.",
      requests: [
        { player: players[2], status: JoinRequestStatus.APPROVED, message: "Hẹn gặp lại ở sân." },
        { player: players[0], status: JoinRequestStatus.APPROVED, message: "Mình có thể chơi 90 phút." },
      ],
    },
  ];

  for (const seed of matchSeeds) {
    const sport = sportByName.get(seed.sport);
    if (!sport) throw new Error(`Missing sport ${seed.sport}`);

    const expectedLevelIds = seed.levels.map((level) => levelId(seed.sport, level).skillLevelId);
    const approvedCount = seed.requests.filter((request) => request.status === JoinRequestStatus.APPROVED).length;
    const match = await prisma.match.create({
      data: {
        ownerId: seed.owner.id,
        sportId: sport.id,
        areaId: seed.area.id,
        time: seed.time,
        detailedAddress: `${seed.area.name}, sân demo`,
        requiredPlayers: seed.requiredPlayers,
        expectedLevelId: expectedLevelIds[0] ?? null,
        status: approvedCount >= seed.requiredPlayers ? MatchStatus.FULL : MatchStatus.OPEN,
        description: seed.description,
        expectedLevels: { create: expectedLevelIds.map((skillLevelId) => ({ skillLevelId })) },
      },
    });

    for (const request of seed.requests) {
      const joinRequest = await prisma.matchJoinRequest.create({
        data: {
          matchId: match.id,
          requesterId: request.player.id,
          status: request.status,
          message: request.message,
        },
      });

      await prisma.notification.create({
        data: {
          recipientId: seed.owner.id,
          type: NotificationType.MATCH_JOIN_REQUESTED,
          referenceId: joinRequest.id,
        },
      });

      if (request.status === JoinRequestStatus.APPROVED) {
        await prisma.notification.create({
          data: {
            recipientId: request.player.id,
            type: NotificationType.MATCH_JOIN_APPROVED,
            referenceId: joinRequest.id,
          },
        });
      }
    }
  }

  const postSeeds = [
    {
      author: players[0],
      title: "Loại cầu lông nào tốt nhất cho sân trong nhà?",
      sport: "Cầu lông",
      type: CommunityPostType.ADVICE,
      area: areaAt(13),
      status: ContentStatus.VISIBLE,
      content: "Mình thường chơi trong nhà ở Cầu Giấy. Loại cầu nào bền và phù hợp cho đánh đôi trình độ trung bình?",
      comments: [
        { author: players[1], content: "Cầu Victor Gold khá ổn định cho nhóm mình." },
        { author: players[4], content: "Nếu quan tâm chi phí, bạn có thể thử Lining A+60." },
      ],
    },
    {
      author: players[2],
      title: "Vợt Pickleball cho lối đánh kiểm soát",
      sport: "Pickleball",
      type: CommunityPostType.ADVICE,
      area: areaAt(44),
      status: ContentStatus.VISIBLE,
      content: "Mình thích lối đánh mềm mại và dink hơn là đánh sức mạnh. Mọi người gợi ý vợt nào dễ mua ở Hà Nội nhé.",
      comments: [{ author: players[5], content: "Bạn tìm vợt dày 16mm nhé. Rất hữu ích khi đánh trên lưới (kitchen)." }],
    },
    {
      author: players[3],
      title: "Ý tưởng tổ chức giải Bida 9 bóng nhỏ",
      sport: "Bida",
      type: CommunityPostType.EVENT,
      area: areaAt(16),
      status: ContentStatus.PENDING,
      content: "Mình đang tính tổ chức giải 9 bóng cuối tuần, quy mô từ 8-12 người. Ai có gợi ý về thể thức thi đấu không?",
      comments: [],
    },
    {
      author: players[5],
      title: "Tập di chuyển chân trong Pickleball ở đâu?",
      sport: "Pickleball",
      type: CommunityPostType.DISCUSSION,
      area: areaAt(11),
      status: ContentStatus.VISIBLE,
      content: "Mình muốn tập các bước split step và di chuyển ngang. Bài tập nào hiệu quả với mọi người?",
      comments: [
        { author: players[2], content: "Khởi động di chuyển chân không (shadow drills) khoảng 10 phút trước trận là ổn." },
        { author: players[0], content: "Các bài tập chân của Cầu lông áp dụng sang cũng rất tốt." },
      ],
    },
    {
      author: players[4],
      title: "Câu hỏi về quấn cán vợt cầu lông cho người mới",
      sport: "Cầu lông",
      type: CommunityPostType.GENERAL,
      area: areaAt(31),
      status: ContentStatus.PENDING,
      content: "Cho mình hỏi nếu chơi 2 lần một tuần thì bao lâu nên thay quấn cán vợt 1 lần?",
      comments: [],
    },
  ];

  for (const seed of postSeeds) {
    const sport = sportByName.get(seed.sport);
    if (!sport) throw new Error(`Missing sport ${seed.sport}`);

    await prisma.communityPost.create({
      data: {
        authorId: seed.author.id,
        title: seed.title,
        sportId: sport.id,
        postType: seed.type,
        areaId: seed.area.id,
        status: seed.status,
        content: seed.content,
        comments: {
          create: seed.comments.map((comment) => ({
            authorId: comment.author.id,
            content: comment.content,
          })),
        },
      },
    });
  }

  console.log("Mật khẩu tài khoản demo:", demoPassword);
  console.log("Tài khoản người chơi demo:", demoPlayers[0].email);
  console.log("Tài khoản chủ sân demo:", demoOwners[0].email);
}

async function main() {
  for (const sportName of initialSports) {
    const sport = await prisma.sport.upsert({
      where: { name: sportName },
      update: { status: "ACTIVE" },
      create: { name: sportName },
    });

    for (const [index, levelName] of defaultLevels.entries()) {
      await prisma.skillLevel.upsert({
        where: {
          sportId_name: {
            sportId: sport.id,
            name: levelName,
          },
        },
        update: { order: index + 1, status: "ACTIVE" },
        create: {
          sportId: sport.id,
          name: levelName,
          order: index + 1,
        },
      });
    }
  }

  await prisma.area.updateMany({
    where: {
      city: "Hanoi",
      type: "district-placeholder",
    },
    data: { status: "INACTIVE" },
  });

  for (const areaName of initialAreas) {
    await prisma.area.upsert({
      where: {
        city_name_type: {
          city: "Hanoi",
          name: areaName,
          type: areaType(areaName),
        },
      },
      update: { status: "ACTIVE" },
      create: {
        city: "Hanoi",
        name: areaName,
        type: areaType(areaName),
      },
    });
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, emailVerified: new Date() },
      create: {
        email: adminEmail,
        emailVerified: new Date(),
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        name: "SportLife Admin",
      },
    });
  }

  await seedDemoData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
