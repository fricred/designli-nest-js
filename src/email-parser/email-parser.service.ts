import { Injectable } from '@nestjs/common';
import { EmailEvent } from '@models/index';

@Injectable()
export class EmailParserService {
  /**
   * Parses the content of an email event.
   *
   * @param emailEvent - The email event object to parse.
   * @returns An array of parsed email event objects.
   */
  parseEmailContent(emailEvent: EmailEvent): any {
    // This method transforms an EmailEvent into an array of parsed email event objects.
    // It assumes that emailEvent.Records is an array.

    return emailEvent.Records.map((record) => {
      const { ses } = record;
      return {
        spam: ses.receipt.spamVerdict.status === 'PASS',
        virus: ses.receipt.virusVerdict.status === 'PASS',
        dns:
          ses.receipt.spfVerdict.status === 'PASS' &&
          ses.receipt.dkimVerdict.status === 'PASS' &&
          ses.receipt.dmarcVerdict.status === 'PASS',
        mes: this.extractMonthFromTimestamp(ses.mail.timestamp),
        retrasado: ses.receipt.processingTimeMillis > 1000,
        emisor: this.extractEmailUser(ses.mail.source),
        receptor: ses.mail.destination.map((dest) =>
          this.extractEmailUser(dest),
        ),
      };
    });
  }

  /**
   * Extracts the month from a timestamp string.
   *
   * @param timestamp - The timestamp string.
   * @returns The name of the month.
   */
  private extractMonthFromTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('default', { month: 'long' });
  }

  /**
   * Extracts the user part of an email address.
   *
   * @param emailAddress - The full email address.
   * @returns The user part of the email address.
   */
  private extractEmailUser(emailAddress: string): string {
    return emailAddress.split('@')[0];
  }
}
