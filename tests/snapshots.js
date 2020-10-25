const fs = require('fs');
const {resolve} = require('path');
const {execSync} = require('child_process');
import {context, GitHub} from '@actions/github';
import {getInput} from '@actions/core';

const PORT = 8000;
const TEST_URL = `http://localhost:${PORT}/build`;
const webdriver = require('selenium-webdriver');

function browserTest(os, osVersion, browser, browserVersion) {
    var USERNAME = getInput('browserstackUsername', {required: true});
    var AUTOMATE_KEY = getInput('browserstackAutomateKey', {required: true});
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
        .takeScreenshot().then(
        function (image, err) {
            fs.writeFile(screenshotFolder + filename, image, 'base64', function (err) {
                console.log(`Unable to save screenshot (${filename})!`);
                console.log(err);
            });
            driver.quit();
        }
    );
}

browserTest('Windows', 7, 'IE', 11)

function commitScreenshots() {
    const githubToken = getInput('githubToken', {required: true});
    const branchName = getInput('branchName', {required: true});
    const github = new GitHub(githubToken);
    const changedFiles = execSync('git diff --name-only')
        .toString()
        .split('\n')
        .filter(Boolean);

    const parentSha = execSync('git rev-parse HEAD')
        .toString()
        .trim();

    const tree = github.git.createTree({
        owner: context.repo.owner,
        repo: context.repo.repo,
        base_tree: parentSha,
        tree: changedFiles.map(path => ({
            path,
            mode: '100644',
            content: fs.readFileSync(resolve(process.cwd(), path), 'utf8')
        }))
    });
    const commit = github.git.createCommit({
        ...context.repo,
        message: 'Update browser screenshots',
        tree: tree.data.sha,
        parents: [parentSha]
    });

    github.git.createRef({
        ...context.repo,
        ref: `refs/heads/${branchName}`,
        sha: commit.data.sha
    });

}

commitScreenshots();