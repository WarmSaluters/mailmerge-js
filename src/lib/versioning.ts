import axios from 'axios';
import semver from 'semver';
import Config from './config.js';

// TODO: Need to implement this into cli gracefully.

export const backgroundCheckForNewVersion = async () => {
  try {
    const { data } = await axios.get(`https://registry.npmjs.org/mailmerge-js`);
    const latestVersion = data['dist-tags'].latest;

    if (semver.gt(latestVersion, Config.latestKnownVersion ?? '0.0.0')) {
       // This will be launched async so hope something else writes back
      Config.latestKnownVersion = latestVersion;
    }
  } catch (error) {
    // Unknown but ok
  }
};

export const isCurrentVersionLatest = (currentVersion: string) => {
    console.log('isCurrentVersionLatest', currentVersion, Config.latestKnownVersion);
  return semver.gt(currentVersion, Config.latestKnownVersion ?? '0.0.0');
};
