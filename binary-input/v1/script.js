import { interval } from "ixfx/trackers.js";
import * as Numbers from "ixfx/numbers.js";

// #region Settings & state
const settings = Object.freeze({
  /** Element from HTML */
  thing: document.getElementById("thing"),
  /** Interval tracker */
  tracker: interval({ sampleLimit: 5 }),
});

let state = Object.freeze({
  /** 
   * Degrees of rotation
   * @type {number} 
   * */
  rotationAmount: 0,
});
// #endregion

function setup() {
  window.addEventListener("keydown", (event) => {
    if (event.code != "Space" || event.repeat) return;
    windUp();
  });

  // Call every half a second
  setInterval(updateScreen, 50);
};

/**
 * This function gets called every 50ms to update the screen
 */
const updateScreen = () => {
  computeResistantRotation();
  computeCSSRotation();
};

/**
 * This function computes the "natural" rotation of the wind-up mechanism,
 * which tries to force the key to its natural, "unturned" rotation.
 */
const computeResistantRotation = () => {
  let { rotationAmount } = state;
  let newVal = rotationAmount - rotationAmount * 0.06;
  saveState({ rotationAmount: newVal });
};

/**
 * Updates the CSS rotation by taking the value saved in the state
 */
const computeCSSRotation = () => {
  let { rotationAmount } = state;
  if (rotationAmount > 360) { rotationAmount = 360 };
  const { thing } = settings;
  if (thing != null) { thing.style.transform = `rotate(${rotationAmount}deg)`; }
  // console.log(rotationAmount);
};

/**
 * This function calculates a multiplier that is used to compute the CSS rotation.
 * Without this multiplier the user would not be able to rotate the wind-up key against
 * the natural rotation.
 */
const intensityMultiplier = () => {
  let scaledAvg = 0;
  if (Number.isNaN(settings.tracker.avg)) { 
    return 0;
  }
  else {
    scaledAvg = settings.tracker.avg / 150;

    if (scaledAvg > 5) { scaledAvg = 3};
    console.log(scaledAvg + " | " + settings.tracker.avg);
    let scaledMultiplier = Numbers.scale(scaledAvg, 0, 4, 10, 0);
    return scaledMultiplier;
  }
};


/**
 * This function makes the key wind-up, making it
 * rotate against its counter-clockwise direciton.
 */
const windUp = () => {
  // Mark the time the key was pressed down
  settings.tracker.mark(); 

  // Get the multiplier value
  let multiplier = intensityMultiplier();
  if (multiplier < 0) multiplier = 0;

  console.log(multiplier);

  // Calculate new value based on the previous rotation amount and the multiplier
  let minStepAmount = 10;
  let { rotationAmount } = state;         
  let newVal = rotationAmount + minStepAmount * multiplier;
  saveState({ rotationAmount: newVal });
};

// #region Toolbox
/**
 * Save state
 * @param {Partial<state>} s 
 */
function saveState(s) {
  state = Object.freeze({
    ...state,
    ...s
  });
}
setup();
// #endregion