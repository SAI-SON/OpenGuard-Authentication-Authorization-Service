export interface ParsedRule {
  user_id: string;
  action: 'read' | 'write' | 'delete';
  resource: string;
  effect: 'allow' | 'deny';
  explanation: string;
}

export interface AmbiguityIssue {
  field: 'user_id' | 'action' | 'resource' | 'effect';
  message: string;
  suggestions?: string[];
}

export interface PolicyParseResult {
  statement: string;
  success: boolean;
  rules: ParsedRule[];
  ambiguities: AmbiguityIssue[];
  confidence: number;
}

export class PolicyParserService {
  /**
   * Parse a natural language statement into one or more structured permission rules.
   * Handles compound clauses (e.g., "Allow X to read Y, but deny delete access").
   */
  parse(statement: string, defaultUserId?: string): PolicyParseResult {
    const rawStatement = statement.trim();
    if (!rawStatement) {
      return {
        statement: rawStatement,
        success: false,
        rules: [],
        ambiguities: [
          {
            field: 'resource',
            message: 'Statement is empty. Please enter a policy statement.',
          },
        ],
        confidence: 0,
      };
    }

    const ambiguities: AmbiguityIssue[] = [];

    // 1. Extract Target User ID (e.g., "user123", "client@auth0", "user: 123", "for user123", "to user123")
    let extractedUserId = defaultUserId?.trim() || '';
    
    // Look for patterns like "allow/deny [user_id] to" or "for [user_id]" or "[user_id] can/cannot"
    const userPatterns = [
      /(?:allow|deny|grant|permit|block)\s+([a-zA-Z0-9_\-@\.]+)\s+(?:to|from|access)/i,
      /(?:for|to|user)\s+([a-zA-Z0-9_\-@\.]+)/i,
      /^([a-zA-Z0-9_\-@\.]+)\s+(?:can|cannot|should|is\s+allowed|is\s+denied)/i,
    ];

    for (const pat of userPatterns) {
      const match = rawStatement.match(pat);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Ignore keywords that aren't user ids
        if (!['read', 'write', 'delete', 'access', 'all', 'the', 'any', 'user'].includes(candidate.toLowerCase())) {
          extractedUserId = candidate;
          break;
        }
      }
    }

    if (!extractedUserId) {
      ambiguities.push({
        field: 'user_id',
        message: 'No specific user or client ID identified in the statement.',
        suggestions: ['Specify target user (e.g., "Allow user123 to...")'],
      });
    }

    // 2. Split compound statements by conjunctions (", but", ";", " and also ", " however ", " but ")
    const clauses = rawStatement
      .split(/(?:,\s*but\s+|\s+but\s+|;\s*|\s+however\s+)/i)
      .map((c) => c.trim())
      .filter(Boolean);

    const rules: ParsedRule[] = [];
    let primaryResource = '';

    for (const clause of clauses) {
      // Determine effect (allow vs deny)
      let effect: 'allow' | 'deny' = 'allow';
      if (/(?:deny|block|prevent|restrict|revoke|cannot|disallow|no\s+access)/i.test(clause)) {
        effect = 'deny';
      } else if (/(?:allow|permit|grant|can|enable)/i.test(clause)) {
        effect = 'allow';
      }

      // Determine action (read, write, delete)
      const actions: Array<'read' | 'write' | 'delete'> = [];
      if (/(?:read|view|get|fetch|list|query|inspect)/i.test(clause)) {
        actions.push('read');
      }
      if (/(?:write|create|update|edit|modify|put|post|patch|save)/i.test(clause)) {
        actions.push('write');
      }
      if (/(?:delete|remove|destroy|purge)/i.test(clause)) {
        actions.push('delete');
      }

      // Check for ambiguous "access" without specific action
      if (actions.length === 0) {
        if (/(?:access|permission)/i.test(clause)) {
          ambiguities.push({
            field: 'action',
            message: `Clause "${clause}" specifies generic "access" without clarifying whether read, write, or delete is intended.`,
            suggestions: ['read', 'write', 'delete', 'all (read, write, delete)'],
          });
        }
      }

      // Determine resource
      let clauseResource = '';
      
      // Look for explicit paths like "/wallets/...", "wallets/wallet-789/transactions", "wallets/*"
      const explicitPathMatch = clause.match(/(?:\/?wallets[a-zA-Z0-9_\-\/\*]*|\/[a-zA-Z0-9_\-\/\*]+)/i);
      if (explicitPathMatch) {
        clauseResource = explicitPathMatch[0].replace(/^\//, ''); // normalize leading slash
      } else {
        // Natural phrasing like "wallet-789 transactions", "wallet-123", "wallets wildcard"
        const naturalMatch = clause.match(/(?:wallet[s]?[-_\s]?[a-zA-Z0-9_\*]+)(?:\s+(?:transactions|history|balance))?/i);
        if (naturalMatch) {
          const rawRes = naturalMatch[0].toLowerCase();
          if (rawRes.includes('transaction')) {
            const walletId = rawRes.match(/wallet[-_\s]?([a-zA-Z0-9_\*]+)/i)?.[1] || 'wallet-789';
            clauseResource = `wallets/${walletId.startsWith('wallet-') ? walletId : 'wallet-' + walletId}/transactions`;
          } else if (rawRes.includes('*') || rawRes.includes('all') || rawRes.includes('wildcard')) {
            clauseResource = 'wallets/*';
          } else {
            const walletId = rawRes.match(/wallet[-_\s]?([a-zA-Z0-9_\*]+)/i)?.[1] || 'wallet-789';
            clauseResource = `wallets/${walletId.startsWith('wallet-') ? walletId : 'wallet-' + walletId}`;
          }
        }
      }

      if (clauseResource) {
        primaryResource = clauseResource;
      } else if (primaryResource) {
        // Inherit resource from previous clause (e.g., "...to read wallet-789 transactions, but deny delete access")
        clauseResource = primaryResource;
      }

      if (!clauseResource) {
        ambiguities.push({
          field: 'resource',
          message: `Unable to extract resource path from clause: "${clause}"`,
          suggestions: ['wallets/wallet-789/transactions', 'wallets/*'],
        });
      }

      // Generate rules for each detected action
      for (const act of actions) {
        if (clauseResource) {
          rules.push({
            user_id: extractedUserId || 'unassigned_user',
            action: act,
            resource: clauseResource,
            effect,
            explanation: `${effect.toUpperCase()} ${act.toUpperCase()} on "${clauseResource}" for ${extractedUserId || 'user'}`,
          });
        }
      }
    }

    const hasAmbiguity = ambiguities.length > 0;
    const confidence = hasAmbiguity ? 0.6 : 0.98;

    return {
      statement: rawStatement,
      success: rules.length > 0 && !hasAmbiguity,
      rules,
      ambiguities,
      confidence,
    };
  }
}
