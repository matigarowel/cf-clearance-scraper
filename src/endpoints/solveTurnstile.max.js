function solveTurnstileMin({ url, proxy }) {
    return new Promise(async (resolve, reject) => {

        if (!url) return reject('Missing url parameter')

        const context = await global.browser.createBrowserContext().catch(() => null);

        if (!context) return reject('Failed to create browser context')

        let isResolved = false
        const { proxyRequest } = await import('puppeteer-proxy')
        const { RequestInterceptionManager } = await import('puppeteer-intercept-and-modify-requests')

        var cl = setTimeout(async () => {
            if (!isResolved) {
                await context.close()
                reject("Timeout Error")
            }
        }, (global.timeOut || 60000))

        try {
            const page = await context.newPage();

            const client = await page.target().createCDPSession()
            const interceptManager = new RequestInterceptionManager(client)

            await page.setRequestInterception(true);

            page.on('request', async (request) => {
                try {
                    if (proxy) {
                        await proxyRequest({
                            page,
                            proxyUrl: `http://${proxy.username ? `${proxy.username}:${proxy.password}@` : ""}${proxy.host}:${proxy.port}`,
                            request,
                        });
                    } else {
                        request.continue()
                    }
                } catch (e) { }
            });

            await interceptManager.intercept(
                {
                    urlPattern: url,
                    resourceType: 'Document',
                    modifyResponse({ body }) {
                        console.log("body", body)
                        return {
                            body: String(body).replace('</body>', String(require('fs').readFileSync('./src/data/callback.html')) + '</body>')
                        }
                    },
                }
            )
            await page.goto(url, {
                waitUntil: 'domcontentloaded', timeout: global.timeOut || 3600000
            })

            await page.addScriptTag({
                content: `
                    const fingerprinttwo = document.createElement('div');
                    fingerprinttwo.id = 'fingerprinttwo';
                    fingerprinttwo.textContent = new Fingerprint({canvas: true,screen_resolution: true,ie_activex: true}).get();
                    document.body.appendChild(fingerprinttwo);

                    const fingerprintone = document.createElement('div');fingerprintone.id = 'fingerprintone';
                    fingerprintone.textContent = fingerprint;document.body.appendChild(fingerprintone);
                `
            }).then(async () => {
                let fingerprintone = await page.evaluate(() => {
                    let value = document.querySelector(`#fingerprintone`)?.textContent;
                    return value
                })

                console.log("fingerprintone", fingerprintone)

                let fingerprinttwo = await page.evaluate(() => {
                    let value = document.querySelector(`#fingerprinttwo`)?.textContent;
                    return value
                })

                console.log("fingerprinttwo", fingerprinttwo)

            }).catch((ex) => {
                console.log(ex)
            })

            // console.log("done loading page.....")

            await page.waitForSelector('[name="cf-response"]', {
                timeout: global.timeOut || 3600000
            })

            // console.log("done waitForSelector.....")

            const token = await page.evaluate(() => {
                try {
                    return document.querySelector('[name="cf-response"]').value
                } catch (e) {
                    return null
                }
            })

            // console.log("done token.....", token)
            isResolved = true
            clearInterval(cl)
            await context.close()
            console.log((!token || token.length < 10))
            if (!token || token.length < 10) return reject('Failed to get token')
            return resolve(token)
        } catch (e) {
            console.log(e)
            if (!isResolved) {
                // await context.close()
                clearInterval(cl)
                reject(e.message)
            }
        }

    })
}

module.exports = solveTurnstileMin