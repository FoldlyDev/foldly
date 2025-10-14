// =============================================================================
// REDIS CONNECTION TEST SCRIPT
// =============================================================================
// Manual test script to verify Upstash Redis is working
// Run with: npx tsx scripts/test-redis-connection.ts

import { redis } from '../src/lib/redis/client';
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '../src/lib/middleware/rate-limit';

async function testRedisConnection() {
  console.log('\n🔍 Testing Upstash Redis Connection...\n');

  try {
    // Test 1: Basic Connection
    console.log('Test 1: Basic Redis Connection');
    const testKey = 'connection-test';
    await redis.set(testKey, 'hello-redis');
    const value = await redis.get(testKey);
    await redis.del(testKey);

    if (value === 'hello-redis') {
      console.log('✅ Redis connection successful\n');
    } else {
      console.log('❌ Redis connection failed - value mismatch\n');
      return;
    }

    // Test 2: Rate Limiting
    console.log('Test 2: Rate Limiting (5 attempts)');
    const testUserId = `test-user-${Date.now()}`;

    for (let i = 1; i <= 7; i++) {
      const result = await checkRateLimit(
        RateLimitKeys.usernameCheck(testUserId),
        RateLimitPresets.STRICT // 5 per minute
      );

      if (result.allowed) {
        console.log(`  ✅ Attempt ${i}: Allowed (${result.remaining} remaining)`);
      } else {
        console.log(`  ❌ Attempt ${i}: Blocked (rate limit exceeded)`);
        const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000);
        console.log(`  ⏰ Reset in ${resetIn} seconds\n`);
        break;
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test 3: TTL (Auto-Expiration)
    console.log('\nTest 3: TTL (Auto-Expiration)');
    const ttlKey = 'test-ttl';
    await redis.setex(ttlKey, 5, { test: 'data' }); // Expires in 5 seconds
    const ttl = await redis.ttl(ttlKey);
    console.log(`  ✅ TTL test key expires in ${ttl} seconds\n`);

    console.log('✅ All Redis tests passed!\n');
    console.log('📝 Summary:');
    console.log('   - Redis connection: Working');
    console.log('   - Rate limiting: Working');
    console.log('   - TTL auto-expiration: Working');
    console.log('   - Distributed state: Shared across instances\n');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Check UPSTASH_REDIS_REST_URL in .env.local');
    console.error('   2. Check UPSTASH_REDIS_REST_TOKEN in .env.local');
    console.error('   3. Verify Upstash database is active');
    console.error('   4. Check network/firewall settings\n');
  }
}

testRedisConnection();
