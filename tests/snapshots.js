import {context, GitHub} from '@actions/github';

const fs = require('fs');
const {resolve} = require('path');
const {execSync} = require('child_process');

const PORT = 8000;
const TEST_URL = `http://localhost:${PORT}/build`;
const webdriver = require('selenium-webdriver');

function browserTest(os, osVersion, browser, browserVersion) {
    var USERNAME = process.argv.slice(2)[0];
    var AUTOMATE_KEY = process.argv.slice(2)[1];
    var browserstackURL = `https://${USERNAME}:${AUTOMATE_KEY}@hub-cloud.browserstack.com/wd/hub`;

    var capabilities = {
        'os': os,
        'os_version': osVersion,
        'browserName': browser,
        'browser_version': browserVersion,
        'name': `${os} ${osVersion} Test on ${browser} ${browserVersion}`
    }

    var screenshotFolder = 'screenshots/';
    var filename = `${os}_${osVersion}_${browser}_${browserVersion}.png`;
    var driver = new webdriver.Builder().usingServer(browserstackURL).withCapabilities(capabilities).build();

    driver.get(TEST_URL)
    driver.takeScreenshot().then(function (data) {
        fs.writeFile(screenshotFolder + filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', function (err) {
            if (err) throw err;
        });
    })
}

browserTest('Windows', 7, 'IE', 11)

async function commitScreenshots() {
    const githubToken = process.env.githubToken;
    const branchName = process.env.branchName;
    const github = new GitHub(githubToken);
    const changedFiles = execSync('git diff --name-only')
        .toString()
        .split('\n')
        .filter(Boolean);

    const parentSha = execSync('git rev-parse HEAD')
        .toString()
        .trim();

    let tree = await github.git.createTree({
        owner: context.repo.owner,
        repo: context.repo.repo,
        base_tree: parentSha,
        tree: changedFiles.map(path => ({
            path,
            mode: '100644',
            content: fs.readFileSync(resolve(process.cwd(), path), 'utf8')
        }))
    });

    const commit = await github.git.createCommit({
        ...context.repo,
        message: 'Update browser screenshots',
        tree: tree.data.sha,
        parents: [parentSha]
    });

    await github.git.createRef({
        ...context.repo,
        ref: `refs/heads/${branchName}`,
        sha: commit.data.sha
    });

}

commitScreenshots().then(r => (console.log('Done!')));