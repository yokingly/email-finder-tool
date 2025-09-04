import { z } from 'zod';

export const EmailPatternInput = z.object({
  domain: z.string().email().transform(email => email.split('@')[1]),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  companyName: z.string().optional(),
  customPatterns: z.array(z.string()).optional(),
});

export type EmailPatternInput = z.infer<typeof EmailPatternInput>;

export interface EmailPattern {
  pattern: string;
  type: 'common' | 'custom' | 'domain-specific';
  confidence: number;
  example: string;
}

export class EmailPatternService {
  private readonly commonPatterns = [
    'firstname.lastname',
    'firstname_lastname',
    'firstname-lastname',
    'firstname.lastname',
    'f.lastname',
    'firstname.l',
    'flastname',
    'firstname',
    'lastname',
    'firstname.lastname',
    'firstname_lastname',
    'firstname-lastname',
    'firstname.lastname',
    'f.lastname',
    'firstname.l',
    'flastname',
    'firstname',
    'lastname',
  ];

  private readonly domainSpecificPatterns: Record<string, string[]> = {
    'google.com': ['firstname.lastname', 'firstname', 'lastname'],
    'microsoft.com': ['firstname.lastname', 'firstname_lastname'],
    'apple.com': ['firstname.lastname', 'firstname'],
    'amazon.com': ['firstname.lastname', 'firstname_lastname'],
    'meta.com': ['firstname.lastname', 'firstname'],
    'netflix.com': ['firstname.lastname', 'firstname'],
    'spotify.com': ['firstname.lastname', 'firstname'],
    'uber.com': ['firstname.lastname', 'firstname'],
    'airbnb.com': ['firstname.lastname', 'firstname'],
    'twitter.com': ['firstname.lastname', 'firstname'],
    'linkedin.com': ['firstname.lastname', 'firstname'],
    'github.com': ['firstname.lastname', 'firstname'],
    'stackoverflow.com': ['firstname.lastname', 'firstname'],
    'reddit.com': ['firstname.lastname', 'firstname'],
    'youtube.com': ['firstname.lastname', 'firstname'],
    'instagram.com': ['firstname.lastname', 'firstname'],
    'tiktok.com': ['firstname.lastname', 'firstname'],
    'snapchat.com': ['firstname.lastname', 'firstname'],
    'discord.com': ['firstname.lastname', 'firstname'],
    'slack.com': ['firstname.lastname', 'firstname'],
    'zoom.us': ['firstname.lastname', 'firstname'],
    'salesforce.com': ['firstname.lastname', 'firstname'],
    'oracle.com': ['firstname.lastname', 'firstname'],
    'ibm.com': ['firstname.lastname', 'firstname'],
    'intel.com': ['firstname.lastname', 'firstname'],
    'nvidia.com': ['firstname.lastname', 'firstname'],
    'amd.com': ['firstname.lastname', 'firstname'],
    'cisco.com': ['firstname.lastname', 'firstname'],
    'vmware.com': ['firstname.lastname', 'firstname'],
    'adobe.com': ['firstname.lastname', 'firstname'],
    'autodesk.com': ['firstname.lastname', 'firstname'],
    'salesforce.com': ['firstname.lastname', 'firstname'],
    'workday.com': ['firstname.lastname', 'firstname'],
    'servicenow.com': ['firstname.lastname', 'firstname'],
    'splunk.com': ['firstname.lastname', 'firstname'],
    'palantir.com': ['firstname.lastname', 'firstname'],
    'databricks.com': ['firstname.lastname', 'firstname'],
    'snowflake.com': ['firstname.lastname', 'firstname'],
    'mongodb.com': ['firstname.lastname', 'firstname'],
    'redis.com': ['firstname.lastname', 'firstname'],
    'elastic.co': ['firstname.lastname', 'firstname'],
    'confluent.io': ['firstname.lastname', 'firstname'],
    'kafka.apache.org': ['firstname.lastname', 'firstname'],
    'apache.org': ['firstname.lastname', 'firstname'],
    'nginx.com': ['firstname.lastname', 'firstname'],
    'haproxy.com': ['firstname.lastname', 'firstname'],
    'varnish-cache.org': ['firstname.lastname', 'firstname'],
    'memcached.org': ['firstname.lastname', 'firstname'],
    'cassandra.apache.org': ['firstname.lastname', 'firstname'],
    'hbase.apache.org': ['firstname.lastname', 'firstname'],
    'hadoop.apache.org': ['firstname.lastname', 'firstname'],
    'spark.apache.org': ['firstname.lastname', 'firstname'],
    'flink.apache.org': ['firstname.lastname', 'firstname'],
    'storm.apache.org': ['firstname.lastname', 'firstname'],
    'kafka.apache.org': ['firstname.lastname', 'firstname'],
    'zookeeper.apache.org': ['firstname.lastname', 'firstname'],
    'mesos.apache.org': ['firstname.lastname', 'firstname'],
    'kubernetes.io': ['firstname.lastname', 'firstname'],
    'docker.com': ['firstname.lastname', 'firstname'],
    'rancher.com': ['firstname.lastname', 'firstname'],
    'consul.io': ['firstname.lastname', 'firstname'],
    'vault.hashicorp.com': ['firstname.lastname', 'firstname'],
    'terraform.io': ['firstname.lastname', 'firstname'],
    'packer.io': ['firstname.lastname', 'firstname'],
    'vagrantup.com': ['firstname.lastname', 'firstname'],
    'ansible.com': ['firstname.lastname', 'firstname'],
    'chef.io': ['firstname.lastname', 'firstname'],
    'puppet.com': ['firstname.lastname', 'firstname'],
    'saltstack.com': ['firstname.lastname', 'firstname'],
    'jenkins.io': ['firstname.lastname', 'firstname'],
    'gitlab.com': ['firstname.lastname', 'firstname'],
    'bitbucket.org': ['firstname.lastname', 'firstname'],
    'atlassian.com': ['firstname.lastname', 'firstname'],
    'jira.com': ['firstname.lastname', 'firstname'],
    'confluence.com': ['firstname.lastname', 'firstname'],
    'trello.com': ['firstname.lastname', 'firstname'],
    'asana.com': ['firstname.lastname', 'firstname'],
    'monday.com': ['firstname.lastname', 'firstname'],
    'notion.so': ['firstname.lastname', 'firstname'],
    'airtable.com': ['firstname.lastname', 'firstname'],
    'smartsheet.com': ['firstname.lastname', 'firstname'],
    'wrike.com': ['firstname.lastname', 'firstname'],
    'clickup.com': ['firstname.lastname', 'firstname'],
    'basecamp.com': ['firstname.lastname', 'firstname'],
    'teamwork.com': ['firstname.lastname', 'firstname'],
    'podio.com': ['firstname.lastname', 'firstname'],
    'monday.com': ['firstname.lastname', 'firstname'],
    'notion.so': ['firstname.lastname', 'firstname'],
    'airtable.com': ['firstname.lastname', 'firstname'],
    'smartsheet.com': ['firstname.lastname', 'firstname'],
    'wrike.com': ['firstname.lastname', 'firstname'],
    'clickup.com': ['firstname.lastname', 'firstname'],
    'basecamp.com': ['firstname.lastname', 'firstname'],
    'teamwork.com': ['firstname.lastname', 'firstname'],
    'podio.com': ['firstname.lastname', 'firstname'],
  };

  generatePatterns(input: EmailPatternInput): EmailPattern[] {
    const { domain, firstName, lastName, companyName, customPatterns } = input;
    const patterns: EmailPattern[] = [];

    // Normalize names
    const first = firstName.toLowerCase().trim();
    const last = lastName.toLowerCase().trim();
    const firstInitial = first.charAt(0);
    const lastInitial = last.charAt(0);

    // Common patterns
    this.commonPatterns.forEach(pattern => {
      const email = this.buildEmail(pattern, { first, last, firstInitial, lastInitial }, domain);
      patterns.push({
        pattern,
        type: 'common',
        confidence: this.calculateConfidence(pattern, 'common'),
        example: email,
      });
    });

    // Domain-specific patterns
    const domainPatterns = this.domainSpecificPatterns[domain] || [];
    domainPatterns.forEach(pattern => {
      const email = this.buildEmail(pattern, { first, last, firstInitial, lastInitial }, domain);
      patterns.push({
        pattern,
        type: 'domain-specific',
        confidence: this.calculateConfidence(pattern, 'domain-specific'),
        example: email,
      });
    });

    // Custom patterns
    if (customPatterns) {
      customPatterns.forEach(pattern => {
        const email = this.buildEmail(pattern, { first, last, firstInitial, lastInitial }, domain);
        patterns.push({
          pattern,
          type: 'custom',
          confidence: this.calculateConfidence(pattern, 'custom'),
          example: email,
        });
      });
    }

    // Company-specific patterns
    if (companyName) {
      const company = companyName.toLowerCase().trim();
      const companyPatterns = [
        `${first}.${last}`,
        `${first}_${last}`,
        `${first}-${last}`,
        `${firstInitial}.${last}`,
        `${first}.${lastInitial}`,
        `${firstInitial}${last}`,
        `${first}${last}`,
      ];

      companyPatterns.forEach(pattern => {
        const email = this.buildEmail(pattern, { first, last, firstInitial, lastInitial }, domain);
        patterns.push({
          pattern,
          type: 'domain-specific',
          confidence: this.calculateConfidence(pattern, 'domain-specific') + 10,
          example: email,
        });
      });
    }

    // Remove duplicates and sort by confidence
    const uniquePatterns = patterns.filter((pattern, index, self) => 
      index === self.findIndex(p => p.example === pattern.example)
    );

    return uniquePatterns.sort((a, b) => b.confidence - a.confidence);
  }

  private buildEmail(pattern: string, names: { first: string; last: string; firstInitial: string; lastInitial: string }, domain: string): string {
    let email = pattern
      .replace(/firstname/g, names.first)
      .replace(/lastname/g, names.last)
      .replace(/f\./g, names.firstInitial + '.')
      .replace(/l\./g, names.lastInitial + '.')
      .replace(/f/g, names.firstInitial)
      .replace(/l/g, names.lastInitial);

    return `${email}@${domain}`;
  }

  private calculateConfidence(pattern: string, type: 'common' | 'custom' | 'domain-specific'): number {
    let confidence = 50; // Base confidence

    // Adjust based on pattern type
    switch (type) {
      case 'common':
        confidence += 20;
        break;
      case 'domain-specific':
        confidence += 30;
        break;
      case 'custom':
        confidence += 10;
        break;
    }

    // Adjust based on pattern complexity
    if (pattern.includes('.')) confidence += 10;
    if (pattern.includes('_')) confidence += 5;
    if (pattern.includes('-')) confidence += 5;
    if (pattern.length > 10) confidence += 5;

    return Math.min(confidence, 100);
  }
}
