// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import L from 'leaflet';
import leaflet_mrkcls from 'leaflet.markercluster';
import style__markercluster from 'leaflet.markercluster/dist/MarkerCluster.css';
import style__leaflet from 'leaflet/dist/leaflet.css';
import { html, css, unsafeCSS } from 'lit-element';
import { BaseClass } from './components/baseClass';
import { render__map_controls } from './components/map_controls';
import { map_tag } from './components/map_tag';
// import { map_tag_closed } from './components/map_tag_closed';
import image_logo from './icons/logo.png';
import { observed_properties } from './observed_properties';
import style__buttons from './scss/buttons.scss';
import style from './scss/main.scss';
import style__typography from './scss/typography.scss';
import utilities from './scss/utilities.scss';
import { getLatLongFromStationDetail, get_user_platform, stationStatusMapper } from './utils';
import { get_provider_list } from './utils/get_provider_list';
import { request__stations_plugs } from './api/mobility';
import { t } from './translations';
import {styleMap} from 'lit-html/directives/style-map.js';

class EMobilityMap extends BaseClass {
  static get properties() {
    return observed_properties;
  }

  async initializeMap() {
    // closed or opens map on mobile depending on mobileFullScreen
    const map = this.shadowRoot.getElementById('map');
    console.log(this.mobileFullScreen);
    if (this.mobileFullScreen == undefined) {
      this.isFullScreen = false;
      const e_mobility_map = this.shadowRoot.getElementById('e_mobility_map');
      e_mobility_map.classList.toggle('closed');
      map.classList.toggle('closed');
    }
    this.map = L.map(map, { zoomControl: false }).setView(
      [this.current_location.lat, this.current_location.lng],
      13
    );
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '<a target="_blank" href="https://opendatahub.com">OpenDataHub.com</a> | &copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a target="_blank" href="https://carto.com/attribution">Carto</a>'
    }).addTo(this.map);
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
      const marker_position = getLatLongFromStationDetail(o.scoordinate);

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
      // console.log(o);

      /**
       * access_type
       */
      const condition_access_type = this.filters.access_type.length
        ? this.filters.access_type.includes(o.smetadata ? o.smetadata.accessType : '')
        : true;

      const station_plugs = this.all_plugs_details.filter(plug => {
        return plug.pcode === o.scode;
      });

      /**
       *  plug_type
       */
      let filtered__station_plugs = [];
      if (this.filters.plug_type.length) {
        filtered__station_plugs = station_plugs.filter(plug => {
          let condition = false;
          plug.smetadata.outlets.map(outlet => {
            if (!condition) {
              condition = this.filters.plug_type.includes(outlet.outletTypeCode);
            }
            return undefined;
          });
          return condition;
        });
      }

      const condition_plug_type = this.filters.plug_type.length ? filtered__station_plugs.length : true;

      /**
       * provider
       */
      const condition_provider = this.filters.provider.length
        ? this.filters.provider.includes(o.smetadata.provider)
        : true;

      let condition_maxPower = true;
      if (this.filters.maxPower) {
        // station_plugs;
        const outlets = station_plugs.map(plug => plug.smetadata.outlets);
        const maxPowers = outlets.flat().map(outlet => parseInt(outlet.maxPower, 10));
        if (!maxPowers.some(m => m >= this.filters.maxPower)) {
          condition_maxPower = false;
        }
      }

      const condition_availability = this.filters.availability ? o.mvalue > 0 : true;
      const condition_realtime = this.filters.realtime ? o.mvalue >= 0 : true;

      /* Merge conditions */
      return condition_access_type
        && condition_provider
        && Boolean(condition_plug_type)
        && condition_maxPower
        && condition_availability
        && condition_realtime;
    });

    /* PRINT filtered stations on map */
    filtered_stations_details.map(o => {
      const { smetadata, sorigin, mvalue } = o;
      const marker_position = getLatLongFromStationDetail(o.scoordinate);
      // stations_status_types
      /** Creating the icon */
      const station_icon = L.icon({
        iconUrl: stationStatusMapper(smetadata, mvalue, sorigin),
        iconSize: [36, 36]
      });
      const marker = L.marker([marker_position.lat, marker_position.lng], {
        icon: station_icon
      });

      const action = async () => {
        this.is_loading = true;
        const station_plugs = await request__stations_plugs(o.scode);

        await this.request__near_restaurants(marker_position.lat, marker_position.lng);
        await this.request__near_accomodations(marker_position.lat, marker_position.lng);

        this.current_station = { ...o, station_plugs };
        this.showFilters = false;
        this.is_loading = false;
      };

      marker.on('mousedown', action);

      columns_layer_array.push(marker);

      return null;
    });

    this.visibleStations = columns_layer_array.length;

    const columns_layer = L.layerGroup(columns_layer_array, {});

    /** Prepare the cluster group for station markers */
    this.layer_columns = new L.MarkerClusterGroup({
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
      try {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          if (result.state === 'granted' || result.state === 'prompt') {
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
              err => {
                this.is_loading = false;
                switch (err.code) {
                  case 1:
                    this.message = t.error_location_permission_denied[this.language];
                    break;
                  case 2:
                    this.message = t.error_location_position_unavailable[this.language];
                    break;
                  case 3:
                    this.message = t.error_location_timeout[this.language];
                    break;
                  default:
                    this.message = t.error_unknown[this.language];
                }
              }
            );
          } else {
            this.is_loading = false;
          }
        });
      } catch (error) {
        this.is_loading = false;
      }
    };
  }

  async firstUpdated() {
    this.initializeMap();
    this.drawMap();
    await this.request__access_types();
    await this.request__plug_types();
  }

  static get styles() {
    // console.log(style__markercluster);

    return css`
      ${unsafeCSS(style__markercluster)}
      ${unsafeCSS(style__leaflet.toString())}
      ${unsafeCSS(style.toString())}
      ${unsafeCSS(utilities.toString())}
      ${unsafeCSS(style__typography.toString())}
      ${unsafeCSS(style__buttons.toString())}
    `;
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
    e_mobility_map.classList.toggle('closed');
    const map = this.shadowRoot.getElementById('map');
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
    // console.log(this.map_desktop_height, this.language);
    // console.log('rerender');

    /* <style>
        ${style__markercluster}
        ${getStyle(style__leaflet)}
        ${getStyle(style)}
        ${getStyle(utilities)}
        ${getStyle(style__typography)}
        ${getStyle(style__buttons)}
      </style> */

    // console.log(style.toString());

    // <style>
    //   ${style__markercluster}
    //   ${style__leaflet.toString()}
    //   ${style.toString()}
    //   ${utilities.toString()}
    //   ${style__typography.toString()}
    //   ${style__buttons.toString()}
    // </style>
    let styles = {
      'font-family': this.fontFamily ? this.fontFamily :  "Suedtirol",
      '--w-c-font-family': this.fontFamily ? this.fontFamily :  "Suedtirol",
    };
    return html`
       <div id=${'e_mobility_map'} class="e_mobility_map platform_${get_user_platform()}" style=${styleMap(styles)}>
        ${this.render__loading_overlay()} ${this.render__message_overlay()} ${this.render__search_box_underlay()}
        <div style="z-index: 1003" class="user_actions_container__search_box">
          ${this.render__search_box()}
        </div>
        <div style="z-index: 1001" class="user_actions_container__mobile_filters">
          ${this.render__filter_values_mobile()}
        </div>

        <div
          style="${this.current_station.scode ? 'z-index: 1002;' : 'display: none;'}"
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

        ${map_tag}

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
