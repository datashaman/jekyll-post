const optionsRequired = [
  'branch',
  'layout',
  'posts',
  'repo',
  'token'
];

jQuery(function ($) {
  chrome.storage.sync.get(optionsRequired, function (options) {
    optionsRequired.forEach(function (option) {
      $("#" + option).val(options[option]);
    });

    $("#submit").click(function (e) {
      let values = optionsRequired.reduce(function (values, option) {
        values[option] = $("#" + option).val();
        return values;
      }, {});

      chrome.storage.sync.set(values, function () {
        window.close();
      });
    });
  });
});
