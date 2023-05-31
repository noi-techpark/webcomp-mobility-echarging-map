// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import uniq from 'lodash/uniq';
import map from 'lodash/map';

export const get_provider_list = all_stations_details => {
  return uniq(map(all_stations_details, 'smetadata.provider'));
};
