// contract to be tested.
var ChainList = artifacts.require("./ChainList.sol");

// our test suite
contract("ChainList", function(accounts) {
  var chainListInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleName = "article 1";
  var articleDescription = "Description for article 1.";
  var articlePrice = 10;
  var articleId = 1;

// test case 1; throw an exception when there is no article for sale yet.
it("should throw an exception if there is no article for sale yet.", function() {
  return ChainList.deployed().then(function(instance) {
    chainListInstance = instance;
    return chainListInstance.buyArticle(articleId, {
      from: buyer,
      value: wbe3.toWei(articlePrice, "ether")
    });
  }).then(assert.fail)
  .catch(function(error) {
    assert(true);
  }).then(function() {
    return chainListInstance.getNumberOfArticles();
  }).then(function(data) {
    assert.equal(data.toNumber(), 0, "number of articles must be zero(0).");

  });
});

// test case 2; buy an article which does not exist.
it("should throw an exception if you try to buy an article which does not exit.", function() {
  return ChainList.deployed().then(function(instance) {
    chainListInstance = instance;
    return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), {from: seller});
  }).then(function(receipt) {
    return chainListInstance.buyArticle(2, {from: seller, value: web3.toWei(articlePrice, "ether")});
  }).then (assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return chainListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), articleId, "article id must be one(1).");
      assert.equal(data[1], seller, "seller must be: " + seller);
      assert.equal(data[2], 0x0, "buyer must empty.");
      assert.equal(data[3], articleName, "article name must be: " + articleName);
      assert.equal(data[4], articleDescription, "article description must be: " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be: " + web3.toWei(articlePrice, "ether"));
    });
});
// end test case 2; buy an article which does not exist.


// test case 3; throw an exception when you try to buy an article that you are selling.
it("should throw an exception if you try to buy your own article.", function() {
  return ChainList.deployed().then(function(instance) {
    chainListInstance = instance;

    return chainListInstance.buyArticle(articleId, {from: seller, value: web3.toWei(articlePrice, "ether")});
  }).then(assert.fail)
  .catch(function(error) {
    assert(true);
  }).then(function() {
    return chainListInstance.articles(1);
  }).then(function(data) {
    // check to see whether the state of the contract still remains the same.
    assert.equal(data[0].toNumber(), articleId, "article id must be one(1).");
    assert.equal(data[1], seller, "seller must be: " + seller);
    assert.equal(data[2], 0x0, "buyer must empty.");
    assert.equal(data[3], articleName, "article name must be: " + articleName);
    assert.equal(data[4], articleDescription, "article description must be: " + articleDescription);
    assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be: " + web3.toWei(articlePrice, "ether"));
  });
});

// test case 3; throw an exception when you try to buy an article with an incorrect price.
it("should throw an exception if you try to buy an article that is different from its selling price.", function() {
  return ChainList.deployed().then(function(instance) {
    chainListInstance = instance;
    return chainListInstance.buyArticle(articleId, {from: buyer, value: web3.toWei(articlePrice + 1, "ether")});
  }).then(assert.fail)
  .catch(function(error) {
    assert(true);
  }).then(function() {
    return chainListInstance.articles(1);
  }).then(function(data) {
    // check to see whether the state of the contract still remains the same.
    assert.equal(data[0].toNumber(), articleId, "article id must be one(1).");
    assert.equal(data[1], seller, "seller must be: " + seller);
    assert.equal(data[2], 0x0, "buyer must empty.");
    assert.equal(data[3], articleName, "article name must be: " + articleName);
    assert.equal(data[4], articleDescription, "article description must be: " + articleDescription);
    assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be: " + web3.toWei(articlePrice, "ether"));
  });
});

// test case 4; throw an exception when you try to buy an article which has already been sold. we call buyArticle twice.
// first call to buyArticle.
it("should throw an exception if you try to buy an article that has already been sold", function() {
  return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.buyArticle(articleId, {
        from: buyer,
        value: web3.toWei(articlePrice, "ether")
      });
    }).then(function() {
      return chainListInstance.buyArticle(articleId, {
        from: web3.eth.accounts[0],
        value: web3.toWei(articlePrice, "ether")
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(error.message.indexOf('invalid opcode') >= 0, "error message must contain invalid opcode");
    }).then(function() {
      return chainListInstance.articles(articleId);
    }).then(function(data) {
      //make sure sure the contract state was not altered
      assert.equal(data[0].toNumber(), articleId, "article id must be " + articleId);
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], buyer, "buyer must be " + buyer);
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
});
// end test case 4; throw an exception when you try to buy an article which has already been sold. we call buyArticle twice.
}); // final closing bracket.
