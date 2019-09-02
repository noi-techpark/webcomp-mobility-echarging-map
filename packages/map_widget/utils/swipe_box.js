var touchstartX = 0;
var touchstartY = 0;
var touchendX = 0;
var touchendY = 0;

export function initialize_swipe(gesturedZone, modifiedElement) {
  let binded_handleGesure = handleGesure.bind(this);

  gesturedZone.addEventListener(
    'touchstart',
    e => {
      e.preventDefault();
      touchstartX = e.changedTouches[0].screenX;
      touchstartY = e.changedTouches[0].screenY;
    },
    false
  );

  gesturedZone.addEventListener(
    'touchend',
    e => {
      e.preventDefault();
      touchendX = e.changedTouches[0].screenX;
      touchendY = e.changedTouches[0].screenY;
      binded_handleGesure(modifiedElement);
    },
    false
  );
}

function handleGesure(modifiedElement) {
  if (touchendY >= touchstartY) {
    // console.log('Swiped up');
    modifiedElement.classList.remove('open');
    this.details_mobile_state = false;
  }
  if (touchendY <= touchstartY) {
    // console.log(swiped + 'down!');
    modifiedElement.classList.add('open');
    this.details_mobile_state = true;
  }
  if (touchendX <= touchstartX) {
    // console.log('Swiped left');
  }
  if (touchendX >= touchstartX) {
    // console.log('Swiped right');
  }
  if (touchendY == touchstartY) {
    // console.log('tap!');
  }
}
