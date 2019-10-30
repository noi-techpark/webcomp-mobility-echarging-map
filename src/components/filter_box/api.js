import { t } from '../../translations';

const NINJA_BASE_PATH = 'https://ipchannels.integreen-life.bz.it/ninja/api/v2';

// export const access_types = [[1, 'PUBLIC', t.public], [2, 'PRIVATE', t.private]];
export async function request_access_types() {
  const request = await fetch(
    // `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.state&where=sactive.eq.true&shownull=false&distinct=true`
    `${NINJA_BASE_PATH}/flat/EChargingStation?limit=-1&offset=0&select=smetadata.accessType&where=sactive.eq.true&shownull=false&distinct=true`
  );
  const response = await request.json();
  this.access_types = response.data.map((o, i) => [
    i + 1,
    o['smetadata.accessType'],
    t[o['smetadata.accessType'].toLowerCase()]
  ]);
  console.log(this.access_types);
  // return response.data;
}

export const plug_types = [
  [1, 'Type2Mennekes', 'Type 2 Mennekes'],
  [2, 'Type 3A', 'Type 3A'],
  [3, 'CHAdeMO', 'CHAdeMO'],
  [4, 'CCS', 'Type 1 CCS'],
  [5, 'Schuko', 'Schuko'],
  [6, 'Type2 - 230Vac', 'Type2 - 230Vac']
];
