import _ from 'lodash';

export const get_provider_list = all_stations_details => {
  return _.uniq(_.map(all_stations_details, 'provider'));
};
