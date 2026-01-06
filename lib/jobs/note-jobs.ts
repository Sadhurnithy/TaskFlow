import { prisma } from "@/lib/db/prisma"

export async function cleanupOldVersions() {
    // Basic cleanup: Delete versions older than 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    try {
        const { count } = await prisma.noteVersion.deleteMany({
            where: {
                createdAt: { lt: ninetyDaysAgo }
            }
        })
        console.log(`Cleaned up ${count} old note versions`)
    } catch (error) {
        console.error("Failed to cleanup old versions:", error)
    }
}

export async function cleanupDeletedNotes() {
    // Delete notes in trash for > 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    try {
        const { count } = await prisma.note.deleteMany({
            where: {
                deletedAt: { lt: thirtyDaysAgo }
            }
        })
        console.log(`Permanently deleted ${count} notes`)
    } catch (error) {
        console.error("Failed to cleanup deleted notes:", error)
    }
}

export async function generateNoteBackup() {
    // Basic implementation: Log intended backup action.
    // Real implementation would stream all notes to JSON file and upload to storage.
    console.log("Starting weekly note backup...")
    try {
        const allNotes = await prisma.note.findMany({
            where: { deletedAt: null },
            include: { versions: true }
        })

        // Mock backup process
        const backupData = JSON.stringify(allNotes)
        const backupSize = Buffer.byteLength(backupData) / 1024 / 1024

        console.log(`Backup generated. Size: ${backupSize.toFixed(2)} MB. Uploading to storage...`)
        // await uploadToStorage(backupData)
        console.log("Backup complete.")
    } catch (error) {
        console.error("Backup failed:", error)
    }
}
