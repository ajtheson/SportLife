import {
  ApprovalStatus,
  BookingStatus,
  CommunityPostType,
  ConfigStatus,
  ContentStatus,
  JoinRequestStatus,
  MatchStatus,
  NotificationType,
  PrismaClient,
  TimeSlotStatus,
  UserRole,
  UserStatus,
  VenueResourceStatus,
  VisibilityStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

const demoPassword = "Demo123456!";

const sports = ["Bida", "Cầu lông", "Pickleball"] as const;
const levels = ["Mới chơi", "Trung bình", "Khá giỏi"] as const;

const hanoiAreas = [
  ["Xã Thanh Trì", "commune"],
  ["Xã Đại Thanh", "commune"],
  ["Xã Nam Phù", "commune"],
  ["Xã Ngọc Hồi", "commune"],
  ["Xã Thượng Phúc", "commune"],
  ["Xã Thường Tín", "commune"],
  ["Xã Chương Dương", "commune"],
  ["Xã Hồng Vân", "commune"],
  ["Xã Phú Xuyên", "commune"],
  ["Xã Phượng Dực", "commune"],
  ["Xã Chuyên Mỹ", "commune"],
  ["Xã Đại Xuyên", "commune"],
  ["Xã Thanh Oai", "commune"],
  ["Xã Bình Minh", "commune"],
  ["Xã Tam Hưng", "commune"],
  ["Xã Dân Hòa", "commune"],
  ["Xã Vân Đình", "commune"],
  ["Xã Ứng Thiên", "commune"],
  ["Xã Hòa Xá", "commune"],
  ["Xã Ứng Hòa", "commune"],
  ["Xã Mỹ Đức", "commune"],
  ["Xã Hồng Sơn", "commune"],
  ["Xã Phúc Sơn", "commune"],
  ["Xã Hương Sơn", "commune"],
  ["Xã Phú Nghĩa", "commune"],
  ["Xã Xuân Mai", "commune"],
  ["Xã Trần Phú", "commune"],
  ["Xã Hòa Phú", "commune"],
  ["Xã Quảng Bị", "commune"],
  ["Xã Minh Châu", "commune"],
  ["Xã Quảng Oai", "commune"],
  ["Xã Vật Lại", "commune"],
  ["Xã Cổ Đô", "commune"],
  ["Xã Bất Bạt", "commune"],
  ["Xã Suối Hai", "commune"],
  ["Xã Ba Vì", "commune"],
  ["Xã Yên Bài", "commune"],
  ["Xã Đoài Phương", "commune"],
  ["Xã Phúc Thọ", "commune"],
  ["Xã Phúc Lộc", "commune"],
  ["Xã Hát Môn", "commune"],
  ["Xã Thạch Thất", "commune"],
  ["Xã Hạ Bằng", "commune"],
  ["Xã Tây Phương", "commune"],
  ["Xã Hòa Lạc", "commune"],
  ["Xã Yên Xuân", "commune"],
  ["Xã Quốc Oai", "commune"],
  ["Xã Hưng Đạo", "commune"],
  ["Xã Kiều Phú", "commune"],
  ["Xã Phù Cát", "commune"],
  ["Xã Hoài Đức", "commune"],
  ["Xã Dương Hòa", "commune"],
  ["Xã Sơn Đồng", "commune"],
  ["Xã An Khánh", "commune"],
  ["Xã Đan Phượng", "commune"],
  ["Xã Ô Diên", "commune"],
  ["Xã Liên Minh", "commune"],
  ["Xã Gia Lâm", "commune"],
  ["Xã Thuận An", "commune"],
  ["Xã Bát Tràng", "commune"],
  ["Xã Phù Đổng", "commune"],
  ["Xã Thư Lâm", "commune"],
  ["Xã Đông Anh", "commune"],
  ["Xã Phúc Thịnh", "commune"],
  ["Xã Thiên Lộc", "commune"],
  ["Xã Vĩnh Thanh", "commune"],
  ["Xã Mê Linh", "commune"],
  ["Xã Yên Lãng", "commune"],
  ["Xã Tiến Thắng", "commune"],
  ["Xã Quang Minh", "commune"],
  ["Xã Sóc Sơn", "commune"],
  ["Xã Đa Phúc", "commune"],
  ["Xã Nội Bài", "commune"],
  ["Xã Trung Giã", "commune"],
  ["Xã Kim Anh", "commune"],
  ["Phường Hoàn Kiếm", "ward"],
  ["Phường Cửa Nam", "ward"],
  ["Phường Ba Đình", "ward"],
  ["Phường Ngọc Hà", "ward"],
  ["Phường Giảng Võ", "ward"],
  ["Phường Hai Bà Trưng", "ward"],
  ["Phường Vĩnh Tuy", "ward"],
  ["Phường Bạch Mai", "ward"],
  ["Phường Đống Đa", "ward"],
  ["Phường Kim Liên", "ward"],
  ["Phường Văn Miếu - Quốc Tử Giám", "ward"],
  ["Phường Láng", "ward"],
  ["Phường Ô Chợ Dừa", "ward"],
  ["Phường Hồng Hà", "ward"],
  ["Phường Lĩnh Nam", "ward"],
  ["Phường Hoàng Mai", "ward"],
  ["Phường Vĩnh Hưng", "ward"],
  ["Phường Tương Mai", "ward"],
  ["Phường Định Công", "ward"],
  ["Phường Hoàng Liệt", "ward"],
  ["Phường Yên Sở", "ward"],
  ["Phường Thanh Xuân", "ward"],
  ["Phường Khương Đình", "ward"],
  ["Phường Phương Liệt", "ward"],
  ["Phường Cầu Giấy", "ward"],
  ["Phường Nghĩa Đô", "ward"],
  ["Phường Yên Hòa", "ward"],
  ["Phường Tây Hồ", "ward"],
  ["Phường Phú Thượng", "ward"],
  ["Phường Tây Tựu", "ward"],
  ["Phường Phú Diễn", "ward"],
  ["Phường Xuân Đỉnh", "ward"],
  ["Phường Đông Ngạc", "ward"],
  ["Phường Thượng Cát", "ward"],
  ["Phường Từ Liêm", "ward"],
  ["Phường Xuân Phương", "ward"],
  ["Phường Tây Mỗ", "ward"],
  ["Phường Đại Mỗ", "ward"],
  ["Phường Long Biên", "ward"],
  ["Phường Bồ Đề", "ward"],
  ["Phường Việt Hưng", "ward"],
  ["Phường Phúc Lợi", "ward"],
  ["Phường Hà Đông", "ward"],
  ["Phường Dương Nội", "ward"],
  ["Phường Yên Nghĩa", "ward"],
  ["Phường Phú Lương", "ward"],
  ["Phường Kiến Hưng", "ward"],
  ["Phường Thanh Liệt", "ward"],
  ["Phường Chương Mỹ", "ward"],
  ["Phường Sơn Tây", "ward"],
  ["Phường Tùng Thiện", "ward"],
] as const;

const imageCatalog = {
  badminton: [
    {
      url: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Vợt và cầu lông trên mặt sân xanh",
    },
    {
      url: "https://images.pexels.com/photos/8007493/pexels-photo-8007493.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Hai vợt cầu lông trên sân đỏ trong nhà",
    },
  ],
  pickleball: [
    {
      url: "https://images.pexels.com/photos/29820786/pexels-photo-29820786.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Sân pickleball ngoài trời với lưới và vạch sân",
    },
    {
      url: "https://images.pexels.com/photos/35214630/pexels-photo-35214630.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Lưới trên sân thể thao xanh ngoài trời",
    },
  ],
  billiards: [
    {
      url: "https://images.pexels.com/photos/7403960/pexels-photo-7403960.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Người chơi bida trên bàn xanh trong phòng ánh sáng thấp",
    },
    {
      url: "https://images.pexels.com/photos/10627128/pexels-photo-10627128.jpeg?auto=compress&cs=tinysrgb&w=1200",
      altText: "Bóng bida trên bàn xanh trong phòng chơi",
    },
  ],
};

const players = [
  {
    email: "player.anh@sportlife.local",
    name: "Nguyễn Minh Anh",
    phone: "0900000001",
    area: "Phường Cầu Giấy",
    sports: [
      ["Cầu lông", "Trung bình"],
      ["Pickleball", "Mới chơi"],
    ],
    availability: "Tối thứ 3, thứ 5 và sáng Chủ nhật.",
    introduction: "Thích đánh đôi cầu lông sau giờ làm, ưu tiên kèo vui vẻ và đúng giờ.",
  },
  {
    email: "player.binh@sportlife.local",
    name: "Trần Đức Bình",
    phone: "0900000002",
    area: "Phường Láng",
    sports: [
      ["Bida", "Khá giỏi"],
      ["Cầu lông", "Trung bình"],
    ],
    availability: "Tối trong tuần sau 19:00.",
    introduction: "Chơi bida 9 bi và thỉnh thoảng tìm bạn cầu lông khu Đống Đa.",
  },
  {
    email: "player.chi@sportlife.local",
    name: "Lê Mai Chi",
    phone: "0900000003",
    area: "Phường Hà Đông",
    sports: [
      ["Pickleball", "Trung bình"],
      ["Cầu lông", "Mới chơi"],
    ],
    availability: "Sáng thứ 7 và Chủ nhật.",
    introduction: "Đang tập pickleball, thích các buổi chơi kỹ thuật nhẹ và có hướng dẫn.",
  },
  {
    email: "player.duy@sportlife.local",
    name: "Phạm Anh Duy",
    phone: "0900000004",
    area: "Phường Tây Hồ",
    sports: [
      ["Pickleball", "Khá giỏi"],
      ["Bida", "Trung bình"],
    ],
    availability: "Cuối tuần hoặc tối thứ 6.",
    introduction: "Ưu tiên pickleball nhịp nhanh, có thể tham gia cả kèo giao lưu.",
  },
  {
    email: "player.ha@sportlife.local",
    name: "Đỗ Ngọc Hà",
    phone: "0900000005",
    area: "Phường Thanh Xuân",
    sports: [
      ["Cầu lông", "Mới chơi"],
      ["Bida", "Mới chơi"],
    ],
    availability: "Tối thứ 2 và thứ 4.",
    introduction: "Người mới, muốn tìm nhóm thân thiện để luyện đều.",
  },
  {
    email: "player.linh@sportlife.local",
    name: "Vũ Quang Linh",
    phone: "0900000006",
    area: "Phường Long Biên",
    sports: [
      ["Cầu lông", "Khá giỏi"],
      ["Pickleball", "Trung bình"],
    ],
    availability: "Sáng sớm các ngày trong tuần.",
    introduction: "Thích các trận có nhịp độ ổn định, ưu tiên khu Long Biên.",
  },
  {
    email: "player.trang@sportlife.local",
    name: "Hoàng Thu Trang",
    phone: "0900000007",
    area: "Phường Hoàng Mai",
    sports: [["Cầu lông", "Trung bình"]],
    availability: "Sau 18:30 các ngày thường.",
    introduction: "Tìm bạn đánh đôi nữ hoặc đôi nam nữ khu Hoàng Mai.",
  },
  {
    email: "player.khoa@sportlife.local",
    name: "Bùi Minh Khoa",
    phone: "0900000008",
    area: "Phường Bồ Đề",
    sports: [["Bida", "Trung bình"]],
    availability: "Tối thứ 7.",
    introduction: "Chơi bida giải trí, ưu tiên bàn sạch và không gian yên tĩnh.",
  },
] as const;

const owners = [
  {
    email: "owner.caugiay@sportlife.local",
    businessName: "SportHub Cầu Giấy",
    phone: "0910000001",
  },
  {
    email: "owner.hadong@sportlife.local",
    businessName: "Hà Đông Active Club",
    phone: "0910000002",
  },
  {
    email: "owner.longbien@sportlife.local",
    businessName: "Long Biên Sports Center",
    phone: "0910000003",
  },
  {
    email: "owner.tayho@sportlife.local",
    businessName: "Tây Hồ Racket Club",
    phone: "0910000004",
  },
] as const;

function addDays(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function dayStart(days: number) {
  return addDays(days, 0);
}

function orderedPair(userAId: string, userBId: string) {
  return [userAId, userBId].sort() as [string, string];
}

type UserDataRow = {
  name: string;
  email: string;
  phone: string;
};

const userDataAreas = [
  "Phường Cầu Giấy",
  "Phường Láng",
  "Phường Hà Đông",
  "Phường Tây Hồ",
  "Phường Thanh Xuân",
  "Phường Long Biên",
  "Phường Bồ Đề",
  "Phường Hoàng Mai",
  "Phường Đống Đa",
  "Phường Hai Bà Trưng",
] as const;

const userDataSportProfiles = [
  [
    ["Cầu lông", "Mới chơi"],
    ["Pickleball", "Mới chơi"],
  ],
  [
    ["Cầu lông", "Trung bình"],
    ["Bida", "Mới chơi"],
  ],
  [
    ["Pickleball", "Trung bình"],
    ["Cầu lông", "Mới chơi"],
  ],
  [
    ["Bida", "Trung bình"],
    ["Cầu lông", "Trung bình"],
  ],
  [
    ["Pickleball", "Khá giỏi"],
    ["Bida", "Trung bình"],
  ],
  [
    ["Cầu lông", "Khá giỏi"],
    ["Pickleball", "Trung bình"],
  ],
] as const;

const userDataAvailability = [
  "Tối thứ 2 và thứ 4 sau 19:00.",
  "Cuối tuần buổi sáng, ưu tiên khu gần nhà.",
  "Sau giờ làm các ngày trong tuần.",
  "Tối thứ 6 hoặc chiều Chủ nhật.",
  "Linh hoạt theo nhóm, báo trước một ngày.",
  "Sáng sớm trước giờ làm.",
] as const;

function loadUserDataRows() {
  const candidatePaths = [resolve(process.cwd(), "../user-data.txt"), resolve(process.cwd(), "user-data.txt")];
  const filePath = candidatePaths.find((candidate) => existsSync(candidate));

  if (!filePath) {
    return [] satisfies UserDataRow[];
  }

  const rows = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, email, phone, ...rest] = line.split("|").map((part) => part.trim());

      if (!name || !email || !phone || rest.length > 0) {
        throw new Error(`Invalid user-data row ${index + 1}: ${line}`);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`Invalid user-data email at row ${index + 1}: ${email}`);
      }

      if (!/^\d{10}$/.test(phone)) {
        throw new Error(`Invalid user-data phone at row ${index + 1}: ${phone}`);
      }

      return { name, email: email.toLowerCase(), phone };
    });

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (const row of rows) {
    if (seenEmails.has(row.email)) {
      throw new Error(`Duplicate user-data email: ${row.email}`);
    }

    if (seenPhones.has(row.phone)) {
      throw new Error(`Duplicate user-data phone: ${row.phone}`);
    }

    seenEmails.add(row.email);
    seenPhones.add(row.phone);
  }

  return rows;
}

async function seedConfig() {
  for (const sportName of sports) {
    const sport = await prisma.sport.upsert({
      where: { name: sportName },
      update: { status: ConfigStatus.ACTIVE },
      create: { name: sportName },
    });

    for (const [index, levelName] of levels.entries()) {
      await prisma.skillLevel.upsert({
        where: { sportId_name: { sportId: sport.id, name: levelName } },
        update: { order: index + 1, status: ConfigStatus.ACTIVE },
        create: { sportId: sport.id, name: levelName, order: index + 1 },
      });
    }
  }

  await prisma.area.updateMany({
    where: { city: "Hanoi" },
    data: { status: ConfigStatus.INACTIVE },
  });

  for (const [name, type] of hanoiAreas) {
    await prisma.area.upsert({
      where: { city_name_type: { city: "Hanoi", name, type } },
      update: { status: ConfigStatus.ACTIVE },
      create: { city: "Hanoi", name, type, status: ConfigStatus.ACTIVE },
    });
  }
}

async function seedUsers(passwordHash: string) {
  const userDataRows = loadUserDataRows();

  await prisma.user.deleteMany({
    where: {
      role: { in: [UserRole.PLAYER, UserRole.VENUE_OWNER] },
      email: { endsWith: "@sportlife.local" },
    },
  });

  if (userDataRows.length > 0) {
    await prisma.user.deleteMany({
      where: {
        role: UserRole.PLAYER,
        email: { in: userDataRows.map((row) => row.email) },
      },
    });
  }

  const areas = await prisma.area.findMany({ where: { city: "Hanoi", status: ConfigStatus.ACTIVE } });
  const sportRows = await prisma.sport.findMany({ include: { skillLevels: true } });
  const areaByName = new Map(areas.map((area) => [area.name, area]));
  const sportByName = new Map(sportRows.map((sport) => [sport.name, sport]));

  const findLevel = (sportName: string, levelName: string) => {
    const sport = sportByName.get(sportName);
    const level = sport?.skillLevels.find((item) => item.name === levelName);

    if (!sport || !level) {
      throw new Error(`Missing sport level: ${sportName}/${levelName}`);
    }

    return { sportId: sport.id, skillLevelId: level.id };
  };

  const findArea = (areaName: string) => {
    const area = areaByName.get(areaName);

    if (!area) {
      throw new Error(`Missing area: ${areaName}`);
    }

    return area;
  };

  const createdPlayers = new Map<string, { id: string; email: string }>();
  const createdOwners = new Map<string, { id: string; email: string }>();

  for (const player of players) {
    const user = await prisma.user.create({
      data: {
        email: player.email,
        emailVerified: new Date(),
        passwordHash,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        name: player.name,
        playerProfile: {
          create: {
            displayName: player.name,
            phone: player.phone,
            areaId: findArea(player.area).id,
            availability: player.availability,
            introduction: player.introduction,
            contactInfo: { phone: player.phone },
            sportLevels: {
              create: player.sports.map(([sportName, levelName]) => findLevel(sportName, levelName)),
            },
          },
        },
      },
    });

    createdPlayers.set(player.email, user);
  }

  for (const [index, row] of userDataRows.entries()) {
    const areaName = userDataAreas[index % userDataAreas.length];
    const sportProfiles = userDataSportProfiles[index % userDataSportProfiles.length];
    const availability = userDataAvailability[index % userDataAvailability.length];

    const user = await prisma.user.create({
      data: {
        email: row.email,
        emailVerified: new Date(),
        passwordHash,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        name: row.name,
        playerProfile: {
          create: {
            displayName: row.name,
            phone: row.phone,
            areaId: findArea(areaName).id,
            availability,
            introduction: `Người chơi SportLife tại ${areaName}, muốn tìm nhóm phù hợp để chơi đều và đúng giờ.`,
            contactInfo: { phone: row.phone },
            sportLevels: {
              create: sportProfiles.map(([sportName, levelName]) => findLevel(sportName, levelName)),
            },
          },
        },
      },
    });

    createdPlayers.set(row.email, user);
  }

  for (const owner of owners) {
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
    });

    createdOwners.set(owner.email, user);
  }

  return { createdPlayers, createdOwners, findArea, sportByName, findLevel };
}

async function seedVenues(input: Awaited<ReturnType<typeof seedUsers>>) {
  const venueSeeds = [
    {
      owner: "owner.caugiay@sportlife.local",
      name: "Cầu lông Cầu Giấy Arena",
      sport: "Cầu lông",
      area: "Phường Cầu Giấy",
      address: "12 Trần Thái Tông, Cầu Giấy",
      phone: "0920000001",
      price: "120,000 - 160,000 VNĐ/giờ",
      availability: "Còn sân sau 20:00 các ngày thứ 2 đến thứ 5.",
      description: "Cụm sân trong nhà, ánh sáng đều, phù hợp đánh đôi sau giờ làm.",
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      images: imageCatalog.badminton,
    },
    {
      owner: "owner.caugiay@sportlife.local",
      name: "Bida Láng 9 Ball Club",
      sport: "Bida",
      area: "Phường Láng",
      address: "45 Đường Láng, Đống Đa",
      phone: "0920000002",
      price: "90,000 - 120,000 VNĐ/giờ",
      availability: "Buổi chiều thường vắng, tối cuối tuần nên đặt trước.",
      description: "Không gian yên tĩnh, bàn 9 bi và 10 bi cho người chơi luyện tập.",
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      images: imageCatalog.billiards,
    },
    {
      owner: "owner.hadong@sportlife.local",
      name: "Pickleball Hà Đông Club",
      sport: "Pickleball",
      area: "Phường Hà Đông",
      address: "8 Tô Hiệu, Hà Đông",
      phone: "0920000003",
      price: "180,000 - 220,000 VNĐ/giờ",
      availability: "Sáng cuối tuần còn vài khung 7:00 - 10:00.",
      description: "Sân ngoài trời có lưới cố định, phù hợp nhóm mới tập và trung bình.",
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      images: imageCatalog.pickleball,
    },
    {
      owner: "owner.longbien@sportlife.local",
      name: "Long Biên Pickleball Yard",
      sport: "Pickleball",
      area: "Phường Long Biên",
      address: "5 Nguyễn Văn Cừ, Long Biên",
      phone: "0920000004",
      price: "160,000 - 200,000 VNĐ/giờ",
      availability: "Có lớp nhập môn vào sáng thứ 7.",
      description: "Sân rộng, có khu ngồi chờ và cho thuê vợt pickleball.",
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      images: [imageCatalog.pickleball[1]],
    },
    {
      owner: "owner.tayho@sportlife.local",
      name: "Tây Hồ Badminton House",
      sport: "Cầu lông",
      area: "Phường Tây Hồ",
      address: "28 Xuân Diệu, Tây Hồ",
      phone: "0920000005",
      price: "140,000 VNĐ/giờ",
      availability: "Đang chờ admin duyệt trước khi hiển thị công khai.",
      description: "Sân mới cập nhật, đang trong hàng đợi kiểm duyệt.",
      approvalStatus: ApprovalStatus.PENDING_APPROVAL,
      visibilityStatus: VisibilityStatus.ACTIVE,
      images: [imageCatalog.badminton[1]],
    },
    {
      owner: "owner.longbien@sportlife.local",
      name: "Bida Bồ Đề Corner",
      sport: "Bida",
      area: "Phường Bồ Đề",
      address: "31 Bồ Đề, Long Biên",
      phone: "0920000006",
      price: "100,000 VNĐ/giờ",
      availability: "Cần bổ sung ảnh mặt tiền và giờ mở cửa chi tiết.",
      description: "Sân mẫu dùng để test trạng thái bị từ chối trong dashboard chủ sân.",
      approvalStatus: ApprovalStatus.REJECTED,
      visibilityStatus: VisibilityStatus.ACTIVE,
      rejectionReason: "Thiếu thông tin giờ mở cửa rõ ràng và ảnh chưa đủ chất lượng.",
      images: [imageCatalog.billiards[1]],
    },
    {
      owner: "owner.hadong@sportlife.local",
      name: "Thanh Xuân Shuttle Center",
      sport: "Cầu lông",
      area: "Phường Thanh Xuân",
      address: "19 Nguyễn Trãi, Thanh Xuân",
      phone: "0920000007",
      price: "100,000 - 130,000 VNĐ/giờ",
      availability: "Khung trống nhiều nhất vào trưa và đầu giờ chiều.",
      description: "Sân cầu lông dễ đi từ tuyến metro, có gửi xe máy.",
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.HIDDEN,
      images: [imageCatalog.badminton[0]],
    },
  ];

  const createdVenues = new Map<string, { id: string; ownerId: string }>();

  for (const seed of venueSeeds) {
    const owner = input.createdOwners.get(seed.owner);
    const sport = input.sportByName.get(seed.sport);

    if (!owner || !sport) {
      throw new Error(`Missing venue relation: ${seed.name}`);
    }

    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: seed.name,
        address: seed.address,
        areaId: input.findArea(seed.area).id,
        phone: seed.phone,
        description: seed.description,
        availabilityNote: seed.availability,
        openingHours: { text: "07:00 - 22:00" },
        referencePrice: seed.price,
        contactInfo: { phone: seed.phone },
        approvalStatus: seed.approvalStatus,
        visibilityStatus: seed.visibilityStatus,
        rejectionReason: "rejectionReason" in seed ? seed.rejectionReason : null,
        viewCount: seed.approvalStatus === ApprovalStatus.APPROVED ? 42 + createdVenues.size * 9 : 0,
        contactCount: seed.approvalStatus === ApprovalStatus.APPROVED ? 5 + createdVenues.size : 0,
        sports: { create: [{ sportId: sport.id }] },
        images: {
          create: seed.images.map((image, index) => ({
            url: image.url,
            altText: image.altText,
            sortOrder: index + 1,
          })),
        },
      },
    });

    createdVenues.set(seed.name, venue);
  }

  return createdVenues;
}

async function seedMatches(input: Awaited<ReturnType<typeof seedUsers>>) {
  const matchSeeds = [
    {
      owner: "player.anh@sportlife.local",
      sport: "Cầu lông",
      area: "Phường Cầu Giấy",
      time: addDays(1, 19, 30),
      requiredPlayers: 2,
      levels: ["Mới chơi", "Trung bình"],
      address: "Cầu lông Cầu Giấy Arena, 12 Trần Thái Tông",
      description: "Đánh đôi nhẹ sau giờ làm, ưu tiên đúng giờ và vui vẻ.",
      requests: [
        ["player.binh@sportlife.local", JoinRequestStatus.APPROVED, "Mình có thể đến sau 19:15."],
        ["player.ha@sportlife.local", JoinRequestStatus.PENDING, "Mình mới chơi nhưng muốn tham gia học hỏi."],
      ],
    },
    {
      owner: "player.chi@sportlife.local",
      sport: "Pickleball",
      area: "Phường Hà Đông",
      time: addDays(2, 8),
      requiredPlayers: 3,
      levels: ["Mới chơi", "Trung bình"],
      address: "Pickleball Hà Đông Club, 8 Tô Hiệu",
      description: "Kèo buổi sáng cho người mới và trung bình, có thể đổi cặp liên tục.",
      requests: [["player.duy@sportlife.local", JoinRequestStatus.APPROVED, "Mình có bóng và có thể đến sớm khởi động."]],
    },
    {
      owner: "player.binh@sportlife.local",
      sport: "Bida",
      area: "Phường Láng",
      time: addDays(3, 20),
      requiredPlayers: 1,
      levels: ["Trung bình", "Khá giỏi"],
      address: "Bida Láng 9 Ball Club, 45 Đường Láng",
      description: "Tìm một bạn chơi 9 bi, tập trung luyện break và safety.",
      requests: [["player.khoa@sportlife.local", JoinRequestStatus.PENDING, "Mình chơi trung bình, muốn giao lưu."]],
    },
    {
      owner: "player.linh@sportlife.local",
      sport: "Pickleball",
      area: "Phường Long Biên",
      time: addDays(4, 18),
      requiredPlayers: 2,
      levels: ["Trung bình", "Khá giỏi"],
      address: "Long Biên Pickleball Yard, 5 Nguyễn Văn Cừ",
      description: "Kèo nhịp nhanh, đánh đôi đổi cặp sau mỗi set.",
      requests: [
        ["player.chi@sportlife.local", JoinRequestStatus.APPROVED, "Mình tham gia được."],
        ["player.duy@sportlife.local", JoinRequestStatus.APPROVED, "Cho mình một slot nhé."],
      ],
    },
    {
      owner: "player.trang@sportlife.local",
      sport: "Cầu lông",
      area: "Phường Hoàng Mai",
      time: addDays(5, 18, 30),
      requiredPlayers: 2,
      levels: ["Mới chơi", "Trung bình"],
      address: "Khu thể thao Linh Đàm",
      description: "Tìm thêm bạn nữ hoặc đôi nam nữ để đánh giao lưu.",
      requests: [],
    },
    {
      owner: "player.khoa@sportlife.local",
      sport: "Bida",
      area: "Phường Bồ Đề",
      time: addDays(6, 20, 30),
      requiredPlayers: 1,
      levels: ["Mới chơi", "Trung bình"],
      address: "Bida Bồ Đề Corner",
      description: "Kèo bida giải trí, không đặt nặng thắng thua.",
      requests: [["player.binh@sportlife.local", JoinRequestStatus.REJECTED, "Mình muốn ghép thử một ván."]],
    },
  ] as const;

  const createdMatches = new Map<string, { id: string; ownerId: string }>();

  for (const seed of matchSeeds) {
    const owner = input.createdPlayers.get(seed.owner);
    const sport = input.sportByName.get(seed.sport);

    if (!owner || !sport) {
      throw new Error(`Missing match relation: ${seed.description}`);
    }

    const approvedCount = seed.requests.filter(([, status]) => status === JoinRequestStatus.APPROVED).length;
    const expectedLevels = seed.levels.map((level) => input.findLevel(seed.sport, level));
    const match = await prisma.match.create({
      data: {
        ownerId: owner.id,
        sportId: sport.id,
        areaId: input.findArea(seed.area).id,
        time: seed.time,
        detailedAddress: seed.address,
        requiredPlayers: seed.requiredPlayers,
        expectedLevelId: expectedLevels[0]?.skillLevelId ?? null,
        status: approvedCount >= seed.requiredPlayers ? MatchStatus.FULL : MatchStatus.OPEN,
        description: seed.description,
        expectedLevels: {
          create: expectedLevels.map((item) => ({ skillLevelId: item.skillLevelId })),
        },
      },
    });

    for (const [requesterEmail, status, message] of seed.requests) {
      const requester = input.createdPlayers.get(requesterEmail);

      if (!requester) {
        throw new Error(`Missing requester: ${requesterEmail}`);
      }

      const joinRequest = await prisma.matchJoinRequest.create({
        data: { matchId: match.id, requesterId: requester.id, status, message },
      });

      await prisma.notification.create({
        data: {
          recipientId: owner.id,
          type: NotificationType.MATCH_JOIN_REQUESTED,
          referenceId: joinRequest.id,
        },
      });

      if (status === JoinRequestStatus.APPROVED) {
        await prisma.notification.create({
          data: {
            recipientId: requester.id,
            type: NotificationType.MATCH_JOIN_APPROVED,
            referenceId: joinRequest.id,
          },
        });
      }

      if (status === JoinRequestStatus.REJECTED) {
        await prisma.notification.create({
          data: {
            recipientId: requester.id,
            type: NotificationType.MATCH_JOIN_REJECTED,
            referenceId: joinRequest.id,
          },
        });
      }
    }

    createdMatches.set(seed.description, match);
  }

  return createdMatches;
}

async function seedCommunity(input: Awaited<ReturnType<typeof seedUsers>>) {
  const postSeeds = [
    {
      author: "player.anh@sportlife.local",
      title: "Nên chọn cầu lông loại nào cho sân trong nhà?",
      sport: "Cầu lông",
      type: CommunityPostType.ADVICE,
      area: "Phường Cầu Giấy",
      status: ContentStatus.VISIBLE,
      content: "Nhóm mình đánh đôi trong nhà 2 buổi mỗi tuần. Mọi người đang dùng loại cầu nào bền, bay ổn và giá vừa phải?",
      comments: [
        ["player.binh@sportlife.local", "Victor Gold ổn nếu nhóm đánh trung bình."],
        ["player.ha@sportlife.local", "Nếu mới chơi, mình thấy Lining A+60 dễ kiểm soát chi phí hơn."],
      ],
    },
    {
      author: "player.chi@sportlife.local",
      title: "Vợt pickleball cho lối đánh kiểm soát",
      sport: "Pickleball",
      type: CommunityPostType.ADVICE,
      area: "Phường Hà Đông",
      status: ContentStatus.VISIBLE,
      content: "Mình thích dink và kiểm soát bóng hơn là smash mạnh. Có mẫu vợt nào dễ mua ở Hà Nội không?",
      comments: [["player.duy@sportlife.local", "Bạn thử vợt 16mm, mặt carbon nhám nhẹ. Dễ kiểm soát hơn khi đánh gần kitchen."]],
    },
    {
      author: "player.binh@sportlife.local",
      title: "Ý tưởng tổ chức giải bida 9 bi mini",
      sport: "Bida",
      type: CommunityPostType.EVENT,
      area: "Phường Láng",
      status: ContentStatus.PENDING,
      content: "Mình muốn tổ chức giải nhỏ 8-12 người, không đặt nặng giải thưởng. Mọi người góp ý thể thức thi đấu giúp mình.",
      comments: [],
    },
    {
      author: "player.linh@sportlife.local",
      title: "Bài tập chân nào hữu ích cho pickleball?",
      sport: "Pickleball",
      type: CommunityPostType.DISCUSSION,
      area: "Phường Long Biên",
      status: ContentStatus.VISIBLE,
      content: "Mình muốn cải thiện split step và di chuyển ngang. Ai có bài tập đơn giản trước trận không?",
      comments: [
        ["player.chi@sportlife.local", "Shadow drill 10 phút trước trận giúp mình vào nhịp nhanh hơn."],
        ["player.anh@sportlife.local", "Một số bài footwork cầu lông áp dụng sang pickleball khá tốt."],
      ],
    },
    {
      author: "player.trang@sportlife.local",
      title: "Người mới nên thay quấn cán vợt bao lâu một lần?",
      sport: "Cầu lông",
      type: CommunityPostType.GENERAL,
      area: "Phường Hoàng Mai",
      status: ContentStatus.PENDING,
      content: "Mình chơi 2 buổi mỗi tuần, tay khá ra mồ hôi. Không biết bao lâu nên thay quấn cán để đỡ trơn?",
      comments: [],
    },
    {
      author: "player.khoa@sportlife.local",
      title: "Quán bida yên tĩnh cho người tập một mình",
      sport: "Bida",
      type: CommunityPostType.DISCUSSION,
      area: "Phường Bồ Đề",
      status: ContentStatus.VISIBLE,
      content: "Mình muốn tìm nơi tập một mình vào buổi chiều, bàn ổn và không quá ồn. Có gợi ý nào khu Long Biên không?",
      comments: [["player.binh@sportlife.local", "Bạn thử các khung trước 17:00, thường vắng và giá mềm hơn."]],
    },
  ] as const;

  for (const seed of postSeeds) {
    const author = input.createdPlayers.get(seed.author);
    const sport = input.sportByName.get(seed.sport);

    if (!author || !sport) {
      throw new Error(`Missing community relation: ${seed.title}`);
    }

    await prisma.communityPost.create({
      data: {
        authorId: author.id,
        title: seed.title,
        sportId: sport.id,
        postType: seed.type,
        areaId: input.findArea(seed.area).id,
        status: seed.status,
        content: seed.content,
        comments: {
          create: seed.comments.map(([authorEmail, content]) => {
            const commentAuthor = input.createdPlayers.get(authorEmail);

            if (!commentAuthor) {
              throw new Error(`Missing comment author: ${authorEmail}`);
            }

            return { authorId: commentAuthor.id, content };
          }),
        },
      },
    });
  }
}

async function seedVenueOperations(input: Awaited<ReturnType<typeof seedUsers>>, venues: Map<string, { id: string; ownerId: string }>) {
  const resourceSeeds = [
    {
      venue: "Cầu lông Cầu Giấy Arena",
      resources: [
        ["Sân số 1", "Sân thảm xanh gần quầy lễ tân", VenueResourceStatus.ACTIVE, 1],
        ["Sân số 2", "Sân giữa, ánh sáng mạnh", VenueResourceStatus.ACTIVE, 2],
        ["Sân số 3", "Đang thay lưới và vệ sinh đèn", VenueResourceStatus.MAINTENANCE, 3],
      ],
      rules: [
        [1, true, "17:00", "23:00", 60],
        [2, true, "17:00", "23:00", 60],
        [3, true, "17:00", "23:00", 60],
        [4, true, "17:00", "23:00", 60],
        [5, true, "17:00", "23:00", 60],
        [6, true, "06:00", "12:00", 60],
        [0, true, "06:00", "12:00", 60],
      ],
    },
    {
      venue: "Bida Láng 9 Ball Club",
      resources: [
        ["Bàn 9 bi số 1", "Bàn Hollywood mới thay nỉ", VenueResourceStatus.ACTIVE, 1],
        ["Bàn 9 bi số 2", "Góc yên tĩnh, phù hợp luyện một mình", VenueResourceStatus.ACTIVE, 2],
        ["Bàn 10 bi VIP", "Bàn riêng cạnh khu sofa", VenueResourceStatus.ACTIVE, 3],
      ],
      rules: [
        [1, true, "14:00", "23:00", 60],
        [2, true, "14:00", "23:00", 60],
        [3, true, "14:00", "23:00", 60],
        [4, true, "14:00", "23:00", 60],
        [5, true, "14:00", "23:30", 60],
        [6, true, "09:00", "23:30", 60],
        [0, true, "09:00", "22:00", 60],
      ],
    },
    {
      venue: "Pickleball Hà Đông Club",
      resources: [
        ["Court A", "Sân ngoài trời gần khu gửi xe", VenueResourceStatus.ACTIVE, 1],
        ["Court B", "Sân có mái che một phần", VenueResourceStatus.ACTIVE, 2],
        ["Court C", "Tạm khóa để sơn lại vạch sân", VenueResourceStatus.INACTIVE, 3],
      ],
      rules: [
        [1, true, "06:00", "10:00", 90],
        [2, true, "06:00", "10:00", 90],
        [3, true, "17:00", "21:30", 90],
        [4, true, "17:00", "21:30", 90],
        [5, true, "17:00", "21:30", 90],
        [6, true, "06:00", "11:00", 90],
        [0, true, "06:00", "11:00", 90],
      ],
    },
    {
      venue: "Long Biên Pickleball Yard",
      resources: [
        ["Yard 1", "Sân trung tâm, mặt sân mới", VenueResourceStatus.ACTIVE, 1],
        ["Yard 2", "Sân sát khu nghỉ", VenueResourceStatus.ACTIVE, 2],
      ],
      rules: [
        [1, true, "17:30", "21:30", 60],
        [2, true, "17:30", "21:30", 60],
        [3, true, "17:30", "21:30", 60],
        [4, true, "17:30", "21:30", 60],
        [5, true, "17:30", "21:30", 60],
        [6, true, "07:00", "11:00", 60],
        [0, false, "07:00", "11:00", 60],
      ],
    },
  ] as const;

  const resources = new Map<string, { id: string; venueId: string; name: string }>();

  for (const seed of resourceSeeds) {
    const venue = venues.get(seed.venue);

    if (!venue) {
      throw new Error(`Missing operation venue: ${seed.venue}`);
    }

    for (const [name, description, status, sortOrder] of seed.resources) {
      const resource = await prisma.venueResource.create({
        data: {
          venueId: venue.id,
          name,
          description,
          status,
          sortOrder,
        },
      });

      resources.set(`${seed.venue}/${name}`, resource);
    }

    await prisma.venueScheduleRule.createMany({
      data: seed.rules.map(([dayOfWeek, isOpen, startTime, endTime, slotDurationMinutes]) => ({
        venueId: venue.id,
        dayOfWeek,
        isOpen,
        startTime,
        endTime,
        slotDurationMinutes,
      })),
    });
  }

  const slotSeeds = [
    ["Cầu lông Cầu Giấy Arena", "Sân số 1", addDays(1, 18), 60, TimeSlotStatus.AVAILABLE, null],
    ["Cầu lông Cầu Giấy Arena", "Sân số 1", addDays(1, 19), 60, TimeSlotStatus.PENDING_CONFIRMATION, null],
    ["Cầu lông Cầu Giấy Arena", "Sân số 1", addDays(1, 20), 60, TimeSlotStatus.BOOKED, null],
    ["Cầu lông Cầu Giấy Arena", "Sân số 2", addDays(1, 19), 60, TimeSlotStatus.AVAILABLE, null],
    ["Cầu lông Cầu Giấy Arena", "Sân số 2", addDays(1, 20), 60, TimeSlotStatus.BLOCKED, "Dành cho lớp nội bộ của CLB."],
    ["Cầu lông Cầu Giấy Arena", "Sân số 2", addDays(2, 18), 60, TimeSlotStatus.AVAILABLE, null],
    ["Bida Láng 9 Ball Club", "Bàn 9 bi số 1", addDays(1, 19), 60, TimeSlotStatus.BOOKED, null],
    ["Bida Láng 9 Ball Club", "Bàn 9 bi số 1", addDays(1, 20), 60, TimeSlotStatus.AVAILABLE, null],
    ["Bida Láng 9 Ball Club", "Bàn 9 bi số 2", addDays(1, 20), 60, TimeSlotStatus.PENDING_CONFIRMATION, null],
    ["Bida Láng 9 Ball Club", "Bàn 10 bi VIP", addDays(2, 21), 60, TimeSlotStatus.AVAILABLE, null],
    ["Pickleball Hà Đông Club", "Court A", addDays(2, 7), 90, TimeSlotStatus.BOOKED, null],
    ["Pickleball Hà Đông Club", "Court A", addDays(2, 8, 30), 90, TimeSlotStatus.AVAILABLE, null],
    ["Pickleball Hà Đông Club", "Court B", addDays(2, 7), 90, TimeSlotStatus.PENDING_CONFIRMATION, null],
    ["Pickleball Hà Đông Club", "Court B", addDays(3, 18), 90, TimeSlotStatus.AVAILABLE, null],
    ["Long Biên Pickleball Yard", "Yard 1", addDays(3, 18), 60, TimeSlotStatus.AVAILABLE, null],
    ["Long Biên Pickleball Yard", "Yard 1", addDays(3, 19), 60, TimeSlotStatus.BLOCKED, "Bảo trì đèn sân."],
    ["Long Biên Pickleball Yard", "Yard 2", addDays(3, 18), 60, TimeSlotStatus.BOOKED, null],
  ] as const;

  const slots = new Map<string, { id: string; venueId: string; resourceId: string; startAt: Date; endAt: Date }>();

  for (const [venueName, resourceName, startAt, durationMinutes, status, blockReason] of slotSeeds) {
    const venue = venues.get(venueName);
    const resource = resources.get(`${venueName}/${resourceName}`);

    if (!venue || !resource) {
      throw new Error(`Missing slot relation: ${venueName}/${resourceName}`);
    }

    const slot = await prisma.venueTimeSlot.create({
      data: {
        venueId: venue.id,
        resourceId: resource.id,
        startAt,
        endAt: addMinutes(startAt, durationMinutes),
        generatedDate: dayStart(Math.round((startAt.getTime() - Date.now()) / 86_400_000)),
        status,
        blockReason,
      },
    });

    slots.set(`${venueName}/${resourceName}/${startAt.toISOString()}`, slot);
  }

  const bookingSeeds = [
    {
      venue: "Cầu lông Cầu Giấy Arena",
      resource: "Sân số 1",
      startAt: addDays(1, 19),
      player: "player.ha@sportlife.local",
      status: BookingStatus.PENDING,
      note: "Nhóm mình có 4 người, muốn xác nhận sớm để đặt cầu.",
    },
    {
      venue: "Cầu lông Cầu Giấy Arena",
      resource: "Sân số 1",
      startAt: addDays(1, 20),
      player: "player.anh@sportlife.local",
      status: BookingStatus.CONFIRMED,
      note: "Đánh đôi sau giờ làm, nếu có sân cạnh quạt thì tốt.",
    },
    {
      venue: "Bida Láng 9 Ball Club",
      resource: "Bàn 9 bi số 1",
      startAt: addDays(1, 19),
      player: "player.binh@sportlife.local",
      status: BookingStatus.CONFIRMED,
      note: "Mình đến luyện 9 bi, cần bàn yên tĩnh.",
    },
    {
      venue: "Bida Láng 9 Ball Club",
      resource: "Bàn 9 bi số 2",
      startAt: addDays(1, 20),
      player: "player.khoa@sportlife.local",
      status: BookingStatus.PENDING,
      note: "Có thể đổi sang bàn khác nếu bàn này bận.",
    },
    {
      venue: "Pickleball Hà Đông Club",
      resource: "Court A",
      startAt: addDays(2, 7),
      player: "player.chi@sportlife.local",
      status: BookingStatus.CONFIRMED,
      note: "Nhóm mới chơi, cần thuê thêm 2 vợt.",
    },
    {
      venue: "Pickleball Hà Đông Club",
      resource: "Court B",
      startAt: addDays(2, 7),
      player: "player.duy@sportlife.local",
      status: BookingStatus.PENDING,
      note: "Nếu trời mưa cho mình chuyển sang court có mái che nhé.",
    },
    {
      venue: "Long Biên Pickleball Yard",
      resource: "Yard 2",
      startAt: addDays(3, 18),
      player: "player.linh@sportlife.local",
      status: BookingStatus.CONFIRMED,
      note: "Đặt cho nhóm 4 người, cần 1 bộ bóng mới.",
    },
  ] as const;

  for (const seed of bookingSeeds) {
    const venue = venues.get(seed.venue);
    const resource = resources.get(`${seed.venue}/${seed.resource}`);
    const slot = slots.get(`${seed.venue}/${seed.resource}/${seed.startAt.toISOString()}`);
    const player = input.createdPlayers.get(seed.player);

    if (!venue || !resource || !slot || !player) {
      throw new Error(`Missing booking relation: ${seed.venue}/${seed.resource}/${seed.player}`);
    }

    const booking = await prisma.booking.create({
      data: {
        venueId: venue.id,
        resourceId: resource.id,
        slotId: slot.id,
        playerId: player.id,
        status: seed.status,
        playerNote: seed.note,
        startAt: slot.startAt,
        endAt: slot.endAt,
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: BookingStatus.PENDING,
              actorId: player.id,
              actorRole: UserRole.PLAYER,
            },
            ...(seed.status === BookingStatus.CONFIRMED
              ? [
                  {
                    fromStatus: BookingStatus.PENDING,
                    toStatus: BookingStatus.CONFIRMED,
                    actorId: venue.ownerId,
                    actorRole: UserRole.VENUE_OWNER,
                    reason: "Đã giữ sân theo yêu cầu.",
                  },
                ]
              : []),
          ],
        },
      },
    });

    await prisma.notification.create({
      data: {
        recipientId: venue.ownerId,
        type: NotificationType.BOOKING_REQUESTED,
        referenceId: booking.id,
        readAt: seed.status === BookingStatus.CONFIRMED ? new Date() : null,
      },
    });

    if (seed.status === BookingStatus.CONFIRMED) {
      await prisma.notification.create({
        data: {
          recipientId: player.id,
          type: NotificationType.BOOKING_CONFIRMED,
          referenceId: booking.id,
        },
      });
    }
  }

  const bookingChatSeeds = [
    {
      player: "player.ha@sportlife.local",
      owner: "owner.caugiay@sportlife.local",
      booking: ["Cầu lông Cầu Giấy Arena", "Sân số 1", addDays(1, 19)] as const,
      messages: [
        ["player.ha@sportlife.local", "Em vừa gửi yêu cầu đặt sân 19h mai, chủ sân kiểm tra giúp em nhé."],
        ["owner.caugiay@sportlife.local", "Mình thấy rồi, lát nữa xác nhận sau khi kiểm tra lịch lớp."],
      ],
    },
    {
      player: "player.khoa@sportlife.local",
      owner: "owner.caugiay@sportlife.local",
      booking: ["Bida Láng 9 Ball Club", "Bàn 9 bi số 2", addDays(1, 20)] as const,
      messages: [
        ["player.khoa@sportlife.local", "Nếu bàn số 2 đang đông thì cho mình bàn yên tĩnh hơn cũng được."],
        ["owner.caugiay@sportlife.local", "Ok bạn, mình sẽ ưu tiên bàn góc trong cùng."],
      ],
    },
  ] as const;

  for (const seed of bookingChatSeeds) {
    const player = input.createdPlayers.get(seed.player);
    const owner = input.createdOwners.get(seed.owner);
    const [venueName, resourceName, startAt] = seed.booking;
    const slot = slots.get(`${venueName}/${resourceName}/${startAt.toISOString()}`);

    if (!player || !owner || !slot) {
      throw new Error(`Missing booking chat relation: ${seed.player}/${seed.owner}`);
    }

    const booking = await prisma.booking.findFirst({
      where: { slotId: slot.id, playerId: player.id },
      select: { id: true },
    });

    if (!booking) {
      throw new Error(`Missing booking chat booking: ${seed.player}/${venueName}`);
    }

    const [userAId, userBId] = orderedPair(player.id, owner.id);
    const conversation = await prisma.conversation.create({
      data: {
        userAId,
        userBId,
        bookingContextId: booking.id,
      },
    });

    for (const [senderEmail, content] of seed.messages) {
      const sender = input.createdPlayers.get(senderEmail) ?? input.createdOwners.get(senderEmail);

      if (!sender) {
        throw new Error(`Missing booking chat sender: ${senderEmail}`);
      }

      const message = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          content,
          readAt: sender.id === player.id ? new Date() : null,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: message.createdAt },
      });
    }
  }
}

async function seedChat(input: Awaited<ReturnType<typeof seedUsers>>, venues: Map<string, { id: string; ownerId: string }>) {
  const chatSeeds = [
    {
      userA: "player.anh@sportlife.local",
      userB: "owner.caugiay@sportlife.local",
      venue: "Cầu lông Cầu Giấy Arena",
      messages: [
        ["player.anh@sportlife.local", "Chào chủ sân, tối nay sau 20:00 còn sân cầu lông không?"],
        ["owner.caugiay@sportlife.local", "Chào bạn, còn một sân từ 20:30 đến 22:00 nhé."],
      ],
    },
    {
      userA: "player.chi@sportlife.local",
      userB: "owner.hadong@sportlife.local",
      venue: "Pickleball Hà Đông Club",
      messages: [
        ["player.chi@sportlife.local", "Sáng Chủ nhật còn khung pickleball cho nhóm mới chơi không ạ?"],
        ["owner.hadong@sportlife.local", "Còn khung 8:00 - 9:30, bên mình có cho thuê vợt."],
      ],
    },
    {
      userA: "player.anh@sportlife.local",
      userB: "player.binh@sportlife.local",
      messages: [
        ["player.binh@sportlife.local", "Mai mình được duyệt vào kèo cầu lông rồi, bạn mang cầu hay mình mang?"],
        ["player.anh@sportlife.local", "Bạn mang giúp mình nhé, mai gặp ở sân."],
      ],
    },
  ] as const;

  for (const seed of chatSeeds) {
    const userA = input.createdPlayers.get(seed.userA) ?? input.createdOwners.get(seed.userA);
    const userB = input.createdPlayers.get(seed.userB) ?? input.createdOwners.get(seed.userB);

    if (!userA || !userB) {
      throw new Error(`Missing chat users: ${seed.userA}/${seed.userB}`);
    }

    const [userAId, userBId] = orderedPair(userA.id, userB.id);
    const conversation = await prisma.conversation.create({
      data: {
        userAId,
        userBId,
        venueContextId: "venue" in seed ? venues.get(seed.venue)?.id : null,
      },
    });

    for (const [senderEmail, content] of seed.messages) {
      const sender = input.createdPlayers.get(senderEmail) ?? input.createdOwners.get(senderEmail);

      if (!sender) {
        throw new Error(`Missing message sender: ${senderEmail}`);
      }

      const message = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          content,
          readAt: sender.id === userA.id ? new Date() : null,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: message.createdAt },
      });

      await prisma.notification.create({
        data: {
          recipientId: sender.id === userA.id ? userB.id : userA.id,
          type: NotificationType.CHAT_MESSAGE,
          referenceId: message.id,
        },
      });
    }
  }
}

async function seedAdmin(passwordHash: string) {
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@sportlife.local";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      passwordHash,
      name: "SportLife Admin",
    },
    create: {
      email: adminEmail,
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      name: "SportLife Admin",
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD ?? demoPassword, 12);

  await seedConfig();
  await seedAdmin(passwordHash);

  const userContext = await seedUsers(await bcrypt.hash(demoPassword, 12));
  const venues = await seedVenues(userContext);
  await seedMatches(userContext);
  await seedCommunity(userContext);
  await seedVenueOperations(userContext, venues);
  await seedChat(userContext, venues);

  const [areaCount, userCount, venueCount, matchCount, postCount, bookingCount, slotCount, conversationCount] = await Promise.all([
    prisma.area.count({ where: { city: "Hanoi", status: ConfigStatus.ACTIVE } }),
    prisma.user.count(),
    prisma.venue.count(),
    prisma.match.count(),
    prisma.communityPost.count(),
    prisma.booking.count(),
    prisma.venueTimeSlot.count(),
    prisma.conversation.count(),
  ]);

  console.log("Seed data ready.");
  console.log(
    `Counts: ${areaCount} active Hanoi areas, ${userCount} users, ${venueCount} venues, ${matchCount} matches, ${postCount} posts, ${bookingCount} bookings, ${slotCount} slots, ${conversationCount} conversations.`,
  );
  console.log(`Admin: ${process.env.ADMIN_SEED_EMAIL ?? "admin@sportlife.local"} / ${process.env.ADMIN_SEED_PASSWORD ?? demoPassword}`);
  console.log(`Player: ${players[0].email} / ${demoPassword}`);
  console.log(`Venue owner: ${owners[0].email} / ${demoPassword}`);
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
