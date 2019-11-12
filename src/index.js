import L from 'leaflet';
import leaflet_mrkcls from 'leaflet.markercluster';
import style__markercluster from 'leaflet.markercluster/dist/MarkerCluster.css';
import style__leaflet from 'leaflet/dist/leaflet.css';
import { html } from 'lit-element';
// import { request__get_plug_details } from './api/integreen-life';
import { BaseClass } from './components/baseClass';
import { render__map_controls } from './components/map_controls';
import { map_tag } from './components/map_tag';
import image_logo from './icons/logo.png';
import { observed_properties } from './observed_properties';
import style__buttons from './scss/buttons.scss';
import style from './scss/main.scss';
import style__typography from './scss/typography.scss';
import utilities from './scss/utilities.scss';
import { getLatLongFromStationDetail, getStyle, get_user_platform, stationStatusMapper } from './utils';
import { get_provider_list } from './utils/get_provider_list';
import { request_stations_plugs } from './components/filter_box/api';

class EMobilityMap extends BaseClass {
  static get properties() {
    return observed_properties;
  }

  async initializeMap() {
    this.map = L.map(this.shadowRoot.getElementById('map'), { zoomControl: false }).setView(
      [this.current_location.lat, this.current_location.lng],
      13
    );
    L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
      attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>'
    }).addTo(this.map);
  }

  async drawMap() {
    this.drawUserOnMap();

    await this.request__get_stations_details();
    await this.request__get_stations_plugs_details();
    // const stations_status_types = await request_stations_status_types();
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

      /**
       *  plug_type
       */
      let filtered__station_plugs = [];
      if (this.filters.plug_type.length) {
        const station_plugs = this.all_plugs_details.filter(plug => {
          return plug.parentStation === o.scode;
        });

        filtered__station_plugs = station_plugs.filter(plug => {
          let condition = false;
          plug.outlets.map(outlet => {
            if (!condition) {
              condition = this.filters.plug_type.includes(outlet.outletTypeCode);
            }
            return undefined;
          });
          return condition;
        });
      }
      // Filter plugs and obtain the list of the of those belongs to the station

      // const station_plugs = this.all_plugs_details.filter(plug => plug.parentStation === o.id);

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

    /* PRINT filtered stations on map */
    filtered_stations_details.map(o => {
      const { smetadata, sorigin } = o;
      const marker_position = getLatLongFromStationDetail(o.scoordinate);
      // stations_status_types
      /** Creating the icon */
      const station_icon = L.icon({
        iconUrl: stationStatusMapper(smetadata.state, sorigin),
        iconSize: smetadata.state !== 'ACTIVE' && smetadata.state !== 'AVAILABLE' ? [30, 30] : [36, 36]
      });
      const marker = L.marker([marker_position.lat, marker_position.lng], {
        icon: station_icon
      });

      const action = async () => {
        this.is_loading = true;
        const station_plugs = await request_stations_plugs(o.scode);

        await this.request__near_restaurants(marker_position.lat, marker_position.lng);
        await this.request__near_accomodations(marker_position.lat, marker_position.lng);

        this.current_station = { ...o, station_plugs };
        console.log(this.current_station);
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
      try {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          if (result.state === 'granted') {
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
    await this.request_access_types();
    await this.request_plug_types();
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
