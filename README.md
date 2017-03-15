# keepass-http-client

## Synopsis

Node.js module to retrieve credentials from KeepPass, using the KeePassHTTP plugin. It uses native ES2015 Promises to easily plug into a gulp task.

## Code Example

Basic usage:

    keepass.itl({ url: 'example.com' })
      .then(results => console.log(results))
      .catch(error => console.error(error));

With gulp:

    const gulp = require('gulp');
    const util = require('gulp-util');
    const keepass = require('keepass-http-client');
    const exec = require('child-process-promise').exec;

    gulp.task('deploy', function() {
      return keepass.itl({ url: 'www.example.com' })
          .then((results) => {
            if (!results['Entries'] || !results['Entries'].length) {
              throw new Error('Unable to retrieve credentials');
            } else {
              return results['Entries'][0]['Password'];
            }
          })
          .then((password) => exec(`deploy-cmd -username "user@example.com" -password "${password}"`))
          .then((result) => {
            util.log(result.stdout);
            util.log(result.stderr);
          });
    });

## Installation

  `npm install keepass-http-client`

## Tests

  `npm test`

## Links

 * [KeePass](http://keepass.info/)
 * [KeePassHTTP](https://github.com/pfn/keepasshttp)

## License

The MIT License (MIT)

Copyright (c) 2017 Michoel Chaikin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.