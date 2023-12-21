import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailEvent } from '@models/index';
import axios from 'axios'; // Import Axios for HTTP requests
import { readFileSync } from 'fs';
import { ParsedMail, simpleParser } from 'mailparser';

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

  // This method parses an email file and extracts JSON data from it.
  async parseEmail(emailFilePath: string): Promise<any> {
    // Step 1: Get the email content
    const emailContent = await this.getEmailContent(emailFilePath);

    // Step 2: Try to extract JSON data from an attachment
    const jsonDataFromAttachment = this.extractJsonFromAttachment(emailContent);
    if (jsonDataFromAttachment) {
      return this.formatJson(jsonDataFromAttachment);
    }

    // Step 3: Try to extract JSON data from links in the email body
    const jsonDataFromLinks = await this.extractJsonFromLinks(emailContent);
    if (jsonDataFromLinks) {
      return jsonDataFromLinks;
    }

    // If JSON data is not found in attachments or links, throw a NotFoundException
    throw new NotFoundException('No JSON data found in the email.');
  }

  // This private method retrieves the email content from a file or URL.
  private async getEmailContent(emailFilePath: string): Promise<ParsedMail> {
    let emailContent: string;

    try {
      // Determine if the provided emailFilePath is a URL or a local file path
      if (emailFilePath.startsWith('http')) {
        // If it's a URL, fetch the email content using Axios
        const response = await axios.get(emailFilePath);
        emailContent = response.data;
      } else {
        // If it's a local file path, attempt to read the email file content synchronously
        try {
          emailContent = readFileSync(emailFilePath, 'utf-8');
        } catch (fileNotFoundError) {
          throw new NotFoundException('File not found.');
        }
      }

      // Use mailparser's simpleParser to parse the email content
      return await simpleParser(emailContent);
    } catch (error) {
      throw new Error('Error fetching email content: ' + error.message);
    }
  }

  // This private method extracts JSON data from an attachment, if available.
  private extractJsonFromAttachment(parsedMail: ParsedMail): any {
    return parsedMail.attachments && parsedMail.attachments.length > 0
      ? parsedMail.attachments[0]?.content
      : null;
  }

  // This private method attempts to extract JSON data from links in the email body.
  private async extractJsonFromLinks(parsedMail: ParsedMail): Promise<string> {
    // Check if the email body contains links
    const emailBody = parsedMail.text || parsedMail.html;
    if (emailBody) {
      // Search for links in the email body
      const linkMatches = emailBody.match(/https?:\/\/[^\s]+/g);

      if (linkMatches && linkMatches.length > 0) {
        for (const link of linkMatches) {
          try {
            const linkResponse = await axios.get(link);

            // Check if the response contains JSON content based on Content-Type
            if (
              linkResponse.headers['content-type']?.includes('application/json')
            ) {
              return linkResponse.data;
            }

            // If Content-Type doesn't indicate JSON, attempt to parse the body
            const parsedJson = linkResponse.data;

            try {
              // Check if the parsed JSON is an object (or array) to ensure it's valid JSON
              if (typeof parsedJson === 'object' && parsedJson !== null) {
                return parsedJson;
              } else {
                throw new Error('Invalid JSON data in the response body.');
              }
            } catch (jsonError) {
              // Handle the error, e.g., log it or ignore it, and continue checking other links
              //console.error(
              //  `Error parsing JSON from response body: ${jsonError}`,
              //);
            }
          } catch (linkError) {
            // Handle the error, e.g., log it or ignore it, and continue checking other links
            // console.error(`Error fetching link: ${link}`, linkError);
          }
        }
      }
    }
    return null;
  }

  // This private method formats JSON data into a pretty-printed string.
  private formatJson(jsonData: any): string {
    const jsonString = jsonData.toString('utf-8');
    try {
      const formattedJsonString = JSON.stringify(
        JSON.parse(jsonString),
        null,
        2,
      );
      return formattedJsonString;
    } catch (jsonError) {
      throw new Error('Error formatting JSON: ' + jsonError.message);
    }
  }
}
