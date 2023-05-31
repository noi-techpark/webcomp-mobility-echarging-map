// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import L from 'leaflet';
import { LitElement } from 'lit-element';
import { request__get_stations_details, request__get_stations_plugs_details, request__access_types, request__plug_types } from '../api/mobility';
import { request__get_coordinates_from_search } from '../api/nominatim';
import { request__near_accomodations, request__near_restaurants } from '../api/tourism';
import { TOKEN } from '../config';
import user__marker from '../icons/user.png';
import { render__details_box } from './details_box';
import { render__filter_box } from './filter_box';
import { render__filter_values_mobile } from './filter_values_mobile';
import { render__modal__star_rating } from './modal__star_rating';
import { render__loading_overlay } from './overlay_loading';
import { render__message_overlay } from './overlay_msg';
import { render__search_box } from './search_box';
import { render__search_box_underlay } from './search_box_underlay';

export class BaseClass extends LitElement {
  constructor() {
    super();
    this.all_stations_ids = [];
    this.all_stations_details = [];
    this.all_plugs_details = [];
    this.current_station = {};
    this.userMarker = null;
    this.is_loading = false;
    this.current_location = { lat: 46.479, lng: 11.331 };
    this.showFilters = false;
    this.filters = {
      radius: 0,
      access_type: [],
      plug_type: [],
      state: [],
      provider: [],
      maxPower: 0
    };
    this.visibleStations = 0;
    this.searched_places = [];
    this.ratingModalStep = 0;
    this.showRatingModal = false;
    this.token = TOKEN;
    this.isFullScreen = true;
    this.station_near_restaurants = [];
    this.station_near_accomodations = [];
    this.provider_list = [];
    this.query_nominatim = '';
    this.details_mobile_state = false;
    this.access_types = [];
    this.plug_types = [];
    /* Parameters */
    const [language] = (window.navigator.userLanguage || window.navigator.language).split('-');
    this.language = language;
    /* Bindings */
    this.render__search_box = render__search_box.bind(this);
    this.render__details_box = render__details_box.bind(this);
    this.render__loading_overlay = render__loading_overlay.bind(this);
    this.render__message_overlay = render__message_overlay.bind(this);
    this.render__modal__star_rating = render__modal__star_rating.bind(this);
    this.render__filter_box = render__filter_box.bind(this);
    this.render__filter_values_mobile = render__filter_values_mobile.bind(this);
    this.render__search_box_underlay = render__search_box_underlay.bind(this);
    this.request__access_types = request__access_types.bind(this);
    this.request__plug_types = request__plug_types.bind(this);
    /* Requests */
    this.request__get_stations_details = request__get_stations_details.bind(this);
    this.request__get_stations_plugs_details = request__get_stations_plugs_details.bind(this);
    this.request__get_coordinates_from_search = request__get_coordinates_from_search.bind(this);
    this.request__near_restaurants = request__near_restaurants.bind(this);
    this.request__near_accomodations = request__near_accomodations.bind(this);
  }

  drawUserOnMap() {
    /**
     * User Icon
     */
    const user_icon = L.icon({
      iconUrl: user__marker,
      iconSize: [25, 25]
    });
    const user = L.marker([this.current_location.lat, this.current_location.lng], {
      icon: user_icon
    });
    /**
     * Circle around the user
     */
    const circle = L.circle([this.current_location.lat, this.current_location.lng], {
      radius: this.filters.radius * 1000,
      color: 'rgba(66, 133, 244, 0.6)',
      fillColor: 'rgba(66, 133, 244, 0.5)',
      weight: 1
    });
    /**
     * Add to map
     */
    this.layer_user = L.layerGroup([user, circle], {});
    this.layer_user.addTo(this.map);
  }
}
