import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlatformConfig() {
  try {
    console.log('Seeding platform fee configuration...')
    
    const platformConfig = await prisma.platformFeeConfig.upsert({
      where: { name: 'Default Platform Fees' },
      update: {
        individualMonthlyFee: 15.45,
        schoolYearlyFee: 974.80,
        vatRate: 0.23,
        currency: 'PLN',
        trialPeriodDays: 90,
        isActive: true,
      },
      create: {
        name: 'Default Platform Fees',
        description: 'Default configuration for platform access fees for teachers',
        individualMonthlyFee: 15.45,
        schoolYearlyFee: 974.80,
        vatRate: 0.23,
        currency: 'PLN',
        trialPeriodDays: 90,
        isActive: true,
      },
    })

    console.log('Platform fee configuration seeded:', platformConfig)
  } catch (error) {
    console.error('Error seeding platform config:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run only if this script is called directly
if (require.main === module) {
  seedPlatformConfig()
}

export { seedPlatformConfig }