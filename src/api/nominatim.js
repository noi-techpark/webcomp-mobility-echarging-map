// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export async function request__get_coordinates_from_search(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1`, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    })
  });
  const data = await response.json();
  this.searched_places = data;
}
