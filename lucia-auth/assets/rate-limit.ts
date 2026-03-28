/**
 * Token bucket rate limiter helpers.
 * Based on Lucia Auth:
 * https://lucia-auth.com/rate-limit/token-bucket
 *
 * Use Redis or another shared atomic store in production.
 * The in-memory store below is only suitable for a single-process app.
 */

export interface TokenBucketState {
  count: number;
  refilledAtMilliseconds: number;
}

export interface TokenBucketStore<Key extends string> {
  get(key: Key): Promise<TokenBucketState | null>;
  set(key: Key, bucket: TokenBucketState, expiresInSeconds: number): Promise<void>;
}

export interface TokenBucketRateLimiterOptions {
  max: number;
  refillIntervalSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class TokenBucketRateLimiter<Key extends string> {
  private readonly max: number;
  private readonly refillIntervalSeconds: number;
  private readonly store: TokenBucketStore<Key>;

  constructor(
    store: TokenBucketStore<Key>,
    options: TokenBucketRateLimiterOptions
  ) {
    this.store = store;
    this.max = options.max;
    this.refillIntervalSeconds = options.refillIntervalSeconds;
  }

  /**
   * Consume tokens from a bucket identified by `key`.
   * For production, make sure the backing store is atomic per key.
   */
  async consume(key: Key, cost: number = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const existingBucket = await this.store.get(key);
    let bucket = existingBucket;

    if (bucket === null) {
      const remaining = Math.max(0, this.max - cost);
      bucket = {
        count: remaining,
        refilledAtMilliseconds: now,
      };
      await this.store.set(
        key,
        bucket,
        Math.max(1, (this.max - remaining) * this.refillIntervalSeconds)
      );

      return {
        allowed: cost <= this.max,
        remaining,
        retryAfterSeconds: cost <= this.max ? 0 : this.refillIntervalSeconds,
      };
    }

    const refill = Math.floor(
      (now - bucket.refilledAtMilliseconds) /
        (this.refillIntervalSeconds * 1000)
    );

    if (refill > 0) {
      bucket = {
        count: Math.min(bucket.count + refill, this.max),
        refilledAtMilliseconds:
          bucket.refilledAtMilliseconds +
          refill * this.refillIntervalSeconds * 1000,
      };
    }

    if (bucket.count < cost) {
      await this.store.set(
        key,
        bucket,
        Math.max(1, (this.max - bucket.count) * this.refillIntervalSeconds)
      );

      const missingTokens = cost - bucket.count;
      return {
        allowed: false,
        remaining: bucket.count,
        retryAfterSeconds: missingTokens * this.refillIntervalSeconds,
      };
    }

    bucket = {
      count: bucket.count - cost,
      refilledAtMilliseconds: bucket.refilledAtMilliseconds,
    };

    await this.store.set(
      key,
      bucket,
      Math.max(1, (this.max - bucket.count) * this.refillIntervalSeconds)
    );

    return {
      allowed: true,
      remaining: bucket.count,
      retryAfterSeconds: 0,
    };
  }
}

export class MemoryTokenBucketStore<Key extends string>
  implements TokenBucketStore<Key>
{
  private readonly buckets = new Map<
    Key,
    { bucket: TokenBucketState; expiresAtMilliseconds: number }
  >();

  async get(key: Key): Promise<TokenBucketState | null> {
    const value = this.buckets.get(key);
    if (!value) {
      return null;
    }

    if (Date.now() >= value.expiresAtMilliseconds) {
      this.buckets.delete(key);
      return null;
    }

    return value.bucket;
  }

  async set(
    key: Key,
    bucket: TokenBucketState,
    expiresInSeconds: number
  ): Promise<void> {
    this.buckets.set(key, {
      bucket,
      expiresAtMilliseconds: Date.now() + expiresInSeconds * 1000,
    });
  }
}
