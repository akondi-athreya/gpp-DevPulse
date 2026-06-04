import { redis } from "./redis";

export async function checkRateLimit(
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${ip}:${endpoint}`;
  const now = Date.now();
  const clearBefore = now - 60000;
  const member = `${now}-${Math.random()}`;

  try {
    const p = redis.pipeline();
    p.zremrangebyscore(key, 0, clearBefore);
    p.zadd(key, { score: now, member });
    p.zrange(key, 0, 0, { withScores: true });
    p.zcard(key);
    p.expire(key, 60);

    const results = await p.exec();
    
    // Results from pipeline match the order of commands:
    // results[0] -> zremrangebyscore
    // results[1] -> zadd
    // results[2] -> zrange (oldest element)
    // results[3] -> zcard (count)
    // results[4] -> expire
    const oldestElement = results[2] as any[];
    const count = results[3] as number;

    const allowed = count <= 100;
    const remaining = Math.max(0, 100 - count);

    let score = now;
    if (oldestElement && oldestElement.length > 0) {
      const first = oldestElement[0];
      if (typeof first === "object" && first !== null && "score" in first) {
        score = first.score;
      } else if (oldestElement.length > 1) {
        const val = oldestElement[1];
        score = typeof val === "number" ? val : Number(val) || now;
      } else {
        score = typeof first === "number" ? first : Number(first) || now;
      }
    }
    const resetAt = score + 60000;

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: 99,
      resetAt: now + 60000,
    };
  }
}
