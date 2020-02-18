import { html } from 'lit-element';

const style = html`
  <style>
    .message_overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1002;
    }
    .message_overlay_internal {
      display: inline-block;
      position: relative;
      width: 350px;
      height: 134px;
      left: 50%;
      top: 50%;
      margin-left: -175px;
    }
    .message_overlay_internal div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 290px;
      height: 121px;
      margin: 6px;
      border: 6px solid #fff;
      border-radius: 3px;
      border-color: #fff transparent transparent transparent;
      background-color: white;
    }
    .message_button {
      padding-top: 10px;
    }
  </style>
`;

export function render__message_overlay() {
  if (this.message) {
    return html`
      ${style}
      <div class="message_overlay">
        <div class="message_overlay_internal">
          <div>
            ${this.message}
            <br />
            <a href="javascript:void(0);" class="message_button"
              @click="${() => { this.message = null; return false; }}"
            >
              OK
            </a>
          </div>
        </div>
      </div>
    `;
  }
  return null;
}
