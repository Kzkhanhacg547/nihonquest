import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { requestOtp, verifyAndConsumeOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

describe("OTP Service Unit Tests", () => {
  const testEmail = "test_otp_flow@nihonquest.local";

  beforeAll(() => {
    // When running unit tests without a live PostgreSQL instance (DATABASE_URL unset),
    // install a faithful in-memory adapter on prisma.verificationToken so OTP generation,
    // consumption, isolation, and brute-force lockout can be tested deterministically.
    if (!process.env.DATABASE_URL) {
      type TokenRow = { identifier: string; token: string; expires: Date };
      const store: TokenRow[] = [];

      (prisma as unknown as { verificationToken: Record<string, unknown> }).verificationToken = {
        async findFirst({ where }: { where?: { identifier?: string; token?: string } }) {
          return (
            store.find(
              (r) =>
                (where?.identifier === undefined || r.identifier === where.identifier) &&
                (where?.token === undefined || r.token === where.token),
            ) ?? null
          );
        },
        async create({ data }: { data: TokenRow }) {
          const row = { ...data, expires: new Date(data.expires) };
          store.push(row);
          return row;
        },
        async deleteMany({
          where,
        }: {
          where?: { identifier?: string | { contains?: string } };
        }) {
          let count = 0;
          for (let i = store.length - 1; i >= 0; i--) {
            const id = store[i].identifier;
            const match =
              !where?.identifier ||
              (typeof where.identifier === "string" && id === where.identifier) ||
              (typeof where.identifier === "object" &&
                where.identifier.contains !== undefined &&
                id.includes(where.identifier.contains));
            if (match) {
              store.splice(i, 1);
              count++;
            }
          }
          return { count };
        },
      };
    }
  });

  beforeEach(async () => {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          contains: testEmail,
        },
      },
    });
  });

  it("generates and verifies OTP code correctly", async () => {
    const res = await requestOtp(testEmail, "REGISTER");
    expect(res.success).toBe(true);
    expect(res.devCode).toBeDefined();

    const code = res.devCode!;
    expect(code).toHaveLength(6);

    // Verify invalid code
    const invalidRes = await verifyAndConsumeOtp(testEmail, "REGISTER", "000000");
    expect(invalidRes.valid).toBe(false);

    // Verify valid code
    const validRes = await verifyAndConsumeOtp(testEmail, "REGISTER", code);
    expect(validRes.valid).toBe(true);

    // Verify consumed code cannot be reused
    const reusedRes = await verifyAndConsumeOtp(testEmail, "REGISTER", code);
    expect(reusedRes.valid).toBe(false);
  });

  it("handles forgot-password OTP isolation", async () => {
    const res = await requestOtp(testEmail, "RESET_PASSWORD");
    expect(res.success).toBe(true);
    const code = res.devCode!;

    // Cannot verify with wrong type
    const wrongType = await verifyAndConsumeOtp(testEmail, "REGISTER", code);
    expect(wrongType.valid).toBe(false);

    // Can verify with right type
    const rightType = await verifyAndConsumeOtp(testEmail, "RESET_PASSWORD", code);
    expect(rightType.valid).toBe(true);
  });

  it("locks out after repeated wrong OTP guesses", async () => {
    const res = await requestOtp(testEmail, "REGISTER");
    expect(res.success).toBe(true);
    const code = res.devCode!;

    for (let i = 0; i < 5; i++) {
      const attempt = await verifyAndConsumeOtp(testEmail, "REGISTER", "000000");
      expect(attempt.valid).toBe(false);
    }

    // 6th attempt even with the right code should be locked out
    const lockedAttempt = await verifyAndConsumeOtp(testEmail, "REGISTER", code);
    expect(lockedAttempt.valid).toBe(false);
    expect(lockedAttempt.error).toContain("thử quá nhiều lần");
  });
});
