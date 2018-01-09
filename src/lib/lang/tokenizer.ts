export interface IToken {
  rule: ITokenRule;
  matchedContent: string;
  content: string;
  value: any;
  line: number;
  column: number;
}

export interface ITokenRule {
  name: string;
  test: RegExp;
  toValue?(matchedContent?: string): any;
}

export const tokenize = (s: string, rules: ITokenRule[], line = 1, column = 1, tokens: IToken[] = []): IToken[] => {
  let token: IToken;

  for (let i=0; i<rules.length; i++) {
    const rule = rules[i];
    const m = s.match(rule.test);

    if (m) {
      const matchedContent = m[m.length > 1 ? 1 : 0];
      const content = m[0];
      const value = rule.toValue ?
        rule.toValue(matchedContent) :
        matchedContent
      ;
      token = {rule, matchedContent, content, value, line, column};
      break;
    }
  }

  if (token) {
    tokens.push(token);

    const endlineMatch = token.content.match(/\n/g);

    const currentLine = endlineMatch ?
      line + token.content.match(/\n/g).length :
      line
    ;

    const currentColumn = currentLine !== line ?
      token.content.length - token.content.lastIndexOf('\n') :
      column + token.content.length
    ;

    const rest = s.slice(token.content.length);

    if (rest.length > 0) {
      return tokenize(rest, rules, currentLine, currentColumn, tokens);
    } else {
      return tokens;
    }

  } else {
    const indexOfEndline = s.indexOf('\n');
    const length = Math.min(
      indexOfEndline !== -1 ? indexOfEndline : s.length,
      50
    );

    throw new Error(`Unknown token at ${s.slice(0, length)}`);
  }
};

export const tokensToString = (tokens: IToken[]) => tokens
  .map(token => token.content)
  .join('')
;
