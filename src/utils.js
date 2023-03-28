import icon__hydrogen_marker from './icons/blue/hydrogen@2x.png';
import icon__green_marker from './icons/green/green@2x.png';
import icon__teal_marker from './icons/teal/teal_lightning.png';
import icon__orange_marker from './icons/orange/orange@2x.png';
import icon__grey_marker from './icons/grey/grey@2x.png';
import icon__unknown_marker from './icons/grey/grey_exclamation.png';
import icon__red_marker from './icons/red/red@2x.png';

import icon__lock_hydrogen_marker from './icons/blue/blue_lock.png';
import icon__lock_green_marker from './icons/green/green_lock.png';
import icon__lock_teal_marker from './icons/teal/teal_lock.png';
import icon__lock_grey_marker from './icons/grey/grey_lock.png';
import icon__lock_red_marker from './icons/red/red_lock.png';
import icon__lock_orange_marker from './icons/orange/orange_lock.png';

import icon__star_hydrogen_marker from './icons/blue/blue_star.png';
import icon__star_green_marker from './icons/green/green_star.png';
import icon__star_teal_marker from './icons/teal/teal_star.png';
import icon__star_grey_marker from './icons/grey/grey_star.png';
import icon__star_red_marker from './icons/red/red_star.png';
import icon__star_orange_marker from './icons/orange/orange_star.png';

export function getLatLongFromStationDetail(o) {
  return { lat: o.y, lng: o.x };
}

export function stationStatusMapper(smetadata, mvalue, origin) {
  if (smetadata) {
    const { accessType, capacity } = smetadata;
    let tmpobj = {};
    switch (accessType) {
      case 'PRIVATE':

        let iconLock = null;

        if (mvalue == 0) {
          iconLock = icon__lock_red_marker;
        } else if(mvalue > 0) {
          iconLock = capacity == mvalue ? icon__lock_green_marker : icon__lock_orange_marker;
        } else {
          iconLock = icon__lock_teal_marker;
        }

        tmpobj = {
          TEMPORARYUNAVAILABLE: icon__lock_grey_marker,
          AVAILABLE: origin !== 'IIT' ? iconLock : icon__lock_hydrogen_marker,
          ACTIVE: origin !== 'IIT' ? iconLock : icon__lock_hydrogen_marker,
          UNKNOWN: icon__unknown_marker
        };
        break;
      case 'PRIVATE_WITHPUBLICACCESS':
        let iconStar = null;

        if (mvalue == 0) {
          iconStar = icon__star_red_marker;
        } else if (mvalue > 0) {
          iconStar = capacity == mvalue ? icon__star_green_marker : icon__star_orange_marker;
        } else {
          iconStar = icon__star_teal_marker;
        }

        tmpobj = {
          TEMPORARYUNAVAILABLE: icon__star_grey_marker,
          AVAILABLE: origin !== 'IIT' ? iconStar : icon__star_hydrogen_marker,
          ACTIVE: origin !== 'IIT' ? iconStar : icon__star_hydrogen_marker,
          UNKNOWN: icon__unknown_marker
        };
        break;
      case 'PUBLIC':
      default:
        let icon = null;

        if (mvalue == 0) {
          icon = icon__red_marker;
        } else if (mvalue > 0) {
          icon = capacity == mvalue ? icon__green_marker : icon__orange_marker;
        } else {
          icon = icon__teal_marker;
        }

        tmpobj = {
          TEMPORARYUNAVAILABLE: icon__grey_marker,
          AVAILABLE: origin !== 'IIT' ? icon : icon__hydrogen_marker,
          ACTIVE: origin !== 'IIT' ?  icon : icon__hydrogen_marker,
          UNKNOWN: icon__unknown_marker
        };
        break;
    }
    const obj = tmpobj;
    return obj[smetadata.state] ? obj[smetadata.state] : icon__unknown_marker;
  }
  return icon__unknown_marker;
}

export function debounce(delay, fn) {
  let timerId;
  return (...args) => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
}

export const getStyle = (array, map_desktop_height) => {
  const style = array[0][1];
  const configuredStyle = style.replace(new RegExp('"PLACEHOLDER_MAP_DESKTOP_HEIGHT"', 'g'), `${map_desktop_height}px`);
  return configuredStyle;
};

export const utils_truncate = (str, no_words) => {
  if (str == null) {
    return null;
  }
  const splitted = str.split(' ');

  if (splitted.length > no_words) {
    return `${splitted.splice(0, no_words).join(' ')}...`;
  }
  return splitted.splice(0, no_words).join(' ');
};

export const encodeXml = s => {
  if (s == null) {
    return null;
  }
  const words = s.replace('&amp;', '&');

  return words
    .replace('&quot;', '"')
    .replace('&#x9;', ' \t ')
    .replace('&#xA;', ' \n ')
    .replace('#xA;', ' \n ')
    .replace('&#xD;', ' \r ')
    .replace('#xD;', ' \r ')
    .replace('&&', '');
};

export const get_user_platform = () => {
  let platform = '';
  if (/windows phone/i.test(navigator.userAgent)) {
    platform = 'Windows Phone';
  }
  if (/android/i.test(navigator.userAgent)) {
    platform = 'Android';
  }
  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    platform = 'iOS';
  }
  return platform;
};
