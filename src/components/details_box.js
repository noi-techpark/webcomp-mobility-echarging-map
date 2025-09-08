// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import icon__card from '../icons/card.png';
import icon__close from '../icons/close@2x.png';
import icon__down from '../icons/down.svg';
import icon__green_dot from '../icons/green/green_dot.png';
import icon__grey_dot_question from '../icons/grey/grey_dot_question.png';
import icon_hotel_green from '../icons/green/icon_hotel_green.png';
import icon_restaurant_green from '../icons/green/icon_restaurant_green.png';
import icon__info from '../icons/info.png';
import icon__pin from '../icons/pin.png';
import icon__red_dot from '../icons/red/red_dot.png';
import icon__grey_dot from '../icons/grey/grey_dot.png';
import icon__teal_info from '../icons/teal/teal_info.png';
import icon__type_1 from '../icons/type_1.png';
import icon__up from '../icons/up.svg';
import style from '../scss/details_box.scss';
import { t } from '../translations';
import { encodeXml, getStyle, stationStatusMapper, utils_truncate } from '../utils';
import { initialize_swipe } from '../utils/swipe_box';
import { render__hours_section } from './details_box/hours_section';
import { render__rating_section } from './details_box/rating_section';
import { render__state_label } from './state_label';
import { render__h1 } from './typography';
import { providerWebsites } from '../providers';

export function render__details_box() {
  const { smetadata, sname, scoordinate, accessInfo, mvalue } = this.current_station;
  const { sorigin } = this.current_station;

  // Convert unicode characters to strings like \u00df for ß in "Straße"
  const address = smetadata != undefined && smetadata.address != undefined ? smetadata.address.replace(/\\u[\dA-F]{4}/gi, function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  }) : null;

  const user_actions_container__details = this.shadowRoot.getElementById('user_actions_container__details');
  const details_box__expand_handle__details = this.shadowRoot.getElementById('details_box__expand_handle__details');

  if (user_actions_container__details && details_box__expand_handle__details) {
    const binded_initialize_swipe = initialize_swipe.bind(this);
    binded_initialize_swipe(details_box__expand_handle__details, user_actions_container__details);
  }

  this.render__rating_section = render__rating_section.bind(this);

  // Handle missing state and accessType
  const state = (smetadata && smetadata.state) || 'UNKNOWN'; // Default to 'UNKNOWN' if state is missing
  const accessType = (smetadata && smetadata.accessType) || 'UNKNOWN'; // Default to 'UNKNOWN' if accessType is missing
  const payment_link = "https://www.neogy.it/en/public-network-charging/direct-payment.html";
  const operator = (smetadata && smetadata.provider) || 'UNKNOWN';

  return html`
    <style>
      ${getStyle(style)}
    </style>
    <div class="details_box">
      <div id="details_box__expand_handle__details" class="details_box__expand_handle pt-2 pb-2 d-sm-none">
        ${this.details_mobile_state ? unsafeHTML(icon__down) : unsafeHTML(icon__up)}
      </div>
      <div class="details_box__header">
        ${smetadata
          ? html`
              ${render__state_label(state, this.language)}
            `
          : undefined
        }
        <div
          class="details_box__close_button"
          @click="${() => {
            user_actions_container__details.classList.remove('open');
            this.current_station = {};
          }}"
        >
          <img src="${icon__close}" alt="" />
        </div>
      </div>
      <div class="details_box__body">
        <!-- Station name detail box -->
        <div class="details_box__section mt-3">
          ${render__h1(sname, stationStatusMapper(smetadata, mvalue, sorigin))}
          <div class="col-12">
            <p class="color-black-300 mt-2 fw-300">${address}</p>
            <p class="color-black-300 fw-300">${this.current_station.municipality}</p>
            ${this.render__rating_section()}
            ${scoordinate
              ? html`
                  <a
                    href="${`https://www.google.com/maps/dir/${scoordinate.y},${scoordinate.x}/${this.current_location.lat},${this.current_location.lng}`}"
                    target="_blank"
                    class="color-green fs-16 fw-300 mt-2 mb-3 d-block"
                  >
                    ${t.directions[this.language]} →
                  </a>
                `
              : null
            }
          </div>
        </div>
        <!-- Detail box -->
        ${render__hours_section(accessInfo, this.language)}
        <!-- Detail box -->
        ${this.current_station.mvalue === undefined ? html`
          <div class="details_box__section mt-3 pb-3">
            <div class="col-12 d-flex align-items-center">
              <div>
                <img class="w-18px mr-2 d-block" src="${icon__teal_info}" alt="" />
              </div>
              <div>
                <p class="mb-0 mt-0 fs-16 ff-sued fw-400">
                  ${t.no_real_time_data[this.language]}
                </p>
              </div>
            </div>
          </div>
        ` : null}
        <!-- Available columns detail box -->
        <div class="details_box__section mt-3 pb-3">
          <div class="col-12 d-flex align-items-center">
            <div>
              <p class="mb-0 mt-0 fs-18 ff-sued fw-400">
                ${t.available_columns[this.language]}
              </p>
            </div>
          </div>
          <div class="col-12">
            ${this.current_station.station_plugs
              ? this.current_station.station_plugs.map((o, i) => {
                  const { mvalue, sactive } = o;

                  let icon = null;
                  if (sactive) {
                    console.log(mvalue);
                    switch (mvalue) {
                      case undefined:
                        icon = icon__grey_dot_question;
                        break;
                      case 1:
                        icon = icon__green_dot;
                        break;
                      case "AVAILABLE":
                        icon = icon__green_dot;
                        break;
                      case "CHARGING":
                        icon = icon__green_dot; 
                        break;    
                      default:
                        icon = icon__red_dot;
                    }
                  } else {
                    icon = icon__grey_dot;
                  }

                  // Check if outlets or connectors exist
                  const outlets = o.smetadata.outlets || [];
                  const connectors = o.smetadata.connectors || [];

                  return html`
                    <div class="element_background d-flex align-items-center pt-2 pb-2 mt-3">
                      <div class="ml-3 mr-3 position-relative">
                        <img
                          class="w-18px d-block position-absolute"
                          style="top: -6px; right: -6px;"
                          src="${icon}"
                        />
                        <img class="w-24px d-block" src="${icon__type_1}" alt="" />
                      </div>
                      <div>
                        <p class="fs-16 mt-1">${t.type_sockets[this.language]}:</p>
                        ${outlets.length > 0
                          ? outlets.map(outlet => html`
                              <div class="d-flex">
                                <p class="fs-14 mt-1 mr-2">-</p>
                                <p class="fs-14 mt-1">
                                  ${outlet.outletTypeCode} - ${outlet.maxPower !== undefined ? outlet.maxPower.toLocaleString(this.language) : '--'} kW <br />
                                  <span class="fs-12 color-black-400 mt-2 fw-300">
                                    ${t.column[this.language]} ${i + 1} ∙
                                    ${Object.prototype.hasOwnProperty.call(outlet, 'minCurrent')
                                      ? outlet.minCurrent
                                      : '*'}
                                    - ${outlet.maxCurrent || '*'} A
                                  </span>
                                </p>
                              </div>
                            `)
                          : connectors.map(connector => html`
                              <div class="d-flex">
                                <p class="fs-14 mt-1 mr-2">-</p>
                                <p class="fs-14 mt-1">
                                  ${connector.standard} - ${typeof connector.max_electric_power === "number"  ? (connector.max_electric_power / 1000).toLocaleString(this.language) : '--'} kW <br />
                                  <span class="fs-12 color-black-400 mt-2 fw-300">
                                    ${t.column[this.language]} ${i + 1} ∙
                                    ${connector.max_ampere || '*'} A
                                  </span>
                                </p>
                              </div>
                            `)
                        }
                      </div>
                    </div>
                  `;
                })
              : null
            }
          </div>
        </div>
        <!-- Payment detail box -->
        <div class="details_box__section mt-3 pb-3">
          <div class="col-12 d-flex align-items-center">
            <div>
              <img class="w-16px mr-2 d-block" src="${icon__card}" alt="" />
            </div>
            <div>
              <p class="mb-0 mt-0 fs-18 ff-sued fw-400">${t.payment[this.language]}</p>
            </div>
          </div>
          <div class="col-12">
            <a
              href="${payment_link}"
              class="color-green fs-16 fw-300 mt-2 color-green--hover d-block"
              target="_blank"
            >
              ${t.more_informations[this.language]} →
            </a>
          </div>
        </div>
        ${operator !== 'UNKNOWN' ? html`
        <!-- Operator detail box -->
        <div class="details_box__section mt-3">
          <div class="col-12 d-flex align-items-center">
            <div>
              <img class="w-16px mr-2 d-block" src="${icon__info}" alt="" />
            </div>
            <div>
              <p class="mb-0 mt-0 fs-18 ff-sued fw-400">${t.operator[this.language]}</p>
            </div>
          </div>
          <div class="col-12 pb-3">
            <div class="element_background d-flex pt-2 pb-2 mt-3">
              <div class="ml-3 flex-fill">
                <p class="fs-16 mt-1">${operator}</p>
                ${providerWebsites[operator] ? html`
                  <a
                    href="${providerWebsites[operator]}"
                    class="color-green color-green--hover fs-16 fw-300 mt-2 mb-2 d-block"
                    target="_blank"
                  >
                    ${t.website[this.language]} →
                  </a>
              ` : null}
              </div>
            </div>
          </div>
        </div>
      ` : null}
        <!-- Nearby Locations detail box -->
        <div class="details_box__section mt-3">
          ${this.station_near_restaurants.length || this.station_near_accomodations.length
            ? html`
                <div class="col-12 d-flex align-items-center">
                  <div>
                    <img class="w-16px mr-2 d-block" src="${icon__pin}" alt="" />
                  </div>
                  <div>
                    <p class="mb-0 mt-0 fs-18 ff-sued fw-400">${t.near_places[this.language]}</p>
                  </div>
                </div>
              `
            : null
          }
          <div class="col-12">
            ${this.station_near_restaurants.map(o => html`
              <div class="element_background d-flex pt-2 pb-2 mt-3">
                <div class="ml-3 mr-3 position-relative mt-2">
                  <img class="w-24px d-block" src="${icon_restaurant_green}" alt="" />
                </div>
                <div class="flex-fill">
                  <p class="fs-16 mt-1">${o.Detail[this.language] ? o.Detail[this.language].Title : '---'}</p>
                  <p class="fs-12 color-black-400 mt-1 pr-2">
                    ${o.Detail[this.language]
                      ? utils_truncate(encodeXml(o.Detail[this.language].BaseText), 40)
                      : 'No description'}
                  </p>
                  <a
                    href="${`https://www.suedtirol.info/${this.language}/tripmapping/activity/${o.Id
                      .replace('GASTRO', 'SMGPOI')
                      .replace('_reduced', '')}`}"
                    class="color-green color-green--hover fs-16 fw-300 mt-2 mb-2 d-block"
                    target="_blank"
                  >
                    ${t.more_informations[this.language]} →
                  </a>
                  ${o.ContactInfos[this.language].Url ? html`
                    <a
                      href="${`${o.ContactInfos[this.language].Url}`}"
                      class="color-green color-green--hover fs-16 fw-300 mt-2 mb-2 d-block"
                      target="_blank"
                    >
                      ${t.website[this.language]} →
                    </a>
                  ` : ''}
                </div>
              </div>
            `)}
            ${this.station_near_accomodations.map(o => html`
              <div class="element_background d-flex pt-2 pb-2 mt-3">
                <div class="ml-3 mr-3 position-relative mt-2">
                  <img class="w-24px d-block" src="${icon_hotel_green}" alt="" />
                </div>
                <div class="flex-fill">
                  <p class="fs-16 mt-1">
                    ${o.AccoDetail[this.language] ? o.AccoDetail[this.language].Name : '---'}
                  </p>
                  <a
                    href="${`https://www.suedtirol.info/${this.language}/tripmapping/acco/${o.Id.replace('_REDUCED', '')}`}"
                    class="color-green color-green--hover fs-16 fw-300 mt-2 mb-2 d-block"
                    target="_blank"
                  >
                    ${t.more_informations[this.language]} →
                  </a>
                  ${o.AccoDetail[this.language].Website ? html`
                    <a
                      href="${`${o.AccoDetail[this.language].Website}`}"
                      class="color-green color-green--hover fs-16 fw-300 mt-2 mb-2 d-block"
                      target="_blank"
                    >
                      ${t.website[this.language]} →
                    </a>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  `;
}