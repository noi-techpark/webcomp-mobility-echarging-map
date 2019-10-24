export const observed_properties = {
  all_stations_details: { type: Array },
  all_plugs_details: { type: Array },
  is_loading: { type: Boolean },
  current_station: { type: Object },
  current_location: { type: Object },
  showFilters: { type: Boolean },
  filters: { type: Object },
  visibleStations: { type: Number },
  searched_places: { type: Object },
  currentStarRating: { type: Number },
  showRatingModal: { type: Boolean },
  ratingModalStep: { type: Number },
  user_vote: { type: Object },
  isFullScreen: { type: Boolean },
  station_near_restaurants: { type: Object },
  station_near_accomodations: { type: Object },
  provider_list: { type: Array },
  query_nominatim: { type: String },
  details_mobile_state: { type: Boolean },
  // Parameters
  logo: { type: String },
  language: { type: String }
};
