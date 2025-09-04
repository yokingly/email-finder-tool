import { createConnection } from 'net';
import { resolveMx } from 'dns/promises';
import { z } from 'zod';

export const EmailValidationInput = z.object({
  email: z.string().email(),
  validateSmtp: z.boolean().default(true),
  checkCatchAll: z.boolean().default(true),
  timeout: z.number().default(5000),
});

export type EmailValidationInput = z.infer<typeof EmailValidationInput>;

export interface MXRecord {
  exchange: string;
  priority: number;
  provider?: string | undefined;
}

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isCatchAll: boolean;
  mxRecords: MXRecord[];
  mxProvider?: string | undefined;
  smtpResponse?: string | undefined;
  validationMethod: 'smtp' | 'mx-only' | 'format-only';
  confidence: number;
  errors?: string[] | undefined;
}

export class EmailValidationService {
  private readonly mxProviders: Record<string, string> = {
    'aspmx.l.google.com': 'Google Workspace',
    'alt1.aspmx.l.google.com': 'Google Workspace',
    'alt2.aspmx.l.google.com': 'Google Workspace',
    'alt3.aspmx.l.google.com': 'Google Workspace',
    'alt4.aspmx.l.google.com': 'Google Workspace',
    'outlook.com': 'Microsoft 365',
    'outlook.office365.com': 'Microsoft 365',
    'mail.protection.outlook.com': 'Microsoft 365',
    'zoho.com': 'Zoho',
    'zoho.eu': 'Zoho',
    'zoho.in': 'Zoho',
    'zoho.com.au': 'Zoho',
    'zoho.com.cn': 'Zoho',
    'zoho.com.jp': 'Zoho',
    'zoho.com.sg': 'Zoho',
    'zoho.com.my': 'Zoho',
    'zoho.com.ph': 'Zoho',
    'zoho.com.tw': 'Zoho',
    'zoho.com.hk': 'Zoho',
    'zoho.com.kr': 'Zoho',
    'zoho.com.th': 'Zoho',
    'zoho.com.vn': 'Zoho',
    'zoho.com.id': 'Zoho',
    'zoho.com.bd': 'Zoho',
    'zoho.com.lk': 'Zoho',
    'zoho.com.np': 'Zoho',
    'zoho.com.pk': 'Zoho',
    'zoho.com.af': 'Zoho',
    'zoho.com.ir': 'Zoho',
    'zoho.com.iq': 'Zoho',
    'zoho.com.sa': 'Zoho',
    'zoho.com.ae': 'Zoho',
    'zoho.com.eg': 'Zoho',
    'zoho.com.ma': 'Zoho',
    'zoho.com.tn': 'Zoho',
    'zoho.com.dz': 'Zoho',
    'zoho.com.ly': 'Zoho',
    'zoho.com.sd': 'Zoho',
    'zoho.com.et': 'Zoho',
    'zoho.com.ke': 'Zoho',
    'zoho.com.ug': 'Zoho',
    'zoho.com.tz': 'Zoho',
    'zoho.com.rw': 'Zoho',
    'zoho.com.bi': 'Zoho',
    'zoho.com.mg': 'Zoho',
    'zoho.com.mu': 'Zoho',
    'zoho.com.sc': 'Zoho',
    'zoho.com.km': 'Zoho',
    'zoho.com.dj': 'Zoho',
    'zoho.com.so': 'Zoho',
    'zoho.com.er': 'Zoho',
    'zoho.com.ss': 'Zoho',
    'zoho.com.cf': 'Zoho',
    'zoho.com.td': 'Zoho',
    'zoho.com.cm': 'Zoho',
    'zoho.com.ga': 'Zoho',
    'zoho.com.cg': 'Zoho',
    'zoho.com.cd': 'Zoho',
    'zoho.com.ao': 'Zoho',
    'zoho.com.zm': 'Zoho',
    'zoho.com.zw': 'Zoho',
    'zoho.com.bw': 'Zoho',
    'zoho.com.na': 'Zoho',
    'zoho.com.sz': 'Zoho',
    'zoho.com.ls': 'Zoho',
    'zoho.com.mz': 'Zoho',
    'amazonaws.com': 'AWS SES',
    'mimecast.com': 'Mimecast',
    'mimecast.net': 'Mimecast',
    'proofpoint.com': 'Proofpoint',
    'proofpoint.net': 'Proofpoint',
    'barracuda.com': 'Barracuda',
    'barracudanetworks.com': 'Barracuda',
    'symantec.com': 'Symantec',
    'broadcom.com': 'Broadcom',
    'trendmicro.com': 'Trend Micro',
    'mcafee.com': 'McAfee',
    'sophos.com': 'Sophos',
    'kaspersky.com': 'Kaspersky',
    'eset.com': 'ESET',
    'avast.com': 'Avast',
    'avg.com': 'AVG',
    'norton.com': 'Norton',
    'bitdefender.com': 'Bitdefender',
    'malwarebytes.com': 'Malwarebytes',
    'webroot.com': 'Webroot',
    'panda.com': 'Panda',
    'f-secure.com': 'F-Secure',
    'gdata.com': 'G Data',
    'emsisoft.com': 'Emsisoft',
    'adaware.com': 'Ad-Aware',
    'superantispyware.com': 'SUPERAntiSpyware',
    'spybot.com': 'Spybot',
    'spywareblaster.com': 'SpywareBlaster',
    'spywareterminator.com': 'Spyware Terminator',
    'spywarenuker.com': 'Spyware Nuker',
    'spywaredoctor.com': 'Spyware Doctor',
    'spywareguard.com': 'Spyware Guard',
    'spywarehunter.com': 'Spyware Hunter',
    'spywarekiller.com': 'Spyware Killer',
    'spywarepreventer.com': 'Spyware Preventer',
    'spywareremover.com': 'Spyware Remover',
    'spywarescanner.com': 'Spyware Scanner',
    'spywareshield.com': 'Spyware Shield',
    'spywarestopper.com': 'Spyware Stopper',
    'spywaretracker.com': 'Spyware Tracker',
    'spywarewarrior.com': 'Spyware Warrior',
    'spywarezapper.com': 'Spyware Zapper',
  };

  async validateEmail(input: EmailValidationInput): Promise<EmailValidationResult> {
    const { email, validateSmtp, checkCatchAll, timeout } = input;
    const domain = email.split('@')[1];
    if (!domain) {
      throw new Error('Invalid email format');
    }
    const errors: string[] = [];

    try {
      // Get MX records
      const mxRecords = await this.getMXRecords(domain);
      if (mxRecords.length === 0) {
        return {
          email,
          isValid: false,
          isCatchAll: false,
          mxRecords: [],
          validationMethod: 'mx-only',
          confidence: 0,
          errors: ['No MX records found'],
        };
      }

      // Determine MX provider
      const mxProvider = this.detectMXProvider(mxRecords);

      if (!validateSmtp) {
        return {
          email,
          isValid: true,
          isCatchAll: false,
          mxRecords,
          mxProvider,
          validationMethod: 'mx-only',
          confidence: 70,
        };
      }

      // Perform SMTP validation
      const smtpResult = await this.validateSMTP(email, mxRecords, timeout);
      
      // Check for catch-all if requested
      let isCatchAll = false;
      if (checkCatchAll) {
        isCatchAll = await this.checkCatchAll(domain, mxRecords, timeout);
      }

      return {
        email,
        isValid: smtpResult.isValid,
        isCatchAll,
        mxRecords,
        mxProvider,
        smtpResponse: smtpResult.response,
        validationMethod: 'smtp',
        confidence: this.calculateConfidence(smtpResult.isValid, isCatchAll, mxRecords.length),
        errors: smtpResult.errors,
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        email,
        isValid: false,
        isCatchAll: false,
        mxRecords: [],
        validationMethod: 'smtp',
        confidence: 0,
        errors,
      };
    }
  }

  private async getMXRecords(domain: string): Promise<MXRecord[]> {
    try {
      const records = await resolveMx(domain);
      return records.map(record => ({
        exchange: record.exchange,
        priority: record.priority,
        provider: this.mxProviders[record.exchange],
      }));
    } catch (error) {
      throw new Error(`Failed to resolve MX records for ${domain}: ${error}`);
    }
  }

  private detectMXProvider(mxRecords: MXRecord[]): string | undefined {
    for (const record of mxRecords) {
      if (record.provider) {
        return record.provider;
      }
    }
    return undefined;
  }

  private async validateSMTP(email: string, mxRecords: MXRecord[], timeout: number): Promise<{ isValid: boolean; response?: string | undefined; errors?: string[] | undefined }> {
    const errors: string[] = [];

    // Sort MX records by priority
    const sortedMX = mxRecords.sort((a, b) => a.priority - b.priority);

    for (const mxRecord of sortedMX) {
      try {
        const result = await this.connectToSMTP(mxRecord.exchange, email, timeout);
        if (result.isValid) {
          return { isValid: true, response: result.response };
        }
        errors.push(result.error || 'SMTP validation failed');
      } catch (error) {
        errors.push(`SMTP connection failed to ${mxRecord.exchange}: ${error}`);
      }
    }

    return { isValid: false, errors };
  }

  private async connectToSMTP(host: string, email: string, timeout: number): Promise<{ isValid: boolean; response?: string | undefined; error?: string | undefined }> {
    return new Promise((resolve) => {
      const socket = createConnection(25, host);
      let response = '';
      let isValid = false;

      const timer = setTimeout(() => {
        socket.destroy();
        resolve({ isValid: false, error: 'Connection timeout' });
      }, timeout);

      socket.on('connect', () => {
        socket.write('HELO example.com\r\n');
      });

      socket.on('data', (data) => {
        response += data.toString();
        const lines = response.split('\r\n');
        
        for (const line of lines) {
          if (line.startsWith('220')) {
            socket.write('HELO example.com\r\n');
          } else if (line.startsWith('250')) {
            socket.write(`MAIL FROM: <test@example.com>\r\n`);
          } else if (line.startsWith('250') && line.includes('MAIL FROM')) {
            socket.write(`RCPT TO: <${email}>\r\n`);
          } else if (line.startsWith('250') && line.includes('RCPT TO')) {
            isValid = true;
            socket.write('QUIT\r\n');
          } else if (line.startsWith('550') || line.startsWith('551') || line.startsWith('553')) {
            isValid = false;
            socket.write('QUIT\r\n');
          }
        }
      });

      socket.on('close', () => {
        clearTimeout(timer);
        resolve({ isValid, response });
      });

      socket.on('error', (error) => {
        clearTimeout(timer);
        resolve({ isValid: false, error: error.message });
      });
    });
  }

  private async checkCatchAll(domain: string, mxRecords: MXRecord[], timeout: number): Promise<boolean> {
    // Generate a random email that likely doesn't exist
    const randomEmail = `nonexistent${Math.random().toString(36).substring(7)}@${domain}`;
    
    try {
      const result = await this.validateSMTP(randomEmail, mxRecords, timeout);
      // If a random email is accepted, it's likely a catch-all
      return result.isValid;
    } catch {
      return false;
    }
  }

  private calculateConfidence(isValid: boolean, isCatchAll: boolean, mxCount: number): number {
    let confidence = 0;

    if (isValid) {
      confidence += 80;
    } else {
      confidence += 20;
    }

    if (isCatchAll) {
      confidence -= 20;
    }

    if (mxCount > 1) {
      confidence += 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }
}
