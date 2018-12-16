String.prototype.lpad = function(padString, length) {
  var str = this;
  while (str.length < length)
    str = padString + str;
  return str;
}

jQuery(function ($) {
  chrome.storage.sync.get(['token', 'repo', 'layout'], function ({ token, repo, layout }) {
    if (!token || !repo || !layout) {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
      return;
    }

    $("#submit").click(function () {
      let now = new Date;

      let data = {
        url: $("#url").text(),
        title: $("#title").val(),
        description: $("#description").val(),
        embed: $("#embed").data()
      };

      let frontMatter = {
        layout: layout,
        date: strftime("%F %H:%M:%S %z", now)
      };

      if (data.title) {
        frontMatter.title = data.title;
      }

      if (data.embed) {
        frontMatter.embed = data.embed;
      }

      let content = "---\n" +
        YAML.stringify(frontMatter) + "\n" +
        "---\n" +
        data.description;

      let path =
        "_posts/" +
        now.getFullYear() + "-" +
        now.getMonth().toString().lpad(2) + "-" +
        now.getDate().toString().lpad(2) + "-" +
        slugify(data.title) + ".md";

      const gh = new GitHub({token: token});

      [userName, repoName] = repo.split('/');
      let userRepo = gh.getRepo(userName, repoName);

      userRepo.writeFile("master", path, content, data.title, function (err, res, req) {
        if (err) {
          console.log(err, res, req);

          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Unsuccessful",
            message: "Your post to " + repo + " was NOT successful",
            iconUrl: "https://jekyllrb.com/img/logo-2x.png",
            imageUrl: data.embed.thumbnail_url
          });
        } else {
          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Successful",
            message: "Your post to " + repo + " was successful",
            iconUrl: "https://jekyllrb.com/img/logo-2x.png",
            imageUrl: data.embed.thumbnail_url
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
