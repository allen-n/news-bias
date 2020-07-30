# news-bias
A chrome extension to track the political bias of your news diet to understand others better and help depolarize the political climate

## More info
Coming soon

## Contributing
Fairly straightforward, just file an issue or submit a pull request and I'll review it when I can :)

### Getting started
1. Clone the repo locally
2. Open your chromium browser (chrome, the new edge, etc.) and navigate to [chrome://extensions/](chrome://extensions/)
3. Select `Load Unpacked`, and then navigate to wherever you downloaded this repo
4. That's it! You're in business

### Code documentation
It's a _little_ messy (this _is_ a hobby project), but most functions & should be fairly well documented within code, so i'll just put some high level overview here:

* [scripts/eventPage.js](scripts/eventPage.js): The main background script for the extension. Most of the logic happens here, and content scripts send messages here when they are done working with individual tabs. 
* [scripts/getUrlsScript.js](scripts/getUrlsScript.js): A content script that is fired in a new tab _just once_ any time a new tab finishes loading. It grabs all the base domains (i.e. youtube.com) displayed in href's on the page, and sends them back to the eventPage.js as a message. Additionally, it can follow links via issuing HEAD requests on sites like facebook that obfuscate news links. This workaround doesn't work on google news.
* [scripts/jquery-3.5.1.min.js](scripts/jquery-3.5.1.min.js): The jQuery minJS, for some utility functions (ajax requests, and JSON loading/parsing)
* [scripts/utils.js](scripts/utils.js): Utility functions that are shared between the js files. This should stay fairly lightweight, as it is injected into the background runtime and each of the popup/option pages.
* [scripts/popup.js](scripts/popup.js): The popup HTML page's correspoding js code
* [scripts/options.js](scripts/options.js): The options HTML page's correspoding js code
* [biasRatings.json](biasRatings.json): The JSON file with the bias ratings of news sites from [allsides.com](https://www.allsides.com/unbiased-balanced-news). These were generated using the [allsides scraper](https://github.com/allen-n/AllSides-Scraper), feel free to clone that repo to re-generate the ratings.

## Authors
* [Allen](https://www.allennikka.com/)
* You? --> Drop me a line (: