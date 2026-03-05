// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import uniq from 'lodash/uniq';
import map from 'lodash/map';

const EXCLUDED_PROVIDERS = [
  '700 bar small vehicles',
  'Officina Elettrica San Vigilio di Marebbe SPA',
  'Pension Erlacher'
];

export const get_provider_list = all_stations_details => {
  return uniq(
    map(all_stations_details, station => (station.smetadata && station.smetadata.provider) || station.sorigin)
  ).filter(provider => !EXCLUDED_PROVIDERS.includes(provider));
};
