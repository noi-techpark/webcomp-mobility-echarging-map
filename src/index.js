import L from 'leaflet';
import leaflet_mrkcls from 'leaflet.markercluster';
import style__markercluster from 'leaflet.markercluster/dist/MarkerCluster.css';
import style__leaflet from 'leaflet/dist/leaflet.css';
import { html, LitElement } from 'lit-element';
import {
  request__get_plug_details,
  request__get_stations_details,
  request__get_stations_plugs_details
} from './api/integreen-life';
import { request__get_coordinates_from_search } from './api/nominatim';
import { request__near_accomodations, request__near_restaurants } from './api/odh';
import { render__details_box } from './components/details_box';
import { render__filter_box } from './components/filter_box';
import { render__filter_values_mobile } from './components/filter_values_mobile';
import { render__map_controls } from './components/map_controls';
import { render__modal__star_rating } from './components/modal__star_rating';
import { render__loading_overlay } from './components/overlay_loading';
import { render__search_box } from './components/search_box';
import { render__search_box_underlay } from './components/search_box_underlay';
import image_logo from './icons/logo.png';
import user__marker from './icons/user.png';
import { observed_properties } from './observed_properties';
import style__buttons from './scss/buttons.scss';
import style from './scss/main.scss';
import style__typography from './scss/typography.scss';
import utilities from './scss/utilities.scss';
import { getLatLongFromStationDetail, getStyle, get_user_platform, stationStatusMapper } from './utils';
import { get_provider_list } from './utils/get_provider_list';

class EMobilityMap extends LitElement {
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
      provider: []
    };
    this.visibleStations = 0;
    this.searched_places = [];
    this.ratingModalStep = 0;
    this.showRatingModal = false;
    this.user_vote = {
      stars: 0,
      comment: '',
      image: ''
    };
    this.token =
      'sEC19pcMqIYbZ2s-IGFOAkyKyPKNpS4NxJG_jfkEDyDI_YgVOYYK664Wp5E9_A8aDtHBv3YB9Zmi3Suv3Nu6u1WB3D-Bpi-dMdXDrOnTCdp3X0gr9wsMqoqxaiBnm9CE5Qc02pyFY2kA2N3dgx0LafdfFP0zrd7a_ybz3IMFPJS-DJeMp4MzvMF3zbS2P-oxelf7ZnU5T7280Dd7cFiFzCPX2m8vWFAs2C4k7V4hUFG05KB2X7b-wW1iP9hAtU2mKs4EX538eWMLE4fYa6kJfTdWMfo99TdyNmZTwqJXCUeKmbzFJdtInLgZCW5rfkQEinBn09Y6tjMc-FAIe-4OjK3fICxWeVEymd67pYWb3ag5hRcL0g3l93lJUFG_IXQL-WrF88aXCbcgbxAaWU07kMRBjY5PCYPZTKNQ0ekbKtC4dHxGXefJijsry64Dn8GKweBwA9qO1dJUge117htkxVb4AECsAE9JIrV0S05MYCbEV8Ar1N2an-G1lRPlUVENIaj4xhV34x0-cXjTVmiyvXC5uwRl1ayJLiWBBFYZpjc';
    this.isFullScreen = false;
    this.station_near_restaurants = [];
    this.station_near_accomodations = [];
    this.provider_list = [];
    this.query_nominatim = '';
    this.details_mobile_state = false;
    /* Bindings */
    this.render__search_box = render__search_box.bind(this);
    this.render__details_box = render__details_box.bind(this);
    this.render__loading_overlay = render__loading_overlay.bind(this);
    this.render__modal__star_rating = render__modal__star_rating.bind(this);
    this.render__filter_box = render__filter_box.bind(this);
    this.render__filter_values_mobile = render__filter_values_mobile.bind(this);
    this.render__search_box_underlay = render__search_box_underlay.bind(this);
    /* Requests */
    this.request__get_stations_details = request__get_stations_details.bind(this);
    this.request__get_stations_plugs_details = request__get_stations_plugs_details.bind(this);
    this.request__get_coordinates_from_search = request__get_coordinates_from_search.bind(this);
    this.request__near_restaurants = request__near_restaurants.bind(this);
    this.request__near_accomodations = request__near_accomodations.bind(this);
    /* Parameters */
    const [language] = (window.navigator.userLanguage || window.navigator.language).split('-');
    this.language = language;
  }

  static get properties() {
    return observed_properties;
  }

  async initializeMap() {
    this.map = L.map(this.shadowRoot.getElementById('map'), { zoomControl: false }).setView(
      [this.current_location.lat, this.current_location.lng],
      13
    );
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);
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

  async drawMap() {
    this.drawUserOnMap();

    await this.request__get_stations_details();
    await this.request__get_stations_plugs_details();
    this.provider_list = get_provider_list(this.all_stations_details);

    /**
     * Render stations markers
     */
    const columns_layer_array = [];
    /**
     * Apply filters:
     */
    let filtered_stations_details = this.all_stations_details.filter(o => {
      /**
       * radius
       */
      const marker_position = getLatLongFromStationDetail(o);
      const distance = L.latLng([this.current_location.lat, this.current_location.lng]).distanceTo([
        marker_position.lat,
        marker_position.lng
      ]);

      if (!this.filters.radius) {
        return true;
      }
      return distance / 1000 < this.filters.radius;
    });

    filtered_stations_details = filtered_stations_details.filter(o => {
      /**
       * access_type
       */
      const condition_access_type = this.filters.access_type.length
        ? this.filters.access_type.includes(o.accessType)
        : true;
      /**
       *  plug_type
       */
      const station_plugs = this.all_plugs_details.filter(plug => plug.parentStation === o.id);
      const filtered__station_plugs = station_plugs.filter(plug => {
        let condition = false;
        plug.outlets.map(outlet => {
          if (!condition) {
            condition = this.filters.plug_type.includes(outlet.outletTypeCode);
          }
          return undefined;
        });
        return condition;
      });
      /**
       * provider
       */
      const condition_provider = this.filters.provider.length ? this.filters.provider.includes(o.provider) : true;

      const condition_plug_type = this.filters.plug_type.length ? filtered__station_plugs.length : true;
      if (this.filters.state.length) {
        /* state TODO: this can disrupt performances */
        // let plugs_status = [];
        // for (let i = 0; i < station_plugs.length; i++) {
        //   const element = station_plugs[i];
        //   const response = await request__get_plug_details(element.id);
        //   plugs_status.push(response);
        // }
      }

      /* Merge conditions */
      return condition_access_type && condition_provider && Boolean(condition_plug_type);
    });

    /* Print filtered stations on map */
    filtered_stations_details.map(o => {
      const marker_position = getLatLongFromStationDetail(o);
      /** Creating the icon */
      const station_icon = L.icon({
        iconUrl: stationStatusMapper(o.state, o.origin),
        iconSize: o.state !== 'ACTIVE' && o.state !== 'AVAILABLE' ? [30, 30] : [36, 36]
      });
      const marker = L.marker([marker_position.lat, marker_position.lng], {
        icon: station_icon
      });

      const action = async () => {
        this.is_loading = true;
        const station_plugs = this.all_plugs_details.filter(plug => plug.parentStation === o.id);

        const plugs_status = [];
        for (let i = 0; i < station_plugs.length; i++) {
          const element = station_plugs[i];
          const response = request__get_plug_details(element.id);
          plugs_status.push(response);
        }

        await Promise.all(plugs_status);
        await this.request__near_restaurants(marker_position.lat, marker_position.lng);
        await this.request__near_accomodations(marker_position.lat, marker_position.lng);

        this.current_station = { ...o, station_plugs, plugs_status };
        this.showFilters = false;
        this.is_loading = false;
      };

      marker.on('mousedown', action);

      columns_layer_array.push(marker);

      return undefined;
    });

    this.visibleStations = columns_layer_array.length;
    const columns_layer = L.layerGroup(columns_layer_array, {});

    /** Prepare the cluster group for station markers */
    this.layer_columns = new leaflet_mrkcls.MarkerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction(cluster) {
        return L.divIcon({
          html: `<div class="marker_cluster__marker">${cluster.getChildCount()}</div>`,
          iconSize: L.point(36, 36)
        });
      }
    });
    /** Add maker layer in the cluster group */
    this.layer_columns.addLayer(columns_layer);
    /** Add the cluster group to the map */
    this.map.addLayer(this.layer_columns);

    /** Handle zoom */
    const btnZoomIn = this.shadowRoot.getElementById('zoomMapIn');
    const btnZoomOut = this.shadowRoot.getElementById('zoomMapOut');
    const btnCenterMap = this.shadowRoot.getElementById('centerMap');
    btnZoomIn.onclick = () => {
      this.map.setZoom(this.map.getZoom() + 1);
    };
    btnZoomOut.onclick = () => {
      this.map.setZoom(this.map.getZoom() - 1);
    };
    btnCenterMap.onclick = () => {
      this.is_loading = true;
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          this.current_location = { lat: latitude, lng: longitude };
          this.current_station = {};
          this.showFilters = false;
          this.map.flyTo([latitude, longitude], 15);
          this.map.removeLayer(this.layer_columns);
          this.map.removeLayer(this.layer_user);
          this.drawMap();
          this.is_loading = false;
        },
        () => {}
      );
    };
  }

  async firstUpdated() {
    this.initializeMap();
    this.drawMap();
  }

  handleToggleShowFilters() {
    /** Closing details box */
    const user_actions_container__details = this.shadowRoot.getElementById('user_actions_container__details');
    if (user_actions_container__details) {
      user_actions_container__details.classList.remove('open');
    }
    this.current_station = {};

    /** Closing the places results box */
    if (this.searched_places.length && !this.showFilters) {
      this.searched_places = [];
    }
    this.showFilters = !this.showFilters;
  }

  handleFullScreenMap() {
    const e_mobility_map = this.shadowRoot.getElementById('e_mobility_map');
    const map = this.shadowRoot.getElementById('map');
    e_mobility_map.classList.toggle('closed');
    map.classList.toggle('closed');

    if (this.isFullScreen) {
      try {
        document.body.exitFullscreen();
      } catch (error) {
        try {
          document.webkitExitFullscreen();
        } catch (e_webkit) {
          try {
            document.body.cancelFullScreen();
          } catch (e_moz) {
            /* continue regardless of error */
          }
        }
      }
    } else {
      try {
        document.body.requestFullscreen();
      } catch (error) {
        try {
          document.body.webkitRequestFullscreen();
        } catch (e_webkit) {
          try {
            document.body.mozRequestFullScreen();
          } catch (e_moz) {
            /* continue regardless of error */
          }
        }
      }
    }

    this.map.invalidateSize(true);
    this.isFullScreen = !this.isFullScreen;
  }

  render() {
    return html`
      <style>
        ${style__markercluster}
        ${getStyle(style__leaflet)}
        ${getStyle(style)}
        ${getStyle(utilities)}
        ${getStyle(style__typography)}
        ${getStyle(style__buttons)}
      </style>
      <div id=${'e_mobility_map'} class="e_mobility_map closed platform_${get_user_platform()}">
        ${this.render__loading_overlay()} ${this.render__search_box_underlay()}
        <div style="z-index: 1003" class="user_actions_container__search_box">
          ${this.render__search_box()}
        </div>
        <div style="z-index: 1001" class="user_actions_container__mobile_filters">
          ${this.render__filter_values_mobile()}
        </div>

        <div
          style="${this.current_station.id ? 'z-index: 1002;' : 'display: none;'}"
          class="user_actions_container"
          id="user_actions_container__details"
        >
          ${this.render__details_box()}
        </div>
        <div
          style="${this.showFilters ? 'z-index: 1001;' : 'display: none;'}"
          class="user_actions_container open"
          id="user_actions_container__filters"
        >
          ${this.render__filter_box()}
        </div>

        <div id="map" class="map closed"></div>

        <div class="logo_container">
          <div class="img" style="background-image: url(${this.logo ? this.logo : image_logo})"></div>
        </div>

        ${render__map_controls(this.isFullScreen, this.handleFullScreenMap)}
        ${this.showRatingModal ? this.render__modal__star_rating() : null}
      </div>
    `;
  }
}

if (!window.customElements.get('e-mobility-map-widget')) {
  window.customElements.define('e-mobility-map-widget', EMobilityMap);
}

/*
 ${this.searched_places.length
          ? html`
              <div
                @click=${() => {
                  this.searched_places = [];
                }}
                class="search_box__resoult_list__underlay"
              ></div>
            `
          : null}
        ${!this.searched_places.length && this.query_nominatim.length
          ? html`
              <div
                @click=${() => {
                  this.query_nominatim = '';
                }}
                class="search_box__resoult_list__underlay"
              ></div>
            `
          : null}
 */
