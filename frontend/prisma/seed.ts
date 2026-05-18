import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const initialSports = ["Billiard", "Badminton", "Pickleball"];
const defaultLevels = ["Beginner", "Intermediate", "Advanced"];
const initialAreas = [
  "Ba Dinh",
  "Hoan Kiem",
  "Dong Da",
  "Hai Ba Trung",
  "Cau Giay",
  "Thanh Xuan",
];

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

  for (const areaName of initialAreas) {
    await prisma.area.upsert({
      where: {
        city_name_type: {
          city: "Hanoi",
          name: areaName,
          type: "district-placeholder",
        },
      },
      update: { status: "ACTIVE" },
      create: {
        city: "Hanoi",
        name: areaName,
        type: "district-placeholder",
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
