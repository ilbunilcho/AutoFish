const elt = require("./utils/elt.js");
const { ipcRenderer } = require("electron");

const renderLogo = () => {
  return elt(
    "div",
    { className: "logo" },
  );
};

const loggerMemory = [];
const renderLogger = () => {
  return {
    dom: elt("section", { className: `logger` }),
    show({ text, type }) {
      let row = elt("p", null, text);
      loggerMemory.push(row);
      if(loggerMemory.length > 100) {
        loggerMemory.shift().remove()
      }
      row.style.color = type;
      this.dom.append(row);
      this.dom.scrollTop += 30;
    },
  };
};

class AutoFish {
  constructor(settings, startButton) {
    this.settings = settings;
    this.button = startButton;
    this.logger = renderLogger();
    const premiumIcon = elt(`img`, { className: `premium_icon`, src: `img/premium.png` });
    const versionNode = elt("span");
    const donateLink = elt(
      "a",
      {
        href: `#`,
        className: "donateLink",
        onclick: () => ipcRenderer.send("open-link-donate"),
      },
      `AutoFish Premium`
    );
    const footer = elt(`p`, { className: "version" }, versionNode, donateLink, premiumIcon);

    ipcRenderer.on("set-version", (event, version) => {
      versionNode.textContent = `ver. 2.8.3 Public | `;
    });

    ipcRenderer.on('start-by-fishing-key', () => {
      if(!this.button.state) {
        this.button.dom.click();
      }
    });

    this.settings.regOnChange((config) => {
      ipcRenderer.send("save-settings", config);
    });

    this.settings.regOnClick((config) => {
      ipcRenderer.send("advanced-settings", config);
    });

    this.settings.regOnFishingZoneClick(() => {
      ipcRenderer.send("start-bot", `relZone`);
    });

    this.settings.regOnChatZoneClick(() => {
      ipcRenderer.send("start-bot", `chatZone`);
    });

    this.settings.regOnDx11(() => {
      ipcRenderer.send("dx11-warn");
    });

    this.settings.regOnWhitelistWarn(() => {
      ipcRenderer.send("whitelist-warn");
    });

    this.button.regOnStart(() => {
      ipcRenderer.send("start-bot");
    });

    this.button.regOnStop(() => {
      ipcRenderer.send("stop-bot");
    });

    ipcRenderer.on("settings-change", (settings) => {
      this.settings.config = settings;
      this.settings.render();
    });

    ipcRenderer.on("set-game", (event, game) => {
      this.settings.config.game = game;
      this.settings.reRender();
    });

    ipcRenderer.on("stop-bot", () => {
      this.button.onError();
    });

    ipcRenderer.on("log-data", (event, data) => {
      this.logger.show(data);
    });

    let settingsVisibility = true;
    let foldSettingsContainer = elt(`img`, {src: `img/unfold.png`, className: `settingsFolder`})
    foldSettingsContainer.addEventListener(`click`, (event) => {
        if(settingsVisibility) {
          this.settings.dom.style = `display: none;`;
          ipcRenderer.send(`resize-win`, {width: 341, height: 395})
          event.target.src = `img/fold.png`;
          document.querySelector(`.settings_header_fold`).style = `border-bottom: 1px solid grey; border-radius: 5px`;
        } else {
          this.settings.dom.style = `display: block`;
          ipcRenderer.send(`resize-win`, {width: 341, height: 678})
          event.target.src = `img/unfold.png`
          document.querySelector(`.settings_header_fold`).style = ``;
        }
        settingsVisibility = !settingsVisibility;
    })

    this.dom = elt(
      "div",
      { className: "AutoFish" },
      renderLogo(),
      elt(`div`, {className: `settings_profile`}, elt("p", { className: "settings_header settings_header_main settings_header_fold"}, "⚙️"), foldSettingsContainer),
      this.settings.dom,
      elt("p", { className: "settings_header settings_header_log settings_header_main" }, "📋"),
      this.logger.dom,
      this.button.dom,
      footer
    );
  }
}

module.exports = AutoFish;
