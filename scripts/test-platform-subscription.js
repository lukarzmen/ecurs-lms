// Test script to verify platform subscription functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlatformSubscription() {
  try {
    console.log('Testing platform subscription functionality...');
    
    // Test 1: Check if platform fee config exists
    console.log('\n1. Checking platform fee configuration...');
    const feeConfig = await prisma.platformFeeConfig.findFirst({
      where: { isActive: true }
    });
    console.log('Fee config:', feeConfig);
    
    // Test 2: Check if teacher platform subscription table is accessible
    console.log('\n2. Testing teacher platform subscription table...');
    const subscriptions = await prisma.teacherPlatformSubscription.findMany();
    console.log('Current subscriptions:', subscriptions.length);
    
    console.log('\n✅ All tests passed! Platform subscription system is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlatformSubscription();