import { fetch_options } from './constants';

const BASE_PATH = 'https://ipchannels.integreen-life.bz.it/emobility/rest/';
const BASE_PATH_PLUGS = 'https://ipchannels.integreen-life.bz.it/emobility/rest/plugs/';
const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.bz.it/v2/api';

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
export async function request__get_stations_plugs_ids() {
  this.is_loading = true;
  const response = await fetch(`${BASE_PATH_PLUGS}get-stations`, fetch_options);
  this.all_stations_ids = await response.json();
  this.is_loading = false;
}

export async function request__get_stations_plugs_details() {
  this.is_loading = true;
  const response = await fetch(`${BASE_PATH_PLUGS}get-station-details`, fetch_options);
  this.all_plugs_details = await response.json();
  this.is_loading = false;
}

/** Live data */
export async function request__get_station_details(id) {
  this.is_loading = true;
  const response = await fetch(`${BASE_PATH}get-newest-record?station=${id}`, fetch_options);
  this.XXX = await response.json();
  this.is_loading = false;
}

export async function request__get_plug_details(id) {
  const response = await fetch(`${BASE_PATH_PLUGS}get-newest-record?station=${id}`, fetch_options);
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}
