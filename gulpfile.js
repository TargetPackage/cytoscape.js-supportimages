const gulp = require("gulp");
const replace = require("gulp-replace");
const shell = require("gulp-shell");
const jshint = require("gulp-jshint");
const jshStylish = require("jshint-stylish");
const exec = require("child_process").exec;
const prompt = require("gulp-prompt");
var version;

gulp.task("default", function (next) {
  console.log(
    "You must explicitly call `gulp publish` to publish the extension"
  );
  next();
});

gulp.task("version", function (next) {
  const now = new Date();
  version = process.env["VERSION"];

  if (version) {
    done();
  } else {
    exec("git rev-parse HEAD", function (error, stdout, stderr) {
      // Shorten so not huge filename
      const sha = stdout.substring(0, 10);
      version = ["snapshot", sha, +now].join("-");
      done();
    });
  }

  function done() {
    console.log("Using version number `%s` for building", version);
    next();
  }
});

gulp.task("confver", gulp.series("version"), function () {
  return gulp.src(".").pipe(
    prompt.confirm({
      message: `Are you sure version '${version}' is OK to publish?`,
    })
  );
});

gulp.task("pkgver", gulp.series("version"), function () {
  return gulp
    .src(["package.json", "bower.json"])
    .pipe(replace(/\"version\"\:\s*\".*?\"/, `"version": "${version}"`))
    .pipe(gulp.dest("./"));
});

gulp.task(
  "push",
  shell.task([
    "git add -A",
    'git commit -m "pushing changes for v$VERSION release"',
    "git push",
  ])
);

gulp.task(
  "tag",
  shell.task([
    'git tag -a $VERSION -m "tagging v$VERSION"',
    "git push origin $VERSION",
  ])
);

gulp.task("npm", shell.task(["npm publish ."]));

// http://www.jshint.com/docs/options/
gulp.task("lint", function () {
  return gulp
    .src("cytoscape-*.js")
    .pipe(
      jshint({
        funcscope: true,
        laxbreak: true,
        loopfunc: true,
        strict: true,
        unused: "vars",
        eqnull: true,
        sub: true,
        shadow: true,
        laxcomma: true,
      })
    )
    .pipe(jshint.reporter(jshStylish))
    .pipe(jshint.reporter("fail"));
});

gulp.task("publish", function (next) {
  gulp.series("confver", "lint", "pkgver", "push", "tag", "npm", next);
});
