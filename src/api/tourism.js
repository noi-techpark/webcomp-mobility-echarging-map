import { fetch_origin } from './constants';

const BASE_PATH = 'https://tourism.opendatahub.bz.it/v1';

export async function request__near_restaurants(lat, lon) {
  const response = await fetch(
    `${BASE_PATH}/ODHActivityPoi?type=32&pagesize=3&latitude=${lat}&longitude=${lon}&radius=300&active=true&origin=${fetch_origin}`,
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
    `${BASE_PATH}/Accommodation?pagesize=3&latitude=${lat}&longitude=${lon}&radius=300&active=true&origin=${fetch_origin}`,
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
