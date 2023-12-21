// Import required modules and dependencies
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Header,
} from '@nestjs/common';
import { EmailParserService } from './email-parser.service';
import { EmailEvent } from '../models';

// Define a controller class for handling email parsing requests
@Controller('email-parser')
export class EmailParserController {
  constructor(private emailParserService: EmailParserService) {
    // Constructor to inject the EmailParserService instance
  }

  /**
   * Handle HTTP POST requests to parse email content.
   *
   * @param emailEvent - The email event object from the request body.
   * @returns A Promise that resolves to the parsed email content.
   */
  @Post()
  async parseEmail(@Body() emailEvent: EmailEvent): Promise<any> {
    // Define a method to parse email content
    // It takes an 'emailEvent' object from the request body
    // and returns a Promise that resolves to the parsed content.

    // Call the 'parseEmailContent' method of EmailParserService
    const parsedContent = this.emailParserService.parseEmailContent(emailEvent);

    // Return the parsed email content as the response
    return parsedContent;
  }

  // This endpoint parses email content based on the provided emailFilePath parameter.
  // It also sets the Content-Type header to 'application/json' for the response.
  @Get()
  @Header('Content-Type', 'application/json') // Set the Content-Type header
  async parseUrlEmail(@Query('emailFilePath') emailFilePath: string) {
    // Step 1: Call the parseEmail method of the EmailParserService to parse the email content.
    const jsonData = await this.emailParserService.parseEmail(emailFilePath);

    // Step 2: Return the parsed JSON data as the response.
    return jsonData;
  }
}
