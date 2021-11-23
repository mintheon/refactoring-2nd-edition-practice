# 1. 예시프로그램

```javascript
function statement(invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `청구 내역 (고객명: ${invoice.customer})\n`;

  const format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format;

  for (let perf of invoice.performances) {
    const play = plays[perf.playID];
    let thisAmount = 0;

    switch (play.type) {
      //비극
      case 'tragedy':
        thisAmount = 40000;
        if (perf.audience > 30) {
          thisAmount += 1000 * (perf.audience - 30);
        }
        break;

      //희극
      case 'comedy':
        thisAmount = 30000;
        if (perf.audience > 20) {
          thisAmount += 10000 + 500 * (perf.audience - 20);
        }
        thisAmount += 300 * perf.audience;
        break;

      default:
        throw new Error(`알 수 없는 장르: ${play.type}`);
    }

    //포인트 적립
    volumeCredits += Math.max(perf.audience - 30, 0);
    //희극 관객 5명마다 추가 포인트 제공
    if ('comedy' === play.type) {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    //청구내역을 출력
    result += `${play.name}: ${format(thisAmount / 100)} (${
      perf.audience
    }석)\n`;
    totalAmount += thisAmount;
  }

  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;

  return result;
}

module.exports = statement;
```

```
--결과
청구 내역 (고객명: BigCo)
  Hamlet: $650.00 (55석)
  As You Like It: $580.00 (35석)
  Othello: $500.00 (40석)
총액: $1,730.00
적립 포인트: 47점
```

해당 예시 코드는 하나의 메서드가 여러가지 일을 하고 있으며, 장황하고 알아보기 어렵다. 다른사람이 읽고 이해해야 할 일이 생겼는데 로직을 파악하기 어렵다면 뭔가 문제가 있는 것이다.

해당 코드를 수정하면서 프로그램의 작동 방식을 더 쉽게 파악할 수 있도록 **코드를 여러 함수와 프로그램 요소로 재구성 할 것**이다. 프로그램의 구조가 빈약하다면 대체로 **구조를 먼저 잡은 후 수정하는 편이 작업하기가 훨씬 수월하기 때문**이다.

`프로그램이 새로운 기능을 추가하기에 편한 구조가 아니라면, 먼저 기능을 추가하기 쉬운 형태로 리팩터링 하고 나서 원하는 기능을 추가한다.`

# 2. 리팩터링

## 1. 테스트 코드 작성

**리팩터링의 첫 단계는 리팩터링할 코드 영역을 검사해줄 테스트 코드를 작성하는 것**이다.

해당 `statement()` 함수는 문자열을 반환하므로 다양한 청구서를 미리 작성하여 문자열 형태의 답과 실제 나온 값을 비교하는 형식으로 진행한다. 리팩토링을 진행하면서 문제가 생기면 해당 **테스트 코드의 빨간불로 쉽게 확인할 수 있을 것**이다. 또한 테스트를 작성하는데 시간이 좀 걸리지만 **차후 디버깅 시간이 줄어들어 전체 작업시간은 오히려 단축**된다.

또한 책 내에선 **테스트 프레임 워크를 이용하여 쉽게 테스트 할 수 있도록 설정**하라고 하여 본인은 `jest` 를 사용하였다.

```javascript
const statement = require('../../src/Chapter1/statement');

const invoicesJson = require('./data/invoices.json');
const playsJson = require('./data/plays.json');

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
});
```

![image-20211123012747713](https://tva1.sinaimg.cn/large/008i3skNgy1gwoe6w64dej30ix06pt93.jpg)

`리팩터링하기 전에 제대로 된 테스트부터 마련한다. 테스트는 반드시 자가진단하도록 만든다.`

---

## 2. statement()함수 쪼개기

해당방식은 **함수 추출하기** 라고 부르며, 코드조각을 별도 함수로 추출하여 코드가 하는 일을 설명하도록 지어준다.

1. 함수로 뺴냈을 때 유효 범위를 벗어나는 변수, 즉 새 함수에서 곧바로 사용할 수 없는 변수가 있는지 확인
2. perf, play는 새함수에서도 필요하지만 값을 변경하지 않기 때문에 매개변수로 전달
3. thisAmount는 함수안에서 값이 바뀌는데 해당 값은 그대로 두고 반환하도록 작성

```javascript
//공연 타입마다의 비용을 계산해준다.
function amountFor(aPerformance, play) {
  let result = 0;

  switch (play.type) {
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
      throw new Error(`알 수 없는 장르: ${play.type}`);
  }

  return result;
}
```

- 아무리 간단한 수정이라도 리팩터링 후에는 항상 테스트 하는 습관을 들이자. **조금씩 변경하고 매번 테스트하는 것은 리팩터링 절차의 핵심**이다.
- **하나의 리팩터링을 문제없이 끝낼 때마다 커밋**한다. 또한 함수 추출하기는 흔히 IDE에서 자동으로 수행해준다.
- 변수의 **이름을 명확하게** 하자. (저자는 함수의 반환값에는 항상 result라는 이름을 쓴다고 한다.)
- 매개변수 이름에 접두어로 타입 이름을 적는데, 매개변수 역할이 뚜렷하지 않을 때는 부정관사(a/an)을 붙인다.

`리팩터링은 프로그램 수정을 작은 단계로 나눠 진행한다. 그래서 중간에 실수하더라도 버그를 쉽게 찾을 수 있다.`

`컴퓨터가 이해하는 코드는 바보도 작성할 수 있다. 사람이 이해하도록 작성하는 프로그래머가 진정한 실력자다.`

## 3. play 변수 제거하기

play의 경우 aPerformance에서 얻기 때문에 애초 매개변수로 전달할 필요가 없기 때문에 제거한다.

해당 건은 **임시변수를 질의함수로 바꾸기** 라고 부른다. 추가적으로 **변수 인라인하기**를 적용한다.

```javascript
function playFor(aPerformance) {
  return plays[aPerformance.playID];
}
```

```javascript
//statement 함수 내
...
//인라인 처리
let thisAmount = amountFor(perf, playFor(perf));
...
```

변수를 인라인 한 덕분에 `amountFor()` 에 **함수선언바꾸기**를 적용하여 play 매개변수를 제거할 수 있다.

```javascript
//amountFor 메서드 내
...
//switch (play.type)
switch (playFor(aPerformance).type) {
...
```

이후 필요 없어진 `amountFor()` 내의 play 변수는 제거한다.

```javascript
//function amountFor(aPerformance, play) { -> 이전
function amountFor(aPerformance) {
```

이전 코드는 루프를 한 번 돌때마다 공연을 조회했는데 리팩터링한 코드에서는 세번이나 조회한다. 하지만 아직까진 성능에 큰 영향은 없고, 차후에 성능을 개선하기가 훨씬 수월할 것이다. **지역 변수를 제거해서 얻는 가장 큰 장점은 추출 작업이 쉬워진다.**

이후에 `thisAmount` 변수는 값이 다시 바뀌지 않기 때문에 **변수 인라인하기** 를 적용한다.

```javascript
...
    //totalAmount += thisAmount; -> 기존
    result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${
      perf.audience
    }석)\n`;
    totalAmount += amountFor(perf);
...
```

---

## 4. 적립포인트 계산 코드 추출하기

지역변수인 `volumeCredit` 을 처리해본다. 해당 변수는 반복문을 돌때마다 값을 누적해야 하기 때문에 살짝 까다로운데, 최선의 방법은 **추출한 함수에서 복제본을 초기화한 뒤 계산 결과를 반환토록 하는것**이다.

```javascript
function volumeCreditsFor(aPerformance) {
  let volumeCredits = 0;
  volumeCredits += Math.max(aPerformance.audience - 30, 0);

  if ('comedy' === playFor(aPerformance).type) {
    volumeCredits += Math.floor(aPerformance.audience / 5);
  }

  return volumeCredits;
}
```

```javascript
//statement 내부
...
volumeCredits += volumeCreditsFor(perf);
...
```

---

## 5. format 변수 제거하기

임시 변수는 나중에 문제를 일으킬 수 있다. 이번 리팩터링은 그런 변수들을 제거한다. 해당 `format` 변수를 함수를 직접 선언해 사용하도록 바꾼다.

```javascript
function format(aNumber) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(aNumber);
}
```

하지만 이름이 너무 추상적이다. 해당 함수의 핵심은 화폐 단위 맞추기이기 때문에 해당 느낌을 살리도록 **함수 선언 이름 바꾸기**를 적용했다.

```javascript
function usd(aNumber) {
...
}
```

이름짓기는 중요하면서도 쉽지 않은 작업이다. 긴 함수를 쪼개는 리팩터링은 **이름을 잘 지어야만 효과가 있다.** 이름이 좋으면 함수 본문을 읽지 않고도 무슨 일을 하는지 알 수 있다.

---

## 6. volumeCredits 변수 제거하기

**반복문쪼개기**로 값이 누적되는 부분을 따로 빼낸다.

```javascript
//statement 내부
for (let perf of invoice.performances) {
  //청구내역을 출력
  result += `${playFor(perf).name}: ${usd(amountFor(perf) / 100)} (${
    perf.audience
  }석)\n`;
  totalAmount += amountFor(perf);
}

//반복문 내에서 빠져나간 volumeCredits. 값 누적 로직을 별도 for문으로 분리
for (let perf of invoice.performances) {
  volumeCredits += volumeCreditsFor(perf);
}
```

이어서 **문장 슬라이드**를 적용하여 변수선언 문장을 반복문 바로 앞으로 옮긴다.

```javascript
//statement 내부
let volumeCredits = 0;
for (let perf of invoice.performances) {
  volumeCredits += volumeCreditsFor(perf);
}
```

값 갱신과 관련된 문장들을 모아두니 **임시변수를 질의함수로 바꾸기** 가 수월해졌다. 해당 코드를 **함수로 추출**한다.

```javascript
function totalVolumeCredits() {
  let volumeCredits = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }

  return volumeCredits;
}
```

매번 리팩터링을 할때마다 성능과 깔끔한 코드에 대한 고민을 매번 하였는데, 아주 좋은 구문이 있었다.

![image-20211123223530202](https://tva1.sinaimg.cn/large/008i3skNgy1gwpetw31tuj30ii0fr0vr.jpg)

#### volumeCredits를 통한 진행 단계

1. **반복문 쪼개기**로 변수값을 누적시키는 부분을 분리
2. **문장 슬라이드하기**로 변수 초기화 문장을 변수 값 누적코드 바로 앞으로 옮김
3. **함수 추출하기**로 적립포인트 계산 부분을 별도 함수로 추출
4. **변수 인라인하기**로 volumeCredits 변수를 제거

---

## 7. 동일한 방식으로 totalAmount 처리

```javascript
function totalVolumeCredits() {
  let volumeCredits = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }

  return volumeCredits;
}
```

```javascript
//statement 내부
result += `총액: ${usd(totalAmount() / 100)}\n`;
```

---

## 8. 중간 점검

각 계산과정은 물론 **전체 흐름을 이해하기 훨씬 쉬워졌다.** 최상위 함수는 단 7줄뿐이고 **출력할 문장을 생성하는 일만 하고 계산 로직은 여러개의 보조 함수로 빼냈다.**

---

## 9. 중간 데이터 구조 생성

기존은 프로그램의 논리적 요소를 파악하기 쉽도록 코드의 구조를 보강하는데 주안점을 두고 리팩터링 했다.

이제는 기존에 원했던 `statement()` 의 HTML버전을 만드는 작업을 진행하려고 한다. 대신 현재 분리된 함수들이 `statement()` 안에 중첩함수로 들어있으니 동일한 함수를 사용하게 하기 위해서 **단계 쪼개기**를 진행한다.

단계 쪼개기의 첫번째 할일은 두번째 단계가 될 코드들을 **함수 추출하기**로 뽑아내야 한다.

```javascript
function statement(invoice, plays) {
  return renderPlainText(invoice, plays);
}
```

```javascript
//statement에 있던 로직 모두 옮김..
function renderPlainText(invoice, plays) {
  ...
}
```

기존 `renderPlainText()` 의 `invoice`와 `plays` 를 통해 **전달되는 데이터를 중간 데이터 구조로 옮기면 계산 관련 코드는 전부 `statement()` 함수로 옮기고 `renderPlainText()` 는 매개변수로 전달된 데이터만 처리하게 만들 수 있다.**

```javascript
function statement(invoice, plays) {
  const statementData = {};
  return renderPlainText(statementData, invoice, plays);
}
```

---

## 10. 고객정보와 공연정보 옮기기

고객 정보와 공연정보를 옮겨 `invoice` 매개변수를 삭제해보자.

```javascript
function statement(invoice, plays) {
  const statementData = {};
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances;
  return renderPlainText(statementData, plays);
}
```

```javascript
//totalAmount, totalVolumeCredits 메서드 내
...
//기존 for (let perf of invoice.performances)
for (let perf of data.performances) {
...
```

---

## 11. 연극정보 옮기기

```javascript
function statement(invoice, plays) {
  const statementData = {};
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  return renderPlainText(statementData, plays);

  function enrichPerformance(aPerformance) {
    const result = Object.assign({}, aPerformance); //얕은 복사 수행

    return result;
  }
}
```

굳이 복사를 하는 이유는 함수로 건넨 데이터를 수정하기 싫어서이다. 차후 불변 객체로 생성할 것이다. **가변 데이터는 금방 상하기 때문에 데이터를 최대한 불변으로 취급하자.**

**함수 옮기기**를 적용하여 `playFor()` 함수를 `statement()`로 옮긴다. 이후 해당 메서드를 사용하던 부분을 중간 데이터를 사용하도록 바꾼다.

```javascript
function statement(invoice, plays) {
  const statementData = {};
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  return renderPlainText(statementData, plays);

  function enrichPerformance(aPerformance) {
    const result = Object.assign({}, aPerformance); //얕은 복사 수행

    result.play = playFor(result); //!이부분! 중간 데이터에 연극 정보를 저장

    return result;
  }

  function playFor(aPerformance) {
    return plays[aPerformance.playID];
  }
}
```

```javascript
for (let perf of data.performances) {
  //청구내역을 출력
  //기존: result += ${playFor(perf).name}...
  result += `${perf.play.name}: ${usd(amountFor(perf) / 100)} (${
    perf.audience
  }석)\n`;
}
//위 메서드 외에도 2개 더 있음..
```

---

## 12. 계산 정보 옮기기

`amountFor()` 메서드를 옮긴다.

```javascript
function statement(invoice, plays) {
  const statementData = {};
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  return renderPlainText(statementData, plays);

  function enrichPerformance(aPerformance) {
    const result = Object.assign({}, aPerformance); //얕은 복사 수행

    result.play = playFor(result); //중간 데이터에 연극 정보를 저장
    result.amount = amountFor(result); //중간 데이터에 계산 정보를 저장

    return result;
  }
  ...
}

//그 하위..amountFor 메서드를 사용하는 부분을 perf.amount로 변경.
```

`volumeCreditsFor()` 메서드를 옮긴다.

```javascript
function enrichPerformance(aPerformance) {
  const result = Object.assign({}, aPerformance); //얕은 복사 수행

  result.play = playFor(result); //중간 데이터에 연극 정보를 저장
  result.amount = amountFor(result);
  result.volumeCredits = volumeCreditsFor(result); // 중간 데이터에 포인트 정보를 저장

  return result;
}

//그 하위..volumeCreditsFor 메서드를 사용하는 부분을 perf.volumeCredits로 변경.
```

이후 총합을 계산하는 `totalAmount()` 와 `totalVolumeCredits()` 도 옮긴다.

```javascript
function statement(invoice, plays) {
  const statementData = {};

  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  statementData.totalAmount = totalAmount(statementData);
  statementData.totalVolumeCredits = totalVolumeCredits(statementData);

  return renderPlainText(statementData, plays);
  ...
}

//그 하위..totalAmount 메서드를 사용하는 부분을 data.totalAmount로, totalVolumeCredits 메서드를 사용하는 부분을 data.totalVolumeCredits 로 변경.
```

---

## 13. 반복문을 파이프라인으로 바꾸기

```javascript
function totalAmount(data) {
  //for문을 reduce로 변경.
  return data.performances.reduce((total, p) => total + p.amount, 0);
}

function totalVolumeCredits(data) {
  //for문을 reduce로 변경.
  return data.performances.reduce((total, p) => total + p.volumeCredits, 0);
}
```

---

## 14. 중간 데이터 생성을 전담하는 로직 분리

```javascript
function statement(invoice, plays) {
  return renderPlainText(createStatementData(invoice, plays));

  function createStatementData(invoice, plays) {
    const statementData = {};

    statementData.customer = invoice.customer;
    statementData.performances = invoice.performances.map(enrichPerformance);
    statementData.totalAmount = totalAmount(statementData);
    statementData.totalVolumeCredits = totalVolumeCredits(statementData);

    return statementData;
  }
...
}
```

---

## 15. 파일 분리

`createStatementData()` 메서드와 `statement()` 메서드를 **각각의 .js 파일로 분리**한다.

이 과정에서 `jest` 를 통한 테스트에서 import 사용이 뻑나서 고생했다. 급한대로 [참고](https://velog.io/@noyo0123/jest-test%EC%97%90%EC%84%9C-import-%EB%A5%BC-%EB%AA%BB-%EC%93%B0%EB%84%A4%EC%9A%94-pik230v1hp) 해서 처리했다.

---

## 16. HTML 버전 처리

html버전을 처리할 메서드를 만들고 그와 함께 테스트 코드도 추가한다.

```javascript
function htmlStatement(invoice, plays) {
  return renderHtml(createStatementData(invoice, plays));
}

function renderHtml(data) {
  let result = `<h1>청구 내역 (고객명: ${data.customer})</h1>\n`;
  result += '<table>\n';
  result += '<tr><th>연극</th><th>좌석수</th><th>금액</th></tr>';

  for (let perf of data.performances) {
    result += `  <tr><td>${perf.play.name}</td><td>(${perf.audience}석)</td>`;
    result += `<td>${usd(perf.amount)}</td></tr>\n`;
  }

  result += '</table>\n';
  result += `<p>총액: <em>${usd(data.totalAmount)}</em></p>\n`;
  result += `<p>적립 포인트: <em>${data.totalVolumeCredits}</em>점</p>\n`;

  return result;
}
```

![image-20211124010536478](https://tva1.sinaimg.cn/large/008i3skNgy1gwpj6tffsij30je0770t4.jpg)

---

## 17. 중간 점검

```javascript
//statement.js
import createStatementData from './createStatementData';

function htmlStatement(invoice, plays) {
  return renderHtml(createStatementData(invoice, plays));
}

function statement(invoice, plays) {
  return renderPlainText(createStatementData(invoice, plays));
}

function renderHtml(data) {
  let result = `<h1>청구 내역 (고객명: ${data.customer})</h1>\n`;
  result += '<table>\n';
  result += '<tr><th>연극</th><th>좌석수</th><th>금액</th></tr>';

  for (let perf of data.performances) {
    result += `  <tr><td>${perf.play.name}</td><td>(${perf.audience}석)</td>`;
    result += `<td>${usd(perf.amount)}</td></tr>\n`;
  }

  result += '</table>\n';
  result += `<p>총액: <em>${usd(data.totalAmount)}</em></p>\n`;
  result += `<p>적립 포인트: <em>${data.totalVolumeCredits}</em>점</p>\n`;

  return result;
}

function renderPlainText(data, plays) {
  let result = `청구 내역 (고객명: ${data.customer})\n`;

  for (let perf of data.performances) {
    //청구내역을 출력
    result += `${perf.play.name}: ${usd(perf.amount)} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(data.totalAmount)}\n`;
  result += `적립 포인트: ${data.totalVolumeCredits}점\n`;

  return result;
}

function usd(aNumber) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(aNumber / 100);
}

export { statement, htmlStatement };
```

```javascript
//createStatementData.js
export default function createStatementData(invoice, plays) {
  const result = {};

  result.customer = invoice.customer;
  result.performances = invoice.performances.map(enrichPerformance);
  result.totalAmount = totalAmount(result);
  result.totalVolumeCredits = totalVolumeCredits(result);

  return result;

  function enrichPerformance(aPerformance) {
    const result = Object.assign({}, aPerformance); //얕은 복사 수행

    result.play = playFor(result); //중간 데이터에 연극 정보를 저장
    result.amount = amountFor(result);
    result.volumeCredits = volumeCreditsFor(result);

    return result;
  }

  function playFor(aPerformance) {
    return plays[aPerformance.playID];
  }

  function amountFor(aPerformance) {
    let result = 0;

    switch (aPerformance.play.type) {
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
        throw new Error(`알 수 없는 장르: ${aPerformance.play.type}`);
    }

    return result;
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
```

코드량이 많이 늘었지만 모듈화 처리한 덕분에 중복 로직이 많이 사라졌다. 항상 ''코드베이스를 작업하기 전보다 더 건강하게 고친다.' 라는 규칙을 지키자. **완벽하지는 않더라도 분명 더 나아지게 하자.**

---

## 18. 다형성을 활용해 계산 코드 재구성

연극 장르를 추가하고 장르마다 공연료와 적립 포인트 계산법을 다르게 지정하도록 수정하게 되면, 현재상태의 경우 조건문을 추가해주어야 한다. 계속해서 생기면 계속해서 추가해줘야한다.

이를 방지하기 위해 다형성을 활용하여 상속 계층을 구성하는것을 목표로 한다. 핵심은 **조건부 로직을 다형성으로 바꾸기**다.

---

## 19. 공연료 계산기 만들기

기존 코드의 동작을 이 클래스로 옮기면서 **모든 데이터 변환을 한곳에서 수행할 수 있게 하여 코드를 더욱 명확하게 만든다.** 먼저 생성자에 **함수선언바꾸기**를 적용하여 연극을 계산기로 전달하자.

```javascript
class PerformanceCalculator {
  constructor(aPerformance, aPlay) {
    this.performances = aPerformance;
    this.play = aPlay;
  }
}
```

---

## 20. 함수들을 계산기로 옮기기

현재까지는 중첩 함수를 재배치 하여 옮기는데 부담이 없었지만, 이번엔 **함수옮기기** 리팩터링을 통해 다른 컨텍스트로 옮기게 된다. **함수 옮기기** 작업을 통해 공연료 계산 코드를 계산기 클래스 안으로 복사하자.

먼저 공연료 계산코드를 옮긴다.

```javascript
//PerformanceCalculator 내부
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
```

두번째로 적립 포인트를 계산하는 함수도 옮긴다.

```javascript
//PerformanceCalculator 내부
	get volumeCredits() {
    let volumeCredits = 0;
    volumeCredits += Math.max(this.performance.audience - 30, 0);

    if ('comedy' === this.play.type) {
      volumeCredits += Math.floor(this.performance.audience / 5);
    }

    return volumeCredits;
  }
```

```javascript
function enrichPerformance(aPerformance) {
  const calculator = new PerformanceCalculator(
    aPerformance,
    playFor(aPerformance),
  );

  const result = Object.assign({}, aPerformance);

  result.play = calculator.play;
  result.amount = calculator.amount;
  result.volumeCredits = calculator.volumeCredits; //여기 변경

  return result;
}
```

---

## 21. 공연료 계산기를 다형성 버전으로 만들기

다형성을 지원하기 위해 가장 먼저 할 일은 **타입코드 대신 서브클래스를 사용하도록 변경하는 것**이다.

생성자 대신 함수를 호출하게 하고 **생성자를 팩토리 함수로 바꾸기를 적용**한다.

또한 switch문으로 되어있던 부분을 override를 통해 처리하도록 변경한다.

```javascript
function enrichPerformance(aPerformance) {
  const calculator = createPerformanceCalculator(
    aPerformance,
    playFor(aPerformance),
  );

  const result = Object.assign({}, aPerformance);

  result.play = calculator.play;
  result.amount = calculator.amount;
  result.volumeCredits = calculator.volumeCredits;

  return result;
}

//계산기 팩토리 패턴으로 생성
function createPerformanceCalculator(aPerformance, aPlay) {
  switch (aPlay.type) {
    case 'tragedy':
      return new TragedyCalculator(aPerformance, aPlay);
    case 'comedy':
      return new ComedyCalculator(aPerformance, aPlay);
    default:
      throw new Error(`알 수 없는 장르: ${aPlay.type}`);
  }
}

class PerformanceCalculator {
  constructor(aPerformance, aPlay) {
    this.performance = aPerformance;
    this.play = aPlay;
  }

  get amount() {
    throw new Error('서브클래스에서 처리하도록 설계되었습니다.');
  }

  get volumeCredits() {
    let volumeCredits = 0;
    volumeCredits += Math.max(this.performance.audience - 30, 0);

    if ('comedy' === this.play.type) {
      volumeCredits += Math.floor(this.performance.audience / 5);
    }

    return volumeCredits;
  }
}

class TragedyCalculator extends PerformanceCalculator {
  get amount() {
    let result = 40000;
    if (this.performance.audience > 30) {
      result += 1000 * (this.performance.audience - 30);
    }

    return result;
  }
}

class ComedyCalculator extends PerformanceCalculator {
  get amount() {
    let result = 30000;
    if (this.performance.audience > 20) {
      result += 10000 + 500 * (this.performance.audience - 20);
    }
    result += 300 * this.performance.audience;

    return result;
  }
}
```

연극 장르들을 보니 대다수의 연극은 관객수가 30을 넘는지 검사해야 한다. 기본값은 슈퍼클래스에 남겨두고 장르마다 달라지는 부분은 필요할 때 오버라이드 하게 만든다.

```javascript
//PerformanceCalculater 내부
  get volumeCredits() {
    return Math.max(this.performance.audience - 30, 0);
  }
```

```javascript
//ComedyCalculator 내부
	get volumeCredits() {
    return super.volumeCredits + Math.floor(this.performance.audience / 5);
  }
```

---

## 22. 다형성을 활용하여 데이터 생성

구조를 보강하면서 코드가 늘어났다. 해당 수정으로 나아진 점은 연극 장르별 계산 코드들을 함께 묶어둘 수 있었다.

명확하게 분리해 두면, 차후 로직 추가가 일어날 때 쉽게 처리 가능하다.

---

# 마무리

![image-20211124020223994](https://tva1.sinaimg.cn/large/008i3skNgy1gwpkt5j47bj30is0am0uf.jpg)

![image-20211124020310263](https://tva1.sinaimg.cn/large/008i3skNgy1gwpktykl69j30ir07uwg2.jpg)

![image-20211124020317495](https://tva1.sinaimg.cn/large/008i3skNgy1gwpku2x6c5j30iv039dfx.jpg)
