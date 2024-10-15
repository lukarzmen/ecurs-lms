const { PrismaClient } = require("@prisma/client");

async function main() {
  const db = new PrismaClient();
  try {
    await db.$connect();
    await db.category?.createMany({
      data: [
        {
          name: "Development",
        },
        {
          name: "Design",
        },
        {
          name: "Business",
        },
        {
          name: "Marketing",
        },
      ],
    });
    console.log("Categories seeded successfully");
  } catch (error) {
    console.log("error seeding categories", error);
  } finally {
    await db.$disconnect();
  }
}

main();
