// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { t } from '../translations';
import { fetch_options, fetch_origin } from './constants';

const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.com/v2';

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

// merge lists of stations by scode
function merge_by_scode(...lists_to_merge) {
  const ret = {};
  lists_to_merge.flat().forEach(e => ret[e.scode] = {...ret[e.scode], ...e});
  return Object.values(ret);
}

export async function request__stations_plugs(station_id) {
  try {
    const all_plugs = await (await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&where=sactive.eq.true,pcode.eq.${station_id}&shownull=false&origin=${fetch_origin}`
    )).json();
    const plugs_with_data = await (await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug/echarging-plug-status/latest?select=mvalue,scode&limit=-1&offset=0&where=sactive.eq.true,pcode.eq.${station_id}&shownull=false&origin=${fetch_origin}`
    )).json();

    return merge_by_scode(all_plugs.data, plugs_with_data.data);
  } catch (e) {
    return undefined;
  }
}

/**
 * STATIONS
 */
export async function request__get_stations_details() {
  this.is_loading = true;
  const all_stations = await(await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`,
    fetch_options
  )).json();
  const stations_with_data = await(await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation/number-available/latest?select=mvalue,scode&limit=-1&offset=0&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`,
    fetch_options
  )).json();

  this.all_stations_details = merge_by_scode(all_stations.data, stations_with_data.data);
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
