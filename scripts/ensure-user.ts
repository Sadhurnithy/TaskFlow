
import { prisma } from "@/lib/db/prisma"
import 'dotenv/config'

async function main() {
    const email = "colleague@example.com"
    let user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log(`Creating user ${email}...`)
        user = await prisma.user.create({
            data: {
                email,
                name: "Colleague",
                emailVerified: new Date(),
            }
        })
        console.log("User created:", user.id)
    } else {
        console.log("User already exists:", user.id)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
