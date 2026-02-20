// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { t } from '../translations';
import { fetch_options, fetch_origin } from './constants';

const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.com/v2';

export async function request__plug_types() {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&select=smetadata.outlets,smetadata.connectors&where=sactive.eq.true&shownull=false&distinct=true&origin=${fetch_origin}`
    );
    const response = await request.json();

    // Extract unique outletTypeCode or standard values
    const unique = Array.from(
      new Set(
        response.data.map(o => {
          // Check if smetadata.outlets exists and has the expected structure
          if (o['smetadata.outlets'] && o['smetadata.outlets'][0] && o['smetadata.outlets'][0].outletTypeCode) {
            return o['smetadata.outlets'][0].outletTypeCode;
          }
          // Check if smetadata.connectors exists and has the expected structure
          if (o['smetadata.connectors'] && o['smetadata.connectors'][0] && o['smetadata.connectors'][0].standard) {
            return o['smetadata.connectors'][0].standard;
          }
          // Fallback to 'UNKNOWN' if neither structure is found
          return 'UNKNOWN';
        })
      )
    ).filter(v => v !== 'UNKNOWN' && v !== '700 bar small vehicles'); // Filter out 'UNKNOWN' values

    // Map the unique values to the desired format
    this.plug_types = unique.map((o, i) => {
      return [i + 1, o, o];
    });

    return undefined;
  } catch (e) {
    console.error('Error fetching plug types:', e);
    return undefined;
  }
}

// merge lists of stations by scode
function merge_by_scode(...lists_to_merge) {
  const ret = {};
  lists_to_merge.flat().forEach(e => (ret[e.scode] = { ...ret[e.scode], ...e }));
  return Object.values(ret);
}

export async function request__stations_plugs(station_id) {
  try {
    // Fetch both regular and OCPI plug statuses along with plug data
    const [all_plugs, plugs_with_data, ocpi_plugs] = await Promise.all([
      fetch(
        `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&where=sactive.eq.true,pcode.eq.\"${station_id}\"&shownull=false&origin=${fetch_origin}`
      ).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch(
        `${NINJA_BASE_PATH}/flat/EChargingPlug/echarging-plug-status/latest?select=mvalue,scode&limit=-1&offset=0&where=sactive.eq.true,pcode.eq.\"${station_id}\"&shownull=false&origin=${fetch_origin}`
      ).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch(
        `${NINJA_BASE_PATH}/flat/EChargingPlug/echarging-plug-status-ocpi/latest?select=mvalue,scode&limit=-1&offset=0&where=sactive.eq.true,pcode.eq.\"${station_id}\"&shownull=false&origin=${fetch_origin}`
      ).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    ]);

    // Combine both status sources - add null checks
    const plugs_with_data_map =
      plugs_with_data.data && plugs_with_data.data.length
        ? Object.fromEntries(plugs_with_data.data.map(e => [e.scode, e.mvalue]))
        : {};
    const ocpi_plugs_map =
      ocpi_plugs.data && ocpi_plugs.data.length
        ? Object.fromEntries(ocpi_plugs.data.map(e => [e.scode, e.mvalue]))
        : {};

    const combined_status = {
      ...plugs_with_data_map,
      ...ocpi_plugs_map
    };

    // Map the plugs with their status
    const plugs_with_status =
      all_plugs.data && all_plugs.data.length
        ? all_plugs.data.map(p => ({
            ...p,
            mvalue: combined_status[p.scode]
          }))
        : [];

    return plugs_with_status;
  } catch (e) {
    console.error('Error fetching station plugs:', e);
    return [];
  }
}

/**
 * STATIONS
 */
export async function request__get_stations_details() {
  this.is_loading = true;
  const all_stations = await (
    await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&where=sactive.eq.true,sorigin.neq.IIT&shownull=false&distinct=true&origin=${fetch_origin}`,
      fetch_options
    )
  ).json();
  const stations_with_data = await (
    await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingStation/number-available/latest?select=mvalue,scode&limit=-1&offset=0&where=sactive.eq.true,sorigin.neq.IIT&shownull=false&distinct=true&origin=${fetch_origin}`,
      fetch_options
    )
  ).json();

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

  const requestAccessibility = await fetch(
    'https://tourism.api.opendatahub.com/v1/ODHActivityPoi?tagfilter=electric%20charging%20stations&pageSize=-1'
  );
  const response = await request.json();
  const responseAccessibility = await requestAccessibility.json();

  const plugs = response.data.map(plug => {
    const accessibility = responseAccessibility.Items.find(
      i => i.Mapping && i.Mapping.mobility && plug.scode === i.Mapping.mobility.scode
    );
    return {
      ...plug,
      accessibility
    };
  });

  this.all_plugs_details = plugs;
  this.is_loading = false;
}
