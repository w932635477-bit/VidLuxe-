import { describe, it, expect, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock the data directory before importing the modules
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'credits-test-'));
vi.stubEnv('CREDITS_DATA_DIR', tempDir);

// Import after mocking environment
import {
  getAvailableCredits,
  spendCredits,
  processInviteReward,
  getUserCredits,
  saveUserCredits,
} from '../lib/credits/manager';
import { addTransaction } from '../lib/credits/storage';
import { INVITE_CONFIG } from '../lib/credits/types';

// Helper to generate unique test IDs
let testIdCounter = 0;
function generateTestId(): string {
  return `test_user_${Date.now()}_${++testIdCounter}`;
}

describe('Credits System', () => {
  // Clean up temp directory after all tests
  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getAvailableCredits', () => {
    it('should return 3 free credits for new user', async () => {
      const userId = generateTestId();
      const result = getAvailableCredits(userId);

      expect(result).toBeDefined();
      expect(result.free).toBe(3);
      expect(result.freeRemaining).toBe(3);
      expect(result.paid).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should calculate total credits correctly', async () => {
      const userId = generateTestId();

      // First, get the user created (which gives them 3 free credits)
      getAvailableCredits(userId);

      // Add 10 paid credits via transaction
      addTransaction(userId, {
        id: `txn_test_${Date.now()}`,
        amount: 10,
        type: 'purchase',
        description: 'Test purchase',
        createdAt: Date.now(),
      });

      const result = getAvailableCredits(userId);

      expect(result).toBeDefined();
      expect(result.paid).toBe(10);
      expect(result.free).toBe(3);
      expect(result.freeRemaining).toBe(3);
      expect(result.total).toBe(13); // 10 paid + 3 free
    });
  });

  describe('spendCredits', () => {
    it('should fail when insufficient credits', async () => {
      const userId = generateTestId();

      // New user has only 3 free credits
      const result = spendCredits({
        anonymousId: userId,
        amount: 5, // Try to spend 5 credits
        description: 'Test task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('额度不足');
      expect(result.newBalance).toBe(3); // Still has 3 credits available
    });

    it('should deduct from paid credits first', async () => {
      const userId = generateTestId();

      // Create user and add 5 paid credits
      getAvailableCredits(userId); // This creates the user

      addTransaction(userId, {
        id: `txn_test_${Date.now()}`,
        amount: 5,
        type: 'purchase',
        description: 'Test purchase',
        createdAt: Date.now(),
      });

      // User now has 5 paid + 3 free = 8 total
      const initialAvailable = getAvailableCredits(userId);
      expect(initialAvailable.total).toBe(8);
      expect(initialAvailable.paid).toBe(5);
      expect(initialAvailable.free).toBe(3);

      // Spend 3 credits - should deduct from paid credits first
      const result = spendCredits({
        anonymousId: userId,
        amount: 3,
        description: 'Test task',
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();

      // Verify balance: paid should be 2 (5-3), free should still be 3
      const afterSpend = getAvailableCredits(userId);
      expect(afterSpend.paid).toBe(2); // 5 - 3 = 2
      expect(afterSpend.free).toBe(3); // Free credits untouched
      expect(afterSpend.total).toBe(5); // 2 paid + 3 free
    });
  });

  describe('processInviteReward', () => {
    it('should give both parties 5 credits', async () => {
      const referrerId = generateTestId();
      const inviteeId = generateTestId();

      // Get initial credits
      const referrerBefore = getAvailableCredits(referrerId);
      const inviteeBefore = getAvailableCredits(inviteeId);

      expect(referrerBefore.total).toBe(3); // New user default
      expect(inviteeBefore.total).toBe(3); // New user default

      // Process invite
      const result = processInviteReward(referrerId, inviteeId);

      expect(result.success).toBe(true);

      // Check referrer got bonus
      const referrerAfter = getAvailableCredits(referrerId);
      expect(referrerAfter.paid).toBe(INVITE_CONFIG.referrerBonus); // 5 credits
      expect(referrerAfter.total).toBe(3 + INVITE_CONFIG.referrerBonus); // 3 free + 5 bonus

      // Check invitee got bonus
      const inviteeAfter = getAvailableCredits(inviteeId);
      expect(inviteeAfter.paid).toBe(INVITE_CONFIG.inviteeBonus); // 5 credits
      expect(inviteeAfter.total).toBe(3 + INVITE_CONFIG.inviteeBonus); // 3 free + 5 bonus
    });

    it('should fail when inviting self', async () => {
      const userId = generateTestId();

      const result = processInviteReward(userId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('不能邀请自己');
    });
  });
});
