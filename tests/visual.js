const PercyScript = require('@percy/script');
const httpServer = require('http-server');

const PORT = 8000;
const TEST_URL = `http://localhost:${PORT}/build`;

PercyScript.run(async (page, percySnapshot) => {
    let server = httpServer.createServer();
    server.listen(PORT);

    console.log(`Server started at ${TEST_URL}`);

    await page.goto(TEST_URL);
    await percySnapshot('Homepage', {widths: [768, 992, 1200]});

    server.close();
});