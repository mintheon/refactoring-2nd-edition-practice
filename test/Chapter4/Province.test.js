const { expect } = require('chai');

const Province = require('../../src/Chapter4/Province');
const sampleProvinceData = require('../../src/Chapter4/App');

describe('province', function () {
  let asia;
  this.beforeEach(function () {
    asia = new Province(sampleProvinceData());
  });

  it('shortfall', function () {
    expect(asia.shortfall).equal(5);
  });

  it('profit', function () {
    expect(asia.profit).equal(230);
  });
});
