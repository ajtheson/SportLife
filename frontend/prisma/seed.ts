import {
  ApprovalStatus,
  CommunityPostType,
  ContentStatus,
  JoinRequestStatus,
  MatchStatus,
  NotificationType,
  PrismaClient,
  UserRole,
  VisibilityStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const initialSports = ["Billiard", "Badminton", "Pickleball"];
const defaultLevels = ["Beginner", "Intermediate", "Advanced"];
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

const demoPlayers = [
  {
    email: "player.anh@sportlife.local",
    displayName: "Anh Nguyen",
    phone: "0900000001",
    areaIndex: 13,
    sports: [
      { sport: "Badminton", level: "Intermediate" },
      { sport: "Pickleball", level: "Beginner" },
    ],
  },
  {
    email: "player.binh@sportlife.local",
    displayName: "Binh Tran",
    phone: "0900000002",
    areaIndex: 16,
    sports: [
      { sport: "Badminton", level: "Advanced" },
      { sport: "Billiard", level: "Intermediate" },
    ],
  },
  {
    email: "player.chi@sportlife.local",
    displayName: "Chi Le",
    phone: "0900000003",
    areaIndex: 21,
    sports: [
      { sport: "Pickleball", level: "Intermediate" },
      { sport: "Badminton", level: "Beginner" },
    ],
  },
  {
    email: "player.duy@sportlife.local",
    displayName: "Duy Pham",
    phone: "0900000004",
    areaIndex: 31,
    sports: [
      { sport: "Billiard", level: "Advanced" },
      { sport: "Pickleball", level: "Intermediate" },
    ],
  },
  {
    email: "player.ha@sportlife.local",
    displayName: "Ha Do",
    phone: "0900000005",
    areaIndex: 44,
    sports: [
      { sport: "Badminton", level: "Beginner" },
      { sport: "Billiard", level: "Beginner" },
    ],
  },
  {
    email: "player.linh@sportlife.local",
    displayName: "Linh Vu",
    phone: "0900000006",
    areaIndex: 49,
    sports: [
      { sport: "Pickleball", level: "Advanced" },
      { sport: "Badminton", level: "Intermediate" },
    ],
  },
];

const demoOwners = [
  { email: "owner.caugiay@sportlife.local", businessName: "Cau Giay Sports Hub", phone: "0910000001" },
  { email: "owner.hadong@sportlife.local", businessName: "Ha Dong Active Club", phone: "0910000002" },
  { email: "owner.longbien@sportlife.local", businessName: "Long Bien Court Group", phone: "0910000003" },
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
        status: "ACTIVE",
        name: player.displayName,
        playerProfile: {
          create: {
            displayName: player.displayName,
            phone: player.phone,
            areaId: areaAt(player.areaIndex).id,
            availability: "Weekday evenings and weekend mornings",
            introduction: `${player.displayName} is looking for friendly games and local sport discussions.`,
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
        status: "ACTIVE",
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
    [owners[0], "Cau Giay Badminton Arena", "Badminton", areaAt(13), "0920000001", "12 Tran Thai Tong", "120,000 VND/hour", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[0], "Lang Billiard Lounge", "Billiard", areaAt(16), "0920000002", "45 Lang Street", "90,000 VND/hour", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[1], "Ha Dong Pickleball Yard", "Pickleball", areaAt(44), "0920000003", "8 To Hieu", "180,000 VND/hour", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[1], "Van Quan Badminton Club", "Badminton", areaAt(45), "0920000004", "22 Van Quan", "110,000 VND/hour", ApprovalStatus.PENDING_APPROVAL, VisibilityStatus.ACTIVE, null],
    [owners[2], "Long Bien Multi Court", "Pickleball", areaAt(11), "0920000005", "5 Nguyen Van Cu", "160,000 VND/hour", ApprovalStatus.APPROVED, VisibilityStatus.ACTIVE, null],
    [owners[2], "Bo De Billiard House", "Billiard", areaAt(8), "0920000006", "31 Bo De", "100,000 VND/hour", ApprovalStatus.REJECTED, VisibilityStatus.ACTIVE, "Missing clear opening hours."],
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
        description: `${name} is a demo venue for browsing and admin review.`,
        availabilityNote: "Open slots are updated daily by the venue owner.",
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
      sport: "Badminton",
      area: areaAt(13),
      time: addDays(1, 19),
      requiredPlayers: 2,
      levels: ["Beginner", "Intermediate"],
      description: "Casual doubles session after work. Bring your own racket.",
      requests: [
        { player: players[1], status: JoinRequestStatus.APPROVED, message: "I can join after 18:30." },
        { player: players[4], status: JoinRequestStatus.PENDING, message: "Beginner but happy to rotate." },
      ],
    },
    {
      owner: players[2],
      sport: "Pickleball",
      area: areaAt(44),
      time: addDays(2, 8),
      requiredPlayers: 3,
      levels: ["Intermediate"],
      description: "Morning pickleball practice, friendly pace.",
      requests: [{ player: players[5], status: JoinRequestStatus.APPROVED, message: "I have balls." }],
    },
    {
      owner: players[3],
      sport: "Billiard",
      area: areaAt(16),
      time: addDays(3, 20),
      requiredPlayers: 1,
      levels: ["Advanced"],
      description: "Looking for one advanced player for 9-ball practice.",
      requests: [{ player: players[1], status: JoinRequestStatus.PENDING, message: "Interested in a race to 7." }],
    },
    {
      owner: players[5],
      sport: "Pickleball",
      area: areaAt(11),
      time: addDays(4, 18),
      requiredPlayers: 2,
      levels: ["Intermediate", "Advanced"],
      description: "Fast games near Long Bien.",
      requests: [
        { player: players[2], status: JoinRequestStatus.APPROVED, message: "See you there." },
        { player: players[0], status: JoinRequestStatus.APPROVED, message: "Can play 90 minutes." },
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
        detailedAddress: `${seed.area.name}, demo court`,
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
      title: "Best shuttlecocks for indoor courts?",
      sport: "Badminton",
      type: CommunityPostType.ADVICE,
      area: areaAt(13),
      status: ContentStatus.VISIBLE,
      content: "I usually play indoors around Cau Giay. Which shuttlecock brand lasts well for intermediate doubles?",
      comments: [
        { author: players[1], content: "Victor Gold feels consistent for our group." },
        { author: players[4], content: "If budget matters, try Lining A+60 first." },
      ],
    },
    {
      author: players[2],
      title: "Pickleball paddle for control style",
      sport: "Pickleball",
      type: CommunityPostType.ADVICE,
      area: areaAt(44),
      status: ContentStatus.VISIBLE,
      content: "I prefer soft touch and dinks over power. Looking for paddle suggestions available in Hanoi.",
      comments: [{ author: players[5], content: "Look for a 16mm control paddle. It helps a lot at the kitchen." }],
    },
    {
      author: players[3],
      title: "Small 9-ball tournament idea",
      sport: "Billiard",
      type: CommunityPostType.EVENT,
      area: areaAt(16),
      status: ContentStatus.PENDING,
      content: "Thinking about a small weekend 9-ball event with 8 to 12 players. Any format suggestions?",
      comments: [],
    },
    {
      author: players[5],
      title: "Where to practice pickleball footwork?",
      sport: "Pickleball",
      type: CommunityPostType.DISCUSSION,
      area: areaAt(11),
      status: ContentStatus.VISIBLE,
      content: "I want drills for split step and side movement. What routine works for you?",
      comments: [
        { author: players[2], content: "Do shadow drills before games, 10 minutes is enough." },
        { author: players[0], content: "Badminton ladder drills transfer well too." },
      ],
    },
    {
      author: players[4],
      title: "Beginner badminton grip question",
      sport: "Badminton",
      type: CommunityPostType.GENERAL,
      area: areaAt(31),
      status: ContentStatus.PENDING,
      content: "How often should a beginner replace overgrip when playing two times per week?",
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

  console.log("Demo accounts password:", demoPassword);
  console.log("Demo player:", demoPlayers[0].email);
  console.log("Demo owner:", demoOwners[0].email);
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
      update: { role: UserRole.ADMIN, status: "ACTIVE", emailVerified: new Date() },
      create: {
        email: adminEmail,
        emailVerified: new Date(),
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: UserRole.ADMIN,
        status: "ACTIVE",
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
