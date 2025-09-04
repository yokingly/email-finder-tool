import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Disconnected from Redis');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Email validation specific methods
  async getEmailValidation(email: string): Promise<any | null> {
    return this.get(`email_validation:${email}`);
  }

  async setEmailValidation(email: string, validation: any, ttlSeconds = 86400): Promise<boolean> {
    return this.set(`email_validation:${email}`, validation, ttlSeconds);
  }

  async getMXRecords(domain: string): Promise<any | null> {
    return this.get(`mx_records:${domain}`);
  }

  async setMXRecords(domain: string, records: any, ttlSeconds = 3600): Promise<boolean> {
    return this.set(`mx_records:${domain}`, records, ttlSeconds);
  }

  async getLinkedInProfile(email: string): Promise<any | null> {
    return this.get(`linkedin_profile:${email}`);
  }

  async setLinkedInProfile(email: string, profile: any, ttlSeconds = 86400): Promise<boolean> {
    return this.set(`linkedin_profile:${email}`, profile, ttlSeconds);
  }

  // Rate limiting methods
  async incrementRateLimit(apiKey: string, endpoint: string, windowSeconds = 60): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const key = `rate_limit:${apiKey}:${endpoint}`;
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return current;
    } catch (error) {
      console.error('Rate limit increment error:', error);
      return 0;
    }
  }

  async getRateLimit(apiKey: string, endpoint: string): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const key = `rate_limit:${apiKey}:${endpoint}`;
      const current = await this.client.get(key);
      return current ? parseInt(current) : 0;
    } catch (error) {
      console.error('Rate limit get error:', error);
      return 0;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
