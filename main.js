const { app } = require('electron')
const chokidar = require('chokidar')
const fs = require('fs')
const { spawn } = require('child_process')

const appPath = app.getAppPath()
const ignoredPaths = /node_modules|[/\\]\./
// Main file poses a special case, as its changes are
// only effective when the process is restarted (hard reset)
// We assume that electron-reload is required by the main
// file of the electron application
const mainFile = module.parent.filename

/**
 * Creates a callback for hard resets.
 *
 * @param {String} eXecutable path to electron executable
 * @param {String} hardResetMethod method to restart electron
 * @returns {Function} handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable, hardResetMethod, argv) =>
  () => {
    // Detaching child is useful when in Windows to let child
    // live after the parent is killed
    const args = (argv || []).concat([appPath])
    const child = spawn(eXecutable, args, {
      detached: true,
      stdio: 'inherit'
    })
    child.unref()
    // Kamikaze!

    // In cases where an app overrides the default closing or quiting actions
    // firing an `app.quit()` may not actually quit the app. In these cases
    // you can use `app.exit()` to gracefully close the app.
    if (hardResetMethod === 'exit') {
      app.exit()
    } else {
      app.quit()
    }
  }

module.exports = (glob, options = {}) => {
  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if (eXecutable && fs.existsSync(eXecutable)) {
    const hardWatcher = chokidar.watch(mainFile, Object.assign({ ignored: [ignoredPaths] }, options))
    hardWatcher.once('change', hardResetHandler)
  } else {
    console.log('Electron could not be found. No hard resets for you!')
  }
}
