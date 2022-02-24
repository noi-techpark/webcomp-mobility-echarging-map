import { t } from '../translations';
import { fetch_options, fetch_origin } from './constants';

const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.bz.it/v2';

export async function request__access_types() {
  const request = await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.accessType&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`
  );
  const response = await request.json();
  this.access_types = response.data.map((o, i) => [
    i + 1,
    o['smetadata.accessType'],
    t[o['smetadata.accessType'].toLowerCase()]
  ]);
}

export async function request__plug_types() {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&select=smetadata.outlets&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`
    );
    const reponse = await request.json();
    const unique = Array.from(new Set(reponse.data.map(o => o['smetadata.outlets'][0].outletTypeCode))).filter(
      v => v !== 'UNKNOWN'
    );
    this.plug_types = unique.map((o, i) => {
      return [i + 1, o, o];
    });
    return undefined;
  } catch (e) {
    return undefined;
  }
}

export async function request__stations_status_types() {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.state&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`
    );
    const response = await request.json();

    return response.data.map(o => o['smetadata.state']);
  } catch (e) {
    return undefined;
  }
}

export async function request__stations_plugs(station_id) {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&where=sactive.eq.true,pcode.eq.${station_id}&shownull=false&origin=${fetch_origin}`
    );
    const response = await request.json();
    return response.data;
  } catch (e) {
    return undefined;
  }
}


/**
 * STATIONS
 */
export async function request__get_stations_details() {
  this.is_loading = true;
  const request = await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`,
    fetch_options
  );
  const response = await request.json();
  this.all_stations_details = response.data;
  this.is_loading = false;
}

/**
 * PLUGS
 */
export async function request__get_stations_plugs_details() {
  this.is_loading = true;
  const request = await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&shownull=false&distinct=true&where=sactive.eq.true&origin=${fetch_origin}`,
    fetch_options
  );
  const response = await request.json();
  this.all_plugs_details = response.data;
  this.is_loading = false;
}
