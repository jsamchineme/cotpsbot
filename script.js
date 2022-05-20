require('chromedriver');
const { Builder, By, until, Capabilities } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const delay = secs => new Promise(resolve => setTimeout(resolve, secs * 1000));
const params = require('./params');


async function run() {
  let options = new chrome.Options();

  let driver = await new Builder()
    .forBrowser('chrome')
    .withCapabilities(Capabilities.chrome())
    .setChromeOptions(options)
    .build();
  
  await driver.manage().window().maximize();

  await driver.get('https://cotps.com');

  const getElems = async (selector, secondsWaitTime = 10) => {
    return driver.wait(
      until.elementsLocated(By.css(selector)),
      secondsWaitTime * 1000,
      `Timed out after ${secondsWaitTime} seconds`,
      1000
    );
  }

  const getElem = async (selector, secondsWaitTime = 10) => {
    return driver.wait(
      until.elementLocated(By.css(selector)), 
      secondsWaitTime * 1000,
      `Timed out after ${secondsWaitTime} seconds`,
      1000
    );
  }

  await login();

  await grabCommissions();

  await startTransactions();

  async function startTransactions() {
    try {
      let hallButtons = await getElems('.uni-tabbar__bd');
      const hallButton = hallButtons[1];
      await hallButton.click();
      await getElems('.grab-list-text');
      await delay(7);
      await grabOffers();
    } catch(e) {
      await driver.quit();
    }
  }

  async function grabCommissions() {
    let tabButtons = await getElems('.uni-tabbar__bd');
    const mineButton = tabButtons[3];
    await mineButton.click();

    // click my team
    await delay(4);
    const buttons = await getElems('.menu-list');
    const myTeamButton = buttons[5];
    await myTeamButton.click();

    const levelButtons = await getElems('.tab');
    const LV1_Button = levelButtons[0];
    await LV1_Button.click();
    await delay(7);
    const receiveButton = await getElem('uni-button');
    await receiveButton.click();

    // await receive complete
    await receiveCommission();
    await delay(4);

    const LV2_Button = levelButtons[1];
    await LV2_Button.click();
    await delay(7);
    await receiveButton.click();

    await delay(4);

    const LV3_Button = levelButtons[2];
    await LV3_Button.click();
    await delay(7);
    await receiveButton.click();

    const backButton = await getElem('.uni-page-head-btn');
    await delay(5);
    await backButton.click();
    await delay(4);
    return null
  }

  async function grabOffers() {
    const orderButton = await getElem('.orderBtn');
    await orderButton.click()
    try {
      // search for the toast that shows insufficient balance
      const toast = await getElem('uni-toast', 0.1);
      
      const text = await toast.getText();
      console.log({ text })
      // The balance is lower ... disappears fast and won't be found
      // hence the condition below
      if (text == "" || text.search("failing to compete") >= 0) {
        await delay(1);
        // if found, close browser
        return driver.quit();
      }
    } catch(e) {
      // noop continue with transaction
    }

    await getElem('.fui-dialog__body');
    await delay(9);
    const uniButtons = await getElems('uni-button');
    const sellButton = uniButtons[4];

    await sellButton.click();
    
    await delay(10);
    const uniButtonsA = await getElems('uni-button');

    const confirmButton = uniButtonsA[5];

    await confirmButton.click();
    await delay(4);
    
    grabOffers();
  }

  async function receiveCommission() {
    // const 
    return null;
  }

  async function submitLogin() {
    await delay(1);
    const loginButton = await getElem('uni-button.login');
    await delay(1);
    await loginButton.click();

    try {
      await getElem('uni-view.user-info', 6); // wait for login to be complete

      await delay(2);
      // close system notification modal
      const confirmButton = await getElem('.uni-modal__btn');
      await confirmButton.click();
    } catch(e) {
      await submitLogin();
    }
  }

  async function login() {
    let tabButtons = await getElems('.uni-tabbar__bd');
    const mineButton = tabButtons[3];
 
    await mineButton.click();
  
    // If "Log in" is showing, then we should login
    const loginText = await getElem('uni-button.login');
    if (loginText) {
      // pick country code
      const uniTexts = await getElems('uni-text');
      const countryCodeButton = uniTexts[1];
    
      await countryCodeButton.click();

      let countryCodeBox = await getElem('.uni-input-input');

      const confirmCodeButton = await getElem('uni-button');
      // Enter country code
      await countryCodeBox.sendKeys(params.countryCode);
      await delay(1);
      await confirmCodeButton.click();

      let inputs = await getElems('.uni-input-input');

      const phoneNumberBox = inputs[0];
      const passwordBox = inputs[1];
      
      await phoneNumberBox.sendKeys(params.phoneNumber);
      await passwordBox.sendKeys(params.password);

      await submitLogin();
    }
  }
}

run();