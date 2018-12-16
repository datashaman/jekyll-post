const optionsRequired = [
  'branch',
  'layout',
  'posts',
  'repo',
  'token'
];

function isEmpty (obj) {
  for(var key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

String.prototype.lpad = function (padString, length) {
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

      let title = $("#title").val();

      let fm = {
        layout: options.layout,
        date: strftime("%F %H:%M:%S %z", now),
        title: title,
        request_url: $("#request_url").text()
      };

      const embedData = $("#embed").data();

      if (!isEmpty(embedData)) {
        fm.embed = embedData;
      }

      let content = "---\n" +
        YAML.stringify(fm) +
        "---\n" +
        $("#description").val();

      const path =
        options.posts + "/" +
        now.getFullYear() + "-" +
        now.getMonth().toString().lpad(2) + "-" +
        now.getDate().toString().lpad(2) + "-" +
        slugify(title) + ".md";

      const gh = new GitHub({token: options.token});

      [userName, repoName] = options.repo.split('/');

      const userRepo = gh.getRepo(userName, repoName);
      const iconUrl = "icon128.png";

      userRepo.writeFile(options.branch, path, content, "Post: " + title, function (err, res, req) {
        if (err) {
          console.log(err, res, req);

          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Unsuccessful",
            message: "Your post to " + options.repo + " was NOT successful",
            iconUrl: iconUrl,
            imageUrl: fm.embed && fm.embed.thumbnail_url
              ? fm.embed.thumbnail_url
              : null
          });
        } else {
          chrome.notifications.create("post-result", {
            type: "image",
            title: "Post Successful",
            message: "Your post to " + options.repo + " was successful",
            iconUrl: iconUrl,
            imageUrl: fm.embed && fm.embed.thumbnail_url
              ? fm.embed.thumbnail_url
              : null
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
            case "request_url":
              $el.text(message[key]);
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
