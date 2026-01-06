const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.user.count()
        const sessionCount = await prisma.session.count()
        const accountCount = await prisma.account.count()

        console.log('--- DATABASE HEALTH CHECK ---')
        console.log(`Users: ${userCount}`)
        console.log(`Accounts (OAuth connections): ${accountCount}`)
        console.log(`Sessions (Active logins): ${sessionCount}`)

        if (userCount > 0) {
            const lastUser = await prisma.user.findFirst({
                include: { accounts: true, sessions: true },
                orderBy: { createdAt: 'desc' }
            })
            console.log('\nLatset User Details:')
            console.log(`Email: ${lastUser.email}`)
            console.log(`Has Account Linked: ${lastUser.accounts.length > 0}`)
            console.log(`Active Sessions: ${lastUser.sessions.length}`)
        }
    } catch (e) {
        console.error('DATABASE ERROR:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
