const {PrismaClient} = require("@prisma/client")

const database = new PrismaClient();

async function main() {
    try {
        await database.category.createMany({
            data: {

            }
        })
    } catch (error) {
       console.log("error seeding categories", error) 
    }finally{
        await database.$disconnect();
    }
}