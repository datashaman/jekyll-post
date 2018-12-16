RESOLVERS = {
  "description": [
    () => $('meta[property="og:description"]').attr("content"),
    () => $('meta[name="twitter:description"]').attr("content"),
    () => $('meta[name="description"]').attr("content"),
    () => $('meta[itemprop="description"]').attr("content"),
    () => $("#description").text(),
    () => $('[class*="content"] > p').text(),
    () => $('[class*="content"] p').text()
  ],
  "image": [
    () => $('meta[property="og:image:secure_url"]').attr('content'),
    () => $('meta[property="og:image:url"]').attr('content'),
    () => $('meta[property="og:image"]').attr('content'),
    () => $('meta[name="twitter:image:src"]').attr('content'),
    () => $('meta[name="twitter:image"]').attr('content'),
    () => $('meta[itemprop="image"]').attr('content'),
    () => $('article img[src]').attr('src'),
    () => $('#content img[src]').attr('src'),
    () => $('img[alt*="author"]').attr('src'),
    () => $('img[src]').attr('src')
  ],
  "logo": [
    () => $('meta[property="og:logo"]').attr('content'),
    () => $('meta[itemprop="logo"]').attr('content'),
    () => $('img[itemprop="logo"]').attr('src')
  ],
  "title": [
    () => $('meta[property="og:title"]').attr("content"),
    () => $('meta[name="twitter:title"]').attr("content"),
    () => $(".post-title").text(),
    () => $(".entry-title").text(),
    () => $('h1[class*="title"] a').text(),
    () => $('h1[class*="title"]').text(),
    () => $("title").text()
  ],
  "url": [
    () => $('meta[property="og:url"]').attr('content'),
    () => $('meta[name="twitter:url"]').attr('content'),
    () => $('link[rel="canonical"]').attr('href'),
    () => $('link[rel="alternate"][hreflang="x-default"]').attr('href'),
    () => location.href,
  ],
};

function match (url, scheme) {
  return new RegExp("^" + scheme.split("*").join(".*") + "$").test(url);
}

function resolve (key) {
  for (const resolver of RESOLVERS[key]) {
    value = resolver();

    if (value) {
      return value;
    }
  }
}

function log(message, context) {
  console.log(message, context);
}

function message(message) {
  chrome.runtime.sendMessage(message);
}

var url = resolve('url');

function providersUrl() {
  return chrome.extension.getURL('/providers.json');
}

function resolvers(metadata) {
  // log("Metadata from oembed", metadata);

  for (const key of Object.keys(RESOLVERS)) {
    if (key === 'url' || metadata[key]) {
      continue;
    }

    value = resolve(key);

    if (value) {
      metadata[key] = value;
    }
  }

  message(metadata);
}

$.getJSON(providersUrl(), function (providers) {
  // log("Loaded " + providers.length + " providers");

  let metadata = {
    url: url
  };
  let endpoint;
  let provider = providers.find(function (provider) {
    endpoint = provider.endpoints.find(function (endpoint) {
      let scheme = null;

      if (endpoint.schemes) {
        scheme = endpoint.schemes.find(function (scheme) {
          return match(url, scheme);
        });
      } else {
        if (match(url, provider.provider_url + "*")) {
          scheme = provider.provider_url + "*";
        }
      }

      if (scheme) {
        // log("Found scheme", scheme);
      }

      return Boolean(scheme);
    });

    if (endpoint) {
      // log("Found endpoint", endpoint);
    }

    return Boolean(endpoint);
  });

  if (provider) {
    // log("Found provider", provider);
  }

  if (endpoint) {
    let endpointUrl = endpoint.url.replace('{format}', 'json');

    $.get(endpointUrl, {url: url}, function (oembed) {
      // log("Found oembed", oembed);

      metadata.embed = {
        title: oembed.title,
        url: url,
        description: oembed.description,
        provider_name: oembed.provider_name,
        provider_url: oembed.provider_url,
        author_name: oembed.author_name,
        author_url: oembed.author_url,
        html: oembed.html,
        thumbnail_url: oembed.thumbnail_url
      };

      resolvers(metadata);
    }).fail(function () {
      log("Failed retrieving endpoint", arguments);
    });
  } else {
    log("No endpoint found");
    resolvers(metadata);
  }
}).fail(function () {
  log("Failed retrieving providers", arguments);
});
