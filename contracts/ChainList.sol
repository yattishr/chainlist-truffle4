pragma solidity ^0.4.18;
import "./Ownable.sol";

contract ChainList is Ownable {

  // custom types.
  struct Article {
    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  // state variables.
  // address owner; // now saved in the parent contract.
  mapping (uint => Article) public articles; // stores a list of articles.
  uint articleCounter; // a key to access each article.

  // define Sell events.
  event LogSellArticle (
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint256 _price
  );

  // define Buy events.
  event LogBuyArticle (
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );



  // deactivate our smart contract.
  function kill() public onlyOwner {
    // only allow the contract owber.
    // require (msg.sender == owner); // now replaced by the modifier.
    // call selfdestruct to refund the remaining ether
    selfdestruct(owner);

  }

  // sell an Article.
  function sellArticle(string _name, string _description, uint256 _price) public {
    // increment our article counter.
    articleCounter++;

    // store a new article into the articles mapping;
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
    );

    // call our LogSellArticle event.
    LogSellArticle(articleCounter, msg.sender, _name, _price);
  }

  // fetch the number of articles in the contract. not allowed to modify the contract, view only.
  function getNumberOfArticles() public view returns (uint) {
    return articleCounter;
  }

  // fetch and return all article IDs of all articles still for sale.
  function getArticlesForSale() public view returns (uint[]) {
    // prepare output array.
    uint[] memory articleIds = new uint[](articleCounter); // specify the max size of the array.

    uint numberOfArticlesForSale = 0;

    // iterate over all the articles.
    for(uint i = 1; i <= articleCounter; i++) {
      // keep the id only if the article is still for sale.
      if(articles[i].buyer == 0x0) {
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }
    // copy the articleIds array into a smaller forSale array.
      uint[] memory forSale = new uint[](numberOfArticlesForSale); // specify the max size of the array.
      for(uint j = 0; j < numberOfArticlesForSale; j++) {
        forSale[j] = articleIds[j];
      }
      return forSale;
  }


  // buy an article. function is 'payable' because it may receive a value; i.e Ether from its caller.
  function buyArticle(uint _id) payable public {
    // check whether there is an article for sale. check if our articleCounter is > 0.
    require(articleCounter > 0);

    // check whether the id passed corresponds with an article which already exists.
    require(_id > 0 && _id <= articleCounter);

    // retrieve the article from the mapping.
    Article storage article = articles[_id];

    // check that the article has not yet been sold. the buyer must be equal to 0x0.
    require(article.buyer == 0x0);

    // we dont allow the seller to buy its own article.
    require(msg.sender != article.seller);

    // we check that the value sent corresponds to the price of the article.
    require(msg.value == article.price);

    // store the buyers information.
    article.buyer = msg.sender;

    // the buyer can pay the seller.
    article.seller.transfer(msg.value);

    // trigger the Buy event.
    LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);

  }

}
