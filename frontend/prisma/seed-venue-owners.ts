/**
 * seed-venue-owners.ts
 *
 * Tạo 25 tài khoản Venue Owner đã xác minh email nhưng chưa onboard
 * (chưa có VenueOwnerProfile). Mỗi tài khoản sẽ được giao cho chủ sân
 * thực tế bên ngoài.
 *
 * Chạy một lần:
 *   npx tsx prisma/seed-venue-owners.ts
 *
 * Hoặc trên production qua Cloud Build:
 *   gcloud builds submit --config=cloudbuild.seed-owners.yaml
 *
 * Business rules đảm bảo:
 * - role: VENUE_OWNER
 * - emailVerified: đã set (đăng nhập được ngay)
 * - status: ACTIVE
 * - KHÔNG có VenueOwnerProfile → app sẽ redirect đến trang onboard khi đăng nhập
 * - Dùng upsert → chạy lại an toàn, không tạo trùng
 *
 * Mật khẩu mặc định: SportLife2024! (chủ sân cần đổi sau khi nhận tài khoản)
 */

import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mật khẩu tạm thời — chủ sân nên đổi ngay sau khi đăng nhập lần đầu
const TEMP_PASSWORD = process.env.OWNER_SEED_PASSWORD ?? "SportLife2024!";

// 25 tài khoản chủ sân — email dùng domain sportlife.io.vn cho chuyên nghiệp
const venueOwnerAccounts = [
  { email: "owner01@sportlife.io.vn", name: "Chủ sân 01" },
  { email: "owner02@sportlife.io.vn", name: "Chủ sân 02" },
  { email: "owner03@sportlife.io.vn", name: "Chủ sân 03" },
  { email: "owner04@sportlife.io.vn", name: "Chủ sân 04" },
  { email: "owner05@sportlife.io.vn", name: "Chủ sân 05" },
  { email: "owner06@sportlife.io.vn", name: "Chủ sân 06" },
  { email: "owner07@sportlife.io.vn", name: "Chủ sân 07" },
  { email: "owner08@sportlife.io.vn", name: "Chủ sân 08" },
  { email: "owner09@sportlife.io.vn", name: "Chủ sân 09" },
  { email: "owner10@sportlife.io.vn", name: "Chủ sân 10" },
  { email: "owner11@sportlife.io.vn", name: "Chủ sân 11" },
  { email: "owner12@sportlife.io.vn", name: "Chủ sân 12" },
  { email: "owner13@sportlife.io.vn", name: "Chủ sân 13" },
  { email: "owner14@sportlife.io.vn", name: "Chủ sân 14" },
  { email: "owner15@sportlife.io.vn", name: "Chủ sân 15" },
  { email: "owner16@sportlife.io.vn", name: "Chủ sân 16" },
  { email: "owner17@sportlife.io.vn", name: "Chủ sân 17" },
  { email: "owner18@sportlife.io.vn", name: "Chủ sân 18" },
  { email: "owner19@sportlife.io.vn", name: "Chủ sân 19" },
  { email: "owner20@sportlife.io.vn", name: "Chủ sân 20" },
  { email: "owner21@sportlife.io.vn", name: "Chủ sân 21" },
  { email: "owner22@sportlife.io.vn", name: "Chủ sân 22" },
  { email: "owner23@sportlife.io.vn", name: "Chủ sân 23" },
  { email: "owner24@sportlife.io.vn", name: "Chủ sân 24" },
  { email: "owner25@sportlife.io.vn", name: "Chủ sân 25" },
] as const;

async function main() {
  console.log("🔐 Hashing password...");
  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);

  console.log(`📋 Tạo ${venueOwnerAccounts.length} tài khoản chủ sân chưa onboard...`);

  let created = 0;
  let skipped = 0;

  for (const account of venueOwnerAccounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true, venueOwnerProfile: { select: { id: true } } },
    });

    if (existing) {
      // Tài khoản đã tồn tại — không ghi đè để tránh mất data onboard
      console.log(`  ⏩ ${account.email} đã tồn tại, bỏ qua.`);
      skipped++;
      continue;
    }

    await prisma.user.create({
      data: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: UserRole.VENUE_OWNER,
        status: UserStatus.ACTIVE,
        // emailVerified set = đã xác minh, đăng nhập được ngay
        // App sẽ redirect đến /venue-owner/profile để onboard
        emailVerified: new Date(),
        // KHÔNG tạo venueOwnerProfile → đây là điểm mấu chốt
      },
    });

    console.log(`  ✅ ${account.email}`);
    created++;
  }

  console.log(`\n✨ Xong! Đã tạo: ${created}, Bỏ qua (đã có): ${skipped}`);
  console.log(`\n📌 Thông tin tài khoản:`);
  console.log(`   Mật khẩu tạm: ${TEMP_PASSWORD}`);
  console.log(`   → Chủ sân cần đổi mật khẩu sau khi đăng nhập lần đầu`);
  console.log(`   → Sau khi đăng nhập app sẽ redirect đến trang hoàn thiện hồ sơ`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
