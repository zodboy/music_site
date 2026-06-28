import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const exist = await prisma.user.findUnique({ where: { username } });
  if (exist) {
    console.log(`[seed] 用户 ${username} 已存在，跳过`);
    return;
  }
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "admin",
    },
  });
  console.log(`[seed] 创建管理员 ${user.username} (id=${user.id})`);
}

main()
  .catch((e) => {
    console.error("[seed] 失败:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
