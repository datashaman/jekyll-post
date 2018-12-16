const gulp = require("gulp");
const { src, dest } = require("gulp");

gulp.task("default", function() {
  return src([
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/github-api/dist/GitHub.bundle.js",
    "node_modules/transliteration/lib/browser/transliteration.min.js",
    "node_modules/yamljs/dist/yaml.min.js"
  ])
    .pipe(dest("scripts/"));
});
