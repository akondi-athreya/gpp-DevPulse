import { Redis } from "@upstash/redis";

// Simple in-memory mock for local development and testing
class MockRedis {
  private store = new Map<string, any>();
  private expires = new Map<string, number>();

  private isExpired(key: string): boolean {
    const expireTime = this.expires.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.store.delete(key);
      this.expires.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<any> {
    if (this.isExpired(key)) return null;
    const val = this.store.get(key);
    return val === undefined ? null : val;
  }

  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<string> {
    this.store.set(key, value);
    if (options?.ex) {
      this.expires.set(key, Date.now() + options.ex * 1000);
    } else if (options?.px) {
      this.expires.set(key, Date.now() + options.px);
    }
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        this.expires.delete(key);
        count++;
      }
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const results: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.store.keys()) {
      if (!this.isExpired(key) && regex.test(key)) {
        results.push(key);
      }
    }
    return results;
  }

  async incr(key: string): Promise<number> {
    if (this.isExpired(key)) {
      this.store.delete(key);
    }
    const val = Number(this.store.get(key) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.store.has(key)) {
      this.expires.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  pipeline() {
    const queue: Array<() => any> = [];
    const pipelineObj = {
      zremrangebyscore: (key: string, min: number, max: number) => {
        queue.push(() => {
          if (this.isExpired(key)) return 0;
          const set = this.store.get(key) as Array<{ score: number; member: string }> || [];
          const initialLen = set.length;
          const filtered = set.filter(x => x.score < min || x.score > max);
          this.store.set(key, filtered);
          return initialLen - filtered.length;
        });
        return pipelineObj;
      },
      zadd: (key: string, ...args: any[]) => {
        queue.push(() => {
          if (this.isExpired(key)) {
            this.store.delete(key);
          }
          let score = 0;
          let member = "";
          if (args.length === 1 && typeof args[0] === "object") {
            score = args[0].score;
            member = args[0].member;
          } else if (args.length >= 2) {
            score = args[0];
            member = args[1];
          }
          const set = this.store.get(key) as Array<{ score: number; member: string }> || [];
          set.push({ score, member });
          this.store.set(key, set);
          return 1;
        });
        return pipelineObj;
      },
      zrange: (key: string, start: number, stop: number, options?: any) => {
        queue.push(() => {
          if (this.isExpired(key)) return [];
          const set = this.store.get(key) as Array<{ score: number; member: string }> || [];
          // Sort by score
          const sorted = [...set].sort((a, b) => a.score - b.score);
          const range = sorted.slice(start, stop === -1 ? undefined : stop + 1);
          if (options?.withScores) {
            return range; // returns Array<{ score, member }>
          }
          return range.map(x => x.member);
        });
        return pipelineObj;
      },
      zcard: (key: string) => {
        queue.push(() => {
          if (this.isExpired(key)) return 0;
          const set = this.store.get(key) as Array<{ score: number; member: string }> || [];
          return set.length;
        });
        return pipelineObj;
      },
      expire: (key: string, seconds: number) => {
        queue.push(() => {
          if (this.store.has(key)) {
            this.expires.set(key, Date.now() + seconds * 1000);
            return 1;
          }
          return 0;
        });
        return pipelineObj;
      },
      exec: async () => {
        const results = [];
        for (const fn of queue) {
          results.push(fn());
        }
        return results;
      }
    };
    return pipelineObj;
  }
}

const useMock = !process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL === "";

export const redis = useMock
  ? (new MockRedis() as unknown as Redis)
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
