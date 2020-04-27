import { fetch_options } from './constants';

const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.bz.it/v2';

/**
 * STATIONS
 */
export async function request__get_stations_details() {
  this.is_loading = true;
  const request = await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&where=sactive.eq.true&shownull=false&distinct=true`,
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
    `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&shownull=false&distinct=true&where=sactive.eq.true`,
    fetch_options
  );
  const response = await request.json();
  this.all_plugs_details = response.data;
  this.is_loading = false;
}
