import { Verdict } from './verdict.model';
import { Action } from './action.model';
export class Receipt {
  timestamp: string;
  processingTimeMillis: number;
  recipients: string[];
  spamVerdict: Verdict;
  virusVerdict: Verdict;
  spfVerdict: Verdict;
  dkimVerdict: Verdict;
  dmarcVerdict: Verdict;
  dmarcPolicy: string;
  action: Action;
}
