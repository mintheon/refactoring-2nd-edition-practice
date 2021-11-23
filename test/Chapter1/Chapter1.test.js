import { statement, htmlStatement } from '../../src/Chapter1/statement.js';

import invoicesJson from './data/invoices.json';
import playsJson from './data/plays.json';

describe('statement', () => {
  test('다중 플레이, 단일 고객, 다중 좌석에 대한 설명을 일반 텍스트로 표시해야 한다.', () => {
    let expected =
      '청구 내역 (고객명: BigCo)\n' +
      'Hamlet: $650.00 (55석)\n' +
      'As You Like It: $580.00 (35석)\n' +
      'Othello: $500.00 (40석)\n' +
      '총액: $1,730.00\n' +
      '적립 포인트: 47점\n';

    expect(statement(invoicesJson[0], playsJson)).toEqual(expected);
  });

  test('html로 다중 연극, 단일 고객 및 다중 좌석에 대한 설명을 표시해야 한다.', () => {
    let result = `<h1>청구 내역 (고객명: BigCo)</h1>\n`;
    result += '<table>\n';
    result += `<tr><th>연극</th><th>좌석수</th><th>금액</th></tr>  <tr><td>Hamlet</td><td>(55석)</td><td>$650.00</td></tr>\n`;
    result += `  <tr><td>As You Like It</td><td>(35석)</td><td>$580.00</td></tr>\n`;
    result += `  <tr><td>Othello</td><td>(40석)</td><td>$500.00</td></tr>\n`;
    result += '</table>\n';
    result += `<p>총액: <em>$1,730.00</em></p>\n`;
    result += `<p>적립 포인트: <em>47</em>점</p>\n`;

    expect(htmlStatement(invoicesJson[0], playsJson)).toEqual(result);
  });
});
