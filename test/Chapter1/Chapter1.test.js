const statement = require('../../src/Chapter1/statement');

const invoicesJson = require('./data/invoices.json');
const playsJson = require('./data/plays.json');

describe('statement', () => {
  test('다중 플레이, 단일 고객, 다중 좌석에 대한 설명을 일반 텍스트로 인쇄해야 한다.', () => {
    let expected =
      '청구 내역 (고객명: BigCo)\n' +
      'Hamlet: $650.00 (55석)\n' +
      'As You Like It: $580.00 (35석)\n' +
      'Othello: $500.00 (40석)\n' +
      '총액: $1,730.00\n' +
      '적립 포인트: 47점\n';

    expect(statement(invoicesJson[0], playsJson)).toEqual(expected);
  });
});
