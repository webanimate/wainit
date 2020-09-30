#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const execa = require('execa')
const commandExists = require('command-exists')
const ora = require('ora')
const figlet = require('figlet')
const inquirer = require('inquirer')
const sanitize = require('sanitize-filename')
const githubUsernameRegex = require('github-username-regex')
let dirname

console.clear()
console.log('\n\x1b[32m' + figlet.textSync(' Wainit', { font: 'alligator2' }) + '\x1b[0m\n')

let questions = []

if (argv._[0] && argv._[0] !== sanitize(argv._[0])) {
  console.error('\x1b[31mError!\nProject name \x1b[36m' + argv._[0] + '\x1b[31m must be a valid file name!\x1b[0m')
  process.exit(1)
}
if (!argv._[0]) {
  questions.push({
    type: 'input',
    name: 'projectName',
    message: 'Project name',
    validate: (value) => {
      if (value && value === sanitize(value)) {
        dirname = path.join(process.cwd(), value)
        if (fs.existsSync(dirname)) {
          return '\x1b[31mDirectory \x1b[36m' + value + '\x1b[31m already exists!\x1b[0m'
        } else {
          return true
        }
      } else {
        return '\x1b[31mProject name must be a valid file name!\x1b[0m'
      }
    },
  })
}

const _questions = [
  {
    type: 'input',
    name: 'version',
    message: 'Version',
    default: () => {
      return '1.0.0'
    },
  },
  {
    type: 'input',
    name: 'githubUsername',
    message: 'Github username',
    validate: (value) => {
      if (githubUsernameRegex.test(value)) {
        return true
      } else {
        return '\x1b[31mEnter a valid github username!\x1b[0m'
      }
    },
  },
  {
    type: 'input',
    name: 'author',
    message: 'Author',
    validate: (value) => {
      if (value.trim()) {
        return true
      } else {
        return '\x1b[31mEnter author!\x1b[0m'
      }
    },
  },
]

questions = [...questions, ..._questions]

inquirer.prompt(questions).then((answers) => {
  const projectName = argv._[0] || answers['projectName']
  const questions = [
    {
      type: 'input',
      name: 'repository',
      message: 'Repository url',
      default: () => {
        return 'https://github.com/' + answers['githubUsername'] + '/' + projectName
      },
    },
  ]

  inquirer.prompt(questions).then((answers1) => {
    fs.mkdirSync(dirname)
    const pkg = {
      name: answers.projectName,
      version: answers.version,
      main: 'index.js',
      repository: answers1.repository,
      author: answers.author,
      license: 'MIT',
    }
    const spinner = ora(' Creating web animations project')
    spinner.start()
    fs.writeFileSync(path.join(dirname, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
    fs.writeFileSync(
      path.join(dirname, 'LICENSE'),
      `MIT License

Copyright (c) ${new Date().getFullYear()} ${answers.author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
    )
    fs.writeFileSync(path.join(dirname, 'index.js'), `export default {\n\n}\n`)
    process.chdir(dirname)
    let installYarn = ''
    commandExists('yarn')
      .catch(() => {
        installYarn = 'npm install yarn --global && '
      })
      .finally(() => {
        execa(installYarn + 'yarn && yarn add file:c:\\my\\work\\web-animations-set\\ -D && yarn web-animations-set').then(
          () => {
            spinner.succeed('\x1b[32mWeb animations project successfully created!\x1b[0m')
          },
          (error) => {
            spinner.fail('\x1b[31mError creating web animations project!\x1b[0m\n')
            console.log(error)
          }
        )
      })
  })
})