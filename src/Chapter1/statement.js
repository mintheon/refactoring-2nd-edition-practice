function statement(invoice, plays) {
  let totalAmount = 0;
  let result = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    //청구내역을 출력
    result += `${playFor(perf).name}: ${usd(amountFor(perf) / 100)} (${
      perf.audience
    }석)\n`;
    totalAmount += amountFor(perf);
  }

  let volumeCredits = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }

  result += `총액: ${usd(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;

  return result;

  function volumeCreditsFor(aPerformance) {
    let volumeCredits = 0;
    volumeCredits += Math.max(aPerformance.audience - 30, 0);

    if ('comedy' === playFor(aPerformance).type) {
      volumeCredits += Math.floor(aPerformance.audience / 5);
    }

    return volumeCredits;
  }

  function usd(aNumber) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(aNumber);
  }

  function playFor(aPerformance) {
    return plays[aPerformance.playID];
  }

  //공연 타입마다의 비용을 계산해준다.
  function amountFor(aPerformance) {
    let result = 0;

    switch (playFor(aPerformance).type) {
      //비극
      case 'tragedy':
        result = 40000;
        if (aPerformance.audience > 30) {
          result += 1000 * (aPerformance.audience - 30);
        }
        break;

      //희극
      case 'comedy':
        result = 30000;
        if (aPerformance.audience > 20) {
          result += 10000 + 500 * (aPerformance.audience - 20);
        }
        result += 300 * aPerformance.audience;
        break;

      default:
        throw new Error(`알 수 없는 장르: ${playFor(aPerformance).type}`);
    }

    return result;
  }
}

module.exports = statement;
