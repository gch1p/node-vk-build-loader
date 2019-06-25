const loaderUtils = require("loader-utils");
const fs = require('fs')
const path = require('path')

/**
 * @param {String} path
 * @param {Array<String>} modules
 */
function determineModule(path, modules) {
  for (let mod of modules) {
    if (path.indexOf(`/${mod}/`) != -1) {
      return mod
    }
  }
  return false
}

/**
 * @param {Object} opts
 *   String modulesDir
 *   String platform
 *   String module
 *   String moduleFileName
 */
function getVkModulePath(opts) {
  return path.join(
    opts.modulesDir,
    opts.module,
    opts.platform,
    opts.moduleFileName
  )
}

module.exports = function(content) {
  this.cacheable && this.cacheable();
  if (!this.emitFile) {
    throw new Error("emitFile is required from module system");
  }

  if (this.query.emitFile) {
    let vkModule = determineModule(this.resourcePath, this.query.vkModules)
    if (vkModule) {
      content = fs.readFileSync(getVkModulePath({
        modulesDir: this.query.vkModulesDir,
        module: vkModule,
        moduleFileName: path.basename(this.resourcePath),
        platform: this.query.vkPlatform
      }))
    }

    let url = loaderUtils.interpolateName(this, "[hash].[ext]", {
      context: this.rootContext,
      content: content,
      //regExp: query.regExp
    });
    this.emitFile(url, content);

    let modulePath = !this.query.absolutePath
      ? '__webpack_public_path__+' + JSON.stringify(url)
      : "require('path').join(global.__dirname, __webpack_public_path__, "+JSON.stringify(url)+")"

    return "try { global.process.dlopen(module, " + modulePath + "); } catch(e) { " +
      "throw new Error('Cannot load native module ' + " + JSON.stringify(url) + " + ': ' + e); }";
  } else {
    return "try {global.process.dlopen(module, " + JSON.stringify(this.resourcePath) + "); } catch(e) {" +
      "throw new Error('Cannot open ' + " + JSON.stringify(this.resourcePath) + " + ': ' + e);}";
  }
}
module.exports.raw = true;
