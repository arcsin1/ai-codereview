/**
 * Token Counter Utility Class
 * Used to estimate token count of text, helping control LLM API costs
 */
export class TokenCounterUtil {
  /**
   * Estimate token count of text
   * Note: This is an estimate, actual token count is determined by LLM provider
   *
   * @param text - Text to count
   * @returns Estimated token count
   */
  static countTokens(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    // Count Chinese characters (Unicode range: \u4e00-\u9fa5)
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // Count full-width characters (including Chinese punctuation, full-width letters/numbers, etc.)
    const fullWidthChars = (text.match(/[\u3000-\u303f\uff00-\uffef]/g) || []).length;

    // Count English words (separated by spaces and punctuation)
    const englishWords = text
      .replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, ' ') // Remove Chinese and full-width characters
      .split(/[\s\n\r\t]+/) // Split by whitespace
      .filter(word => word.length > 0 && /[a-zA-Z0-9]/.test(word)) // Filter empty and non-English words
      .length;

    // Estimation formula:
    // - Chinese characters: ~1.5 tokens/character (including punctuation)
    // - Full-width characters: ~1.5 tokens/character
    // - English words: ~0.75 tokens/word
    // - Code and special characters: ~0.5 tokens/character

    const totalChars = text.length;
    const chineseAndFullWidth = chineseChars + fullWidthChars;
    const otherChars = totalChars - chineseAndFullWidth - (englishWords * 5); // Estimate average English word length

    return Math.ceil(
      chineseAndFullWidth * 1.5 +
      englishWords * 0.75 +
      otherChars * 0.5
    );
  }

  /**
   * Truncate text to fit max token limit
   * Truncates from the end, keeping the beginning
   *
   * @param text - Original text
   * @param maxTokens - Max token count
   * @returns Truncated text
   */
  static truncateByTokens(text: string, maxTokens: number): string {
    if (this.countTokens(text) <= maxTokens) {
      return text;
    }

    const lines = text.split('\n');
    let currentTokens = 0;
    const resultLines: string[] = [];

    // Start adding from the first line until token limit is reached
    for (const line of lines) {
      const lineTokens = this.countTokens(line);

      if (currentTokens + lineTokens > maxTokens) {
        // If adding this line would exceed limit, try to truncate the line
        const remainingTokens = maxTokens - currentTokens;
        if (remainingTokens > 10) { // Keep at least 10 tokens
          const truncatedLine = this.truncateLineToTokens(line, remainingTokens);
          resultLines.push(truncatedLine);
          resultLines.push('\n... (content truncated due to length limit)');
        }
        break;
      }

      resultLines.push(line);
      currentTokens += lineTokens;
    }

    return resultLines.join('\n');
  }

  /**
   * Truncate single line text to fit token limit
   *
   * @param line - Single line text
   * @param maxTokens - Max token count
   * @returns Truncated text
   */
  private static truncateLineToTokens(line: string, maxTokens: number): string {
    const charRatio = maxTokens / this.countTokens(line);
    const targetLength = Math.floor(line.length * charRatio * 0.9); // Keep 10% buffer
    return line.substring(0, Math.max(0, targetLength));
  }

  /**
   * Estimate token count of message list
   *
   * @param messages - Message list
   * @returns Estimated token count
   */
  static countMessagesTokens(messages: Array<{ role: string; content: string }>): number {
    // Base overhead per message (role, structure, etc.)
    const baseTokensPerMessage = 4;

    let total = 0;
    for (const message of messages) {
      total += baseTokensPerMessage;
      total += this.countTokens(message.content || '');
      total += this.countTokens(message.role || '');
    }

    // Additional structural overhead
    return total + 3;
  }

  /**
   * Calculate character count of string (distinguishing Chinese and English)
   *
   * @param text - Input text
   * @returns Character statistics
   */
  static getCharacterStats(text: string): {
    totalChars: number;
    chineseChars: number;
    englishWords: number;
    lines: number;
  } {
    return {
      totalChars: text.length,
      chineseChars: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
      englishWords: text.split(/[\s\n\r\t]+/).filter(
        word => word.length > 0 && /[a-zA-Z0-9]/.test(word)
      ).length,
      lines: text.split('\n').length,
    };
  }

  /**
   * Check if text exceeds token limit
   *
   * @param text - Input text
   * @param maxTokens - Max token count
   * @returns Whether limit is exceeded
   */
  static exceedsTokenLimit(text: string, maxTokens: number): boolean {
    return this.countTokens(text) > maxTokens;
  }

  /**
   * Get token usage advice
   *
   * @param text - Input text
   * @param modelName - Model name (for different model limits)
   * @returns Token usage advice
   */
  static getTokenUsageAdvice(
    text: string,
    modelName: string = 'gpt-4'
  ): {
    estimatedTokens: number;
    maxTokens: number;
    percentage: number;
    advice: string;
  } {
    const estimated = this.countTokens(text);

    // Context limits for different models
    const modelLimits: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'claude-3-opus': 200000,
      'claude-3-sonnet': 200000,
      'deepseek-chat': 32768,
      'chatglm-turbo': 128000,
    };

    const maxTokens = modelLimits[modelName] || 8192;
    const percentage = (estimated / maxTokens) * 100;

    let advice = '';
    if (percentage > 90) {
      advice = 'Warning: Text is close to token limit, strongly recommend truncating or splitting';
    } else if (percentage > 70) {
      advice = 'Note: Text is relatively long, consider simplifying to preserve important content';
    } else if (percentage > 50) {
      advice = 'Text length is moderate, can be processed normally';
    } else {
      advice = 'Text is short, high processing efficiency';
    }

    return {
      estimatedTokens: estimated,
      maxTokens,
      percentage: Math.round(percentage),
      advice,
    };
  }
}
