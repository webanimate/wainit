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
const validateNpmPackageName = require('validate-npm-package-name')
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
      if (value && value === sanitize(value) && validateNpmPackageName(value).validForNewPackages) {
        dirname = path.join(process.cwd(), value)
        if (fs.existsSync(dirname)) {
          return '\x1b[31mDirectory \x1b[36m' + value + '\x1b[31m already exists!\x1b[0m'
        } else {
          return true
        }
      } else {
        return '\x1b[31mProject name contains invalid charachters!\x1b[0m'
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
      name: 'outputName',
      message: 'Global variable name',
      default: () => {
        return answers['projectName'].replace(/\W/g, '')
      },
    },
    {
      type: 'input',
      name: 'repository',
      message: 'Repository url',
      default: () => {
        return 'https://github.com/' + answers['githubUsername'] + '/' + projectName
      },
    },
    {
      type: 'input',
      name: 'homepage',
      message: 'Homepage url',
      default: () => {
        return 'https://github.com/' + answers['githubUsername'] + '/' + projectName + '#readme'
      },
    },
  ]

  inquirer.prompt(questions).then((answers1) => {
    fs.mkdirSync(dirname)
    const pkg = {
      name: answers.projectName,
      outputName: answers1.outputName,
      version: answers.version,
      main: 'index.js',
      repository: answers1.repository,
      homepage: answers1.homepage,
      author: answers.author,
      license: 'MIT',
      scripts: {
        test: 'web-animations-set',
        w: 'web-animations-set',
        up: 'yarn upgrade-interactive && ncu -i && yarn',
      },
    }
    const spinner = ora(' Creating web animations project')
    spinner.start()

    fs.writeFileSync(path.join(dirname, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
    fs.copyFileSync(path.join(__dirname, '.gitignore'), path.join(dirname, '.gitignore'))

    const license = fs.readFileSync(path.join(__dirname, 'LICENSE'), 'utf-8')
    fs.writeFileSync(path.join(dirname, 'LICENSE'), license.replace('{{year}}', new Date().getFullYear()).replace('{{author}}', answers.author))

    fs.copyFileSync(path.join(__dirname, 'index.example.js'), path.join(dirname, 'index.js'))
    fs.copyFileSync(path.join(__dirname, 'README.template.md'), path.join(dirname, 'README.template.md'))
    process.chdir(dirname)
    let installYarn = ''
    commandExists('yarn')
      .catch(() => {
        installYarn = 'npm install yarn --global && '
      })
      .finally(() => {
        // spinner.succeed('\x1b[32mWeb animations project successfully created!\x1b[0m')
        execa(installYarn + 'yarn && yarn add file:c:\\my\\work\\web-animations-set\\ -D && yarn web-animations-set', { stdio: 'inherit' }).then(
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
