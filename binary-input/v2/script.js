import { interval } from "ixfx/trackers.js";
import * as Numbers from "ixfx/numbers.js";

// #region Settings & state
const settings = Object.freeze({
  /** Element from HTML */
  thing: document.getElementById("thing"),
  /** Interval tracker */
  tracker: interval({ sampleLimit: 5 }),
  /** Degrees of max rotation */
  maxRotation: 360
});

let state = Object.freeze({
  /** 
   * Degrees of rotation
   * @type {number} 
   * */
  rotationAmount: 0,
});
// #endregion

const setup = () => {
  window.addEventListener("keydown", (event) => {
    if (event.code != "Space" || event.repeat) return;
    windUp();
  });

  // Call every half a second
  setInterval(updateScreen, 5);
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

  // This calculation makes the thing slowly rotate back to its position
  let newVal = rotationAmount - 0.3;

  // Prevent the thing from rotating infinitely counter-clockwise
  if (newVal < 0) newVal = 0;

  saveState({rotationAmount: newVal});
};

/**
 * Updates the CSS rotation by taking the value saved in the state
 */
const computeCSSRotation = () => {
  let { rotationAmount } = state;

  // Prevent the thing from rotating past the maxRotation value (360° in this case)
  if (rotationAmount > settings.maxRotation) { rotationAmount = settings.maxRotation };

  const { thing } = settings;
  if (thing != null) { thing.style.transform = `rotate(${rotationAmount}deg)`; }
};

/**
 * This function calculates a multiplier that is used to compute the CSS rotation.
 * Without this multiplier the user would not be able to rotate the wind-up key against
 * the natural rotation.
 */
const intensityMultiplier = () => {
  if (Number.isNaN(settings.tracker.avg)) return 0;

  const { rotationAmount } = state;

  // The multiplier is calculated base on the rotation of the thing rather than the
  // time between presses. This makes it behave like a data mirror?
  let scaledRotation = Numbers.scale(rotationAmount, 0, settings.maxRotation, 0, 1);
  return scaledRotation;
};


/**
 * This function makes the key wind-up, making it
 * rotate against its counter-clockwise direciton.
 */
const windUp = () => {
  let { rotationAmount } = state;

  // Mark the time the key was pressed down
  settings.tracker.mark(); 

  let minStepAmount = 10;

  // Get the multiplier value
  let multiplier = intensityMultiplier() * minStepAmount;

  console.log(multiplier);
  if (multiplier < 0) multiplier = 0;

  // Calculate new value based on the previous rotation amount and the multiplier.
  let newVal = rotationAmount + minStepAmount + multiplier;

  /**
   * Here the max rotation achievable is set to a value slightly higher than
   * the desired one because otherwise the thing would never achieve a "balanced"
   * state when fully rotated. This could be changed if the deisred effect is
   * to have the thing in a constant state of movement even when it has reached
   * its maximum rotation amoun.
   */
  if (newVal > settings.maxRotation + 30) newVal = settings.maxRotation + 30;

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