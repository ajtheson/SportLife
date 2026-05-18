import { PrismaClient, UserRole } from "@prisma/client";
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
