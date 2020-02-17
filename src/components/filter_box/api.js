import { t } from '../../translations';

const NINJA_BASE_PATH = 'https://mobility.api.opendatahub.bz.it/v2/api';

// export const access_types = [[1, 'PUBLIC', t.public], [2, 'PRIVATE', t.private]];
export async function request_access_types() {
  const request = await fetch(
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.accessType&where=sactive.eq.true&shownull=false&distinct=true`
  );
  const response = await request.json();
  this.access_types = response.data.map((o, i) => [
    i + 1,
    o['smetadata.accessType'],
    t[o['smetadata.accessType'].toLowerCase()]
  ]);
}

export async function request_plug_types() {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&select=smetadata.outlets&where=sactive.eq.true&shownull=false&distinct=true`
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

export async function request_stations_status_types() {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.state&where=sactive.eq.true&shownull=false&distinct=true`
    );
    const response = await request.json();

    return response.data.map(o => o['smetadata.state']);
  } catch (e) {
    return undefined;
  }
}

export async function request_stations_plugs(station_id) {
  try {
    const request = await fetch(
      `${NINJA_BASE_PATH}/flat/EChargingPlug?limit=-1&offset=0&where=sactive.eq.true,pcode.eq.${station_id}&shownull=false`
    );
    const response = await request.json();
    return response.data;
  } catch (e) {
    return undefined;
  }
}
