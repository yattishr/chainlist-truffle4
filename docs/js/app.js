App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,

     init: function() {
       // load articlesRow
       // var articlesRow = $('#articlesRow');
       // var articleTemplate = $('#articleTemplate');
       //
       // articleTemplate.find('.panel-title').text('article 1');
       // articleTemplate.find('.article-description').text('Description for article 1');
       // articleTemplate.find('.article-price').text('10.23');
       // articleTemplate.find('.article-seller').text('0x012345678912345678');
       // articlesRow.append(articleTemplate.html());

       return App.initWeb3();
     },

     initWeb3: function() {
       // initialize web3
       if(typeof web3 !== 'undefined') {
         // reuse the Provider of the web3 object injected by MetaMask.
         App.web3Provider = web3.currentProvider;
       } else {
         // create a new provider and plug it directly into our local node.
         App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
       }
       web3 = new Web3(App.web3Provider);
       App.displayAccountInfo();
       return App.initContract();
     },

     displayAccountInfo: function() {
       web3.eth.getCoinbase(function(err, account) {
         if (err === null) {
           App.account = account;
           $('#account').text(account);
           web3.eth.getBalance(account, function(err, balance) {
             if (err == null) {
               $('#accountBalance').text(web3.fromWei(balance, "ether") + " MY ETH");
             }
           });
         }
       });
     },

     initContract: function() {
       $.getJSON('ChainList.json', function(chainListArtifact) {
         // get the contract artifact and use it to instantiate a truffle contract abstraction.
         App.contracts.ChainList = TruffleContract(chainListArtifact);
         // set the provider for our contracts, so it knows which node to talk to.
         App.contracts.ChainList.setProvider(App.web3Provider);
         // listen for events.
         App.listenToEvents();
         // retrieve the article from the contract.
         return App.reloadArticles();
       });
     },

    // sellArticle function.
    sellArticle: function() {
    // retrive the details of the article from the input dialog.
    var _article_name = $('#article_name').val();
    var _article_description = $('#article_description').val();
    var _article_price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether");
    console.log("Inside sellArticle...My article name is: ", _article_name);
    console.log("Inside sellArticle...My article price is: ", _article_price);
    if((_article_name.trim() == '') || (_article_price == 0)) {
      // nothing to sell.
      console.log("nothing to sell.");
      return false;
    }
    App.contracts.ChainList.deployed().then(function(instance) {
      return instance.sellArticle(_article_name, _article_description, _article_price, {
        from: App.account,
        gas: 3000000,
      }).then(function(result) {
        console.log("This is my instance: ", instance);
        // will be called when the block containing transaction of the sell article has been mined.
        // Call App.reloadArticles to refresh the interface.
        // App.reloadArticles(); // not needed anymore. now being handled directly by the event.
      }).catch(function(err) {
        console.error(err);
      });
    });
  },

    reloadArticles: function() {
    // avoid loading this function multiple times.
    if (App.loading) {
      return;
    }
    App.loading = true;


    // refresh account information because the balance might have changed.
    App.displayAccountInfo();
    var chainListInstance;
    console.log("inside reloadArticles function...");

    // manually check our web3 provider & log to console.
    console.log("My web3 provider is: ", window.web3.currentProvider);

    // manually check our network id & log to console.
    web3.version.getNetwork(function(err,res){console.log(res)})

    App.contracts.ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.getArticlesForSale();
    }).then(function(articleIds) {
    // retrieve the article placeholder and clear it.
    var articlesRow = $('#articlesRow');
    $('#articlesRow').empty();
    // iterate over all the aritcle ids.
    for(i = 0; i < articleIds.length; i++) {
      var articleId = articleIds[i];
        chainListInstance.articles(articleId.toNumber()).then(function(article) {
        App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
      });
    }
    App.loading = false;
  }).catch(function(err){
    // log any exceptions to the console.
      console.error(err.message);
      App.loading = false;
  });
},

  // call the displayArticle function for displaying of articles to the front-end.
  displayArticle: function(id, seller, name, description, price) {
    var articlesRow = $('#articlesRow');
    var etherPrice = web3.fromWei(price, "ether");
    var articleTemplate = $('#articleTemplate');
    articleTemplate.find('.panel-title').text(name);
    articleTemplate.find('.article-description').text(description);
    articleTemplate.find('.article-price').text(etherPrice + " ETH");
    articleTemplate.find('.btn-buy').attr('data-id', id);
    articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // check the seller.
    if(seller == App.account) {
      articleTemplate.find('.article-seller').text("You");
      articleTemplate.find('.btn-buy').hide();
    } else {
      articleTemplate.find('.article-seller').text(seller);
      articleTemplate.find('.btn-buy').show();
    }

    // add the new article to our list of articles.
    articlesRow.append(articleTemplate.html());
  },

  // listen for events triggered by the contract.
  listenToEvents: function() {
    App.contracts.ChainList.deployed().then(function(instance) {
      instance.LogSellArticle({}, {}).watch(function(error, event) {
        console.log("inside listenToEvents...");
        if(!error) {
          console.log("inside listenToEvents...item for sale is: ", event.args._name);
          $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale.</li>');
        } else {
          console.log("inside listenToEvents...error occured.");
          console.error(error); // log an error.
        }
        App.reloadArticles(); // refresh the interface.
      });
      // listen for buyArticle event.
      instance.LogBuyArticle({}, {}).watch(function(error, event) {
        if(!error) {
          $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
        } else {
          console.error(error); // log an error.
        }
        App.reloadArticles(); // refresh the interface.
      })

    });
  },

  // function for buyArticle.
  buyArticle: function() {
    event.preventDefault();
    // retrieve the article id.
    var _articleId = $(event.target).data('id');
    // retrieve the article price.
    var _price = parseFloat($(event.target).data('value')); // retrieve the data value stored in the button.
    App.contracts.ChainList.deployed().then(function(instance) {
      return instance.buyArticle(_articleId, {
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  },


};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
