import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

export const LinkedInVerificationInput = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
});

export type LinkedInVerificationInput = z.infer<typeof LinkedInVerificationInput>;

export interface LinkedInProfile {
  profileUrl?: string;
  position?: string;
  company?: string;
  verified: boolean;
  confidence: number;
  errors?: string[];
}

export class LinkedInVerificationService {
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.rapidApiKey = process.env['RAPIDAPI_KEY'] || '';
    this.rapidApiHost = 'linkedin-profile-data.p.rapidapi.com';
    
    this.httpClient = axios.create({
      baseURL: 'https://linkedin-profile-data.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': this.rapidApiHost,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async verifyProfile(input: LinkedInVerificationInput): Promise<LinkedInProfile> {
    const { email, firstName, lastName, company } = input;
    const errors: string[] = [];

    try {
      // First, try to find the profile by email
      const profileByEmail = await this.searchByEmail(email);
      
      if (profileByEmail.verified) {
        return profileByEmail;
      }

      // If not found by email, try searching by name and company
      if (firstName && lastName && company) {
        const profileByName = await this.searchByNameAndCompany(firstName, lastName, company);
        
        if (profileByName.verified) {
          // Cross-reference with email domain
          const emailDomain = email.split('@')[1];
          const companyDomain = this.extractDomainFromCompany(company);
          
          if (emailDomain === companyDomain) {
            profileByName.confidence += 20;
          }
          
          return profileByName;
        }
      }

      return {
        verified: false,
        confidence: 0,
        errors: ['Profile not found on LinkedIn'],
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        verified: false,
        confidence: 0,
        errors,
      };
    }
  }

  private async searchByEmail(email: string): Promise<LinkedInProfile> {
    try {
      const response = await this.httpClient.post('/search-by-email', {
        email,
      });

      if (response.data && response.data.profile) {
        const profile = response.data.profile;
        return {
          profileUrl: profile.profileUrl,
          position: profile.position,
          company: profile.company,
          verified: true,
          confidence: 85,
        };
      }

      return {
        verified: false,
        confidence: 0,
        errors: ['No profile found for this email'],
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            verified: false,
            confidence: 0,
            errors: ['Profile not found'],
          };
        }
        throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private async searchByNameAndCompany(firstName: string, lastName: string, company: string): Promise<LinkedInProfile> {
    try {
      const response = await this.httpClient.post('/search-by-name-company', {
        firstName,
        lastName,
        company,
      });

      if (response.data && response.data.profiles && response.data.profiles.length > 0) {
        const profile = response.data.profiles[0]; // Take the first match
        return {
          profileUrl: profile.profileUrl,
          position: profile.position,
          company: profile.company,
          verified: true,
          confidence: 70,
        };
      }

      return {
        verified: false,
        confidence: 0,
        errors: ['No profile found for this name and company combination'],
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            verified: false,
            confidence: 0,
            errors: ['Profile not found'],
          };
        }
        throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private extractDomainFromCompany(company: string): string {
    // Simple domain extraction - in a real implementation, you might want to use
    // a more sophisticated approach or maintain a mapping of companies to domains
    const companyLower = company.toLowerCase();
    
    // Common company domain mappings
    const companyDomainMap: Record<string, string> = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com',
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'uber': 'uber.com',
      'airbnb': 'airbnb.com',
      'twitter': 'twitter.com',
      'linkedin': 'linkedin.com',
      'github': 'github.com',
      'stackoverflow': 'stackoverflow.com',
      'reddit': 'reddit.com',
      'youtube': 'youtube.com',
      'instagram': 'instagram.com',
      'tiktok': 'tiktok.com',
      'snapchat': 'snapchat.com',
      'discord': 'discord.com',
      'slack': 'slack.com',
      'zoom': 'zoom.us',
      'salesforce': 'salesforce.com',
      'oracle': 'oracle.com',
      'ibm': 'ibm.com',
      'intel': 'intel.com',
      'nvidia': 'nvidia.com',
      'amd': 'amd.com',
      'cisco': 'cisco.com',
      'vmware': 'vmware.com',
      'adobe': 'adobe.com',
      'autodesk': 'autodesk.com',
      'workday': 'workday.com',
      'servicenow': 'servicenow.com',
      'splunk': 'splunk.com',
      'palantir': 'palantir.com',
      'databricks': 'databricks.com',
      'snowflake': 'snowflake.com',
      'mongodb': 'mongodb.com',
      'redis': 'redis.com',
      'elastic': 'elastic.co',
      'confluent': 'confluent.io',
      'apache': 'apache.org',
      'nginx': 'nginx.com',
      'haproxy': 'haproxy.com',
      'varnish': 'varnish-cache.org',
      'memcached': 'memcached.org',
      'cassandra': 'cassandra.apache.org',
      'hbase': 'hbase.apache.org',
      'hadoop': 'hadoop.apache.org',
      'spark': 'spark.apache.org',
      'flink': 'flink.apache.org',
      'storm': 'storm.apache.org',
      'kafka': 'kafka.apache.org',
      'zookeeper': 'zookeeper.apache.org',
      'mesos': 'mesos.apache.org',
      'kubernetes': 'kubernetes.io',
      'docker': 'docker.com',
      'rancher': 'rancher.com',
      'consul': 'consul.io',
      'vault': 'vault.hashicorp.com',
      'terraform': 'terraform.io',
      'packer': 'packer.io',
      'vagrant': 'vagrantup.com',
      'ansible': 'ansible.com',
      'chef': 'chef.io',
      'puppet': 'puppet.com',
      'saltstack': 'saltstack.com',
      'jenkins': 'jenkins.io',
      'gitlab': 'gitlab.com',
      'bitbucket': 'bitbucket.org',
      'atlassian': 'atlassian.com',
      'jira': 'atlassian.com',
      'confluence': 'atlassian.com',
      'trello': 'atlassian.com',
      'asana': 'asana.com',
      'monday': 'monday.com',
      'notion': 'notion.so',
      'airtable': 'airtable.com',
      'smartsheet': 'smartsheet.com',
      'wrike': 'wrike.com',
      'clickup': 'clickup.com',
      'basecamp': 'basecamp.com',
      'teamwork': 'teamwork.com',
      'podio': 'podio.com',
    };

    // Check for exact matches first
    for (const [companyName, domain] of Object.entries(companyDomainMap)) {
      if (companyLower.includes(companyName)) {
        return domain;
      }
    }

    // If no exact match, try to construct a domain from the company name
    const cleanCompany = companyLower
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20); // Limit length

    return `${cleanCompany}.com`;
  }
}
