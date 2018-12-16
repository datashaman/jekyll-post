jQuery(function ($) {
  chrome.storage.sync.get(['token', 'repo', 'layout'], function ({ token, repo, layout }) {
    $("#token").val(token);
    $("#repo").val(repo);
    $("#layout").val(layout);

    $("#submit").click(function (e) {
      chrome.storage.sync.set({
        token: $("#token").val(),
        repo: $("#repo").val(),
        layout: $("#layout").val()
      });
      window.close();
    });
  });
});
