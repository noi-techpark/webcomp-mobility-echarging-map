// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { html } from 'lit-element';
import { t } from '../translations';

export function render__state_label(state, lang) {
  const state_content = {
    TEMPORARYUNAVAILABLE: t.maintenance[lang],
    AVAILABLE: t.available[lang],
    ACTIVE: t.available[lang],
    UNKNOWN: t.not_received[lang],
    FAULT: t.not_available[lang],
    PRIVATE_WITHPUBLICACCESS: t.privato_with_p_a[lang],
    PUBLIC: t.public[lang],
    PRIVATE: t.private[lang],
    OCCUPIED: t.occupied[lang]
  };
  const state_color = {
    TEMPORARYUNAVAILABLE: 'gray',
    ACTIVE: 'green',
    AVAILABLE: 'green',
    UNKNOWN: 'gray',
    FAULT: 'red',
    PRIVATE_WITHPUBLICACCESS: 'purple',
    PUBLIC: 'purple',
    PRIVATE: 'purple',
    OCCUPIED: 'red'
  };
  return html`
    <div class=${`details_box__status_label ${state_color[state]}`}><p>${state_content[state].toUpperCase()}</p></div>
  `;
}
