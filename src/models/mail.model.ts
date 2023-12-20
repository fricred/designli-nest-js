import { Header } from './header.model';
import { CommonHeaders } from './common-headers.model';
export class Mail {
  timestamp: string;
  source: string;
  messageId: string;
  destination: string[];
  headersTruncated: boolean;
  headers: Header[];
  commonHeaders: CommonHeaders;
}
