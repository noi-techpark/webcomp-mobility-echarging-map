// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { fetch_origin } from './constants';

const BASE_PATH = process.env.TOURISM_BASE_PATH;

export async function request__near_restaurants(lat, lon) {
  const response = await fetch(
    `${BASE_PATH}/ODHActivityPoi?type=32&pagesize=3&latitude=${lat}&longitude=${lon}&radius=300&active=true&origin=${fetch_origin}&fields=Id,Detail,ContactInfos`,
    {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      })
    }
  );
  const results = await response.json();

  this.station_near_restaurants = [...results.Items];
}

export async function request__near_accomodations(lat, lon) {
  const response = await fetch(
    `${BASE_PATH}/Accommodation?pagesize=3&latitude=${lat}&longitude=${lon}&radius=300&active=true&origin=${fetch_origin}&fields=Id,AccoDetail`,
    {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      })
    }
  );
  const results = await response.json();

  this.station_near_accomodations = [...results.Items];
}
