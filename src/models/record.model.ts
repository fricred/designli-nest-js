// record.model.ts
import { SES } from './ses.model';

export class Record {
  eventVersion: string;
  ses: SES;
  eventSource: string;
}
