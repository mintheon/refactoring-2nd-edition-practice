export default function createStatementData(invoice, plays) {
  const result = {};

  result.customer = invoice.customer;
  result.performances = invoice.performances.map(enrichPerformance);
  result.totalAmount = totalAmount(result);
  result.totalVolumeCredits = totalVolumeCredits(result);

  return result;

  function enrichPerformance(aPerformance) {
    const calculator = new PerformanceCalculator(
      aPerformance,
      playFor(aPerformance),
    );

    const result = Object.assign({}, aPerformance); //얕은 복사 수행

    result.play = playFor(result); //중간 데이터에 연극 정보를 저장
    result.amount = calculator.amount;
    result.volumeCredits = volumeCreditsFor(result);

    return result;
  }

  function playFor(aPerformance) {
    return plays[aPerformance.playID];
  }

  function volumeCreditsFor(aPerformance) {
    let volumeCredits = 0;
    volumeCredits += Math.max(aPerformance.audience - 30, 0);

    if ('comedy' === aPerformance.play.type) {
      volumeCredits += Math.floor(aPerformance.audience / 5);
    }

    return volumeCredits;
  }

  function totalAmount(data) {
    return data.performances.reduce((total, p) => total + p.amount, 0);
  }

  function totalVolumeCredits(data) {
    return data.performances.reduce((total, p) => total + p.volumeCredits, 0);
  }
}

class PerformanceCalculator {
  constructor(aPerformance, aPlay) {
    this.performances = aPerformance;
    this.play = aPlay;
  }

  get amount() {
    let result = 0;

    switch (this.play.type) {
      //비극
      case 'tragedy':
        result = 40000;
        if (this.performances.audience > 30) {
          result += 1000 * (this.performances.audience - 30);
        }
        break;

      //희극
      case 'comedy':
        result = 30000;
        if (this.performances.audience > 20) {
          result += 10000 + 500 * (this.performances.audience - 20);
        }
        result += 300 * this.performances.audience;
        break;

      default:
        throw new Error(`알 수 없는 장르: ${this.performances.play.type}`);
    }

    return result;
  }
}
