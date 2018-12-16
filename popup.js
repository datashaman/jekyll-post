const optionsRequired = [
  'branch',
  'layout',
  'posts',
  'repo',
  'token'
];

String.prototype.lpad = function(padString, length) {
  let str = this;
  while (str.length < length)
    str = padString + str;
  return str;
}

jQuery(function ($) {
  chrome.storage.sync.get(optionsRequired, function (options) {
    const missing = optionsRequired.find(function (name) {
      return !options[name];
    });

    if (missing) {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
      return;
    }

    $("#submit").click(function () {
      const now = new Date;

      const data = {
        description: $("#description").text(),
        embed: $("#embed").data(),
        title: $("#title").val()
      };

      let frontMatter = {
        layout: options.layout,
        date: strftime("%F %H:%M:%S %z", now),
        title: data.title
      };

      if (data.embed !== {}) {
        frontMatter.embed = data.embed;
      }

      const content = "---\n" +
        YAML.stringify(frontMatter) + "\n" +
        "---\n" +
        data.description;

      const path =
        options.posts + "/" +
        now.getFullYear() + "-" +
        now.getMonth().toString().lpad(2) + "-" +
        now.getDate().toString().lpad(2) + "-" +
        slugify(data.title) + ".md";

      const gh = new GitHub({token: options.token});

      [userName, repoName] = options.repo.split('/');

      const userRepo = gh.getRepo(userName, repoName);
      const iconUrl = "https://jekyllrb.com/img/logo-2x.png";

      userRepo.writeFile(options.branch, path, content, data.title, function (err, res, req) {
        if (err) {
          console.log(err, res, req);

          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Unsuccessful",
            message: "Your post to " + options.repo + " was NOT successful",
            iconUrl: iconUrl,
            imageUrl: data.embed ? data.embed.thumbnail_url : iconUrl
          });
        } else {
          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Successful",
            message: "Your post to " + options.repo + " was successful",
            iconUrl: iconUrl,
            imageUrl: data.embed ? data.embed.thumbnail_url : iconUrl
          }, function () {
            window.close();
          });
        }
      });
    });

    chrome.runtime.onMessage.addListener(function (message, sender) {
      for(key of Object.keys(message)) {
        let $el = $("#" + key);

        if ($el.length) {
          switch (key) {
            case "embed":
              $el
                .html(message[key].html)
                .data(message[key])
                .find("img").css({
                  maxWidth: "300px",
                  height: "auto"
                });
              break;
            default:
              $el.val(message[key]);
          }
        }
      }
    });

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.executeScript(tabs[0].id, {file: "metadata.js"});
    });
  });
});
