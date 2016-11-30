const pathResolve = require('path').resolve;
const chokidar = require('chokidar');
const webpack = require('webpack');
const { createNotification } = require('../utils');
const HotServer = require('./hotServer');
const HotClient = require('./hotClient');
const ensureVendorDLLExists = require('./ensureVendorDLLExists');
const projectConfig = require('../../config/project');

class HotDevelopment {
  constructor() {
    ensureVendorDLLExists().then(() => {
      try {
        const clientConfigFactory = require('../webpack/client.config');
        const clientConfig = clientConfigFactory({ mode: 'development' });
        if (projectConfig.development.vendorDLL.enabled) {
          // Install the vendor DLL plugin.
          clientConfig.plugins.push(
            new webpack.DllReferencePlugin({
              manifest: require(
                pathResolve(
                  projectConfig.client.outputPath,
                  `${projectConfig.development.vendorDLL.name}.json`
                )
              ),
            })
          );
        }
        this.clientCompiler = webpack(clientConfig);

        const serverConfigFactory = require('../webpack/server.config');
        const serverConfig = serverConfigFactory({ mode: 'development' });
        this.serverCompiler = webpack(serverConfig);
      } catch (err) {
        createNotification({
          title: 'development',
          level: 'error',
          message: 'Webpack configs are invalid, please check the console for more information.',
        });
        console.log(err);
        return;
      }

      this.start();
    }).catch((err) => {
      createNotification({
        title: 'vendorDLL',
        level: 'error',
        message: 'Unfortunately an error occured whilst trying to build the vendor dll used by the development server. Please check the console for more information.',
      });
      if (err) {
        console.log(err);
      }
    });
  }

  start() {
    let serverStarted = false;

    this.clientCompiler.plugin('done', (stats) => {
      if (!stats.hasErrors() && !serverStarted) {
        serverStarted = true;
        this.serverBundle = new HotServer(this.serverCompiler);
      }
    });

    this.clientBundle = new HotClient(this.clientCompiler);
  }

  dispose() {
    const safeDisposer = bundle => () => (bundle ? bundle.dispose() : Promise.resolve());
    const safeDisposeClient = safeDisposer(this.clientBundle);
    const safeDisposeServer = safeDisposer(this.serverBundle);

    return safeDisposeClient()
      .then(() => console.log('disposed client'))
      .then(safeDisposeServer);
  }
}

let hotDevelopment = new HotDevelopment();

// Any changes to our webpack configs should restart the development server.
const watcher = chokidar.watch(
  pathResolve(__dirname, '../webpack')
);
watcher.on('ready', () => {
  watcher.on('change', () => {
    createNotification({
      title: 'webpack',
      level: 'warn',
      message: 'Webpack configs have changed. The development server is restarting...',
    });
    hotDevelopment.dispose().then(() => {
      // Make sure our new webpack configs aren't in the module cache.
      Object.keys(require.cache).forEach((modulePath) => {
        if (modulePath.indexOf('webpack') !== -1) {
          delete require.cache[modulePath];
        }
      });

      // Create a new development server.
      hotDevelopment = new HotDevelopment();
    });
  });
});

// If we receive a kill cmd then we will first try to dispose our listeners.
process.on('SIGTERM', () => hotDevelopment.dispose().then(() => process.exit(0)));
