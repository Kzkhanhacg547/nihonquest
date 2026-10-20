import { prisma } from "../lib/prisma";

async function main() {
  const usersWithLargeImage = await prisma.user.findMany({
    where: {
      OR: [
        { image: { startsWith: "data:" } },
        { image: { contains: "base64" } },
      ],
    },
    include: { profile: true },
  });

  console.log(`Found ${usersWithLargeImage.length} users with large/base64 user.image`);

  for (const u of usersWithLargeImage) {
    console.log(`Processing user: ${u.email}`);
    // If profile doesn't have avatar yet, save it to profile.avatar
    if (!u.profile?.avatar && u.image) {
      await prisma.profile.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          displayName: u.name || u.email.split("@")[0],
          avatar: u.image,
        },
        update: {
          avatar: u.image,
        },
      });
      console.log(`  Saved avatar to profile.avatar for ${u.email}`);
    }

    // Now safely clear user.image so NextAuth session JWT never includes base64
    await prisma.user.update({
      where: { id: u.id },
      data: { image: null },
    });
    console.log(`  Cleared user.image for ${u.email} (profile.avatar preserved)`);
  }

  console.log("Cleanup completed successfully.");
}

main()
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
