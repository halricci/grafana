/**
 * Placeholder packaging for the desktop entry only.
 *
 * This does not compile or launch the Grafana server. Publishing and code
 * signing are off, and this file has no certificate paths or secrets.
 * `identity: null` is electron-builder's switch for "do not sign".
 */
module.exports = {
  appId: 'com.grafana.desktop.rehearsal',
  files: ['desktop/main.cjs'],
  directories: {
    output: 'desktop/out',
  },
  extraMetadata: {
    main: 'desktop/main.cjs',
  },
  publish: null,
  npmRebuild: false,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,
  forceCodeSigning: false,
  mac: {
    identity: null,
  },
  win: {
    signAndEditExecutable: false,
  },
};
