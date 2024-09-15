import { interval } from "ixfx/trackers.js";
import * as Numbers from "ixfx/numbers.js";

// #region Settings & state
const settings = Object.freeze({
  /** Element from HTML */
  thing: document.getElementById("thing"),
  /** Interval tracker */
  tracker: interval({ sampleLimit: 5 }),
  /**
   * How many values should be stored in the array that keeps memory of the last few "tracker.avg" values
   * @type {number}
   */
  avgValuesStorageLenght: 5
});

let state = Object.freeze({
  /** 
   * Degrees of rotation
   * @type {number} 
   * */
  rotationAmount: 0,
  /**
   * Used to keep track of the max avg amount. The tracker.max property doesn't work
   * because the avg is being calculated only for the last sample. If the user presses
   * slowly for a bit the max amount is gonna be very similar to the avg, which 
   * nullifies the dynamicness of the counterforce
   * @type {number} */
  avgMax: 500,
  /**
   * Used to keep track of the min avg amount. Works in the same way as "avgMax"
   * @type {number} */
  avgMin: 100,
  /**
   * This value is used when calculating how much each "nudge" from the user rotates the object.
   * This value is dynamically updated to support the wearing down of the interaction. This value
   * is the one that takes care of making the nudges feel like they're being resisted by the
   * rotating object. A lower value will make the resistance feel stronger, a larger value will make
   * the resistance feel weaker. There's a function that dynamically updates this value.
   * @type {number}
   */
  minStepScaler: 1,
  /**
   * This array is used to keep track of the last averages. I can't trust the API itself because
   * it just deletes the values after a bit, even if I use sampleLimit. So we have to implement our
   * own array-management-thingy that only keeps track of the last three values in order to
   * determine if the averages are increasing or decreasing.
   * @type {[number]}
   */
  lastAvgs: [0]
});
// #endregion

function setup() {
  window.addEventListener("keydown", (event) => {
    if (event.code != "Space" || event.repeat) return;
    // console.log(state.lastAvgs);
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
  let { rotationAmount, minStepScaler } = state;
  minStepScaler -= 0.3;
  let newVal = rotationAmount - 2;
  saveState({ rotationAmount: newVal, minStepScaler: minStepScaler });
};

/**
 * Updates the CSS rotation by taking the value saved in the state
 */
const computeCSSRotation = () => {
  let { rotationAmount } = state;
  // if (rotationAmount > 360) { rotationAmount = 360 };
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
  updateMaxAvg();
  let scaledAvg = 0;
  if (Number.isNaN(settings.tracker.avg)) { 
    return 0;
  } else {
    updateLastAvgs(settings.tracker.avg, settings.avgValuesStorageLenght);

    scaledAvg = Numbers.clamp(Numbers.scale(settings.tracker.avg, state.avgMin, state.avgMax, 0, 1), 0, 1);
    let scaledMultiplier = Numbers.scale(scaledAvg, 0, 1, 1, 0);
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

  // console.log(multiplier);

  updateStepScaler();
  // Calculate new value based on the previous rotation amount and the multiplier
  let minStepScalerValue = Numbers.clamp(state.minStepScaler, 0, 100);
  let minStepAmount = 10 + minStepScalerValue;
  // console.log(minStepAmount);
  let { rotationAmount } = state;         
  let newVal = rotationAmount + minStepAmount;
  saveState({ rotationAmount: newVal });
};

/**
 * Updates the "avgMax" value held in state. The value gets update only when
 * the avgMax gets bigger than the previous value. 
 */
function updateMaxAvg() {
  const { avgMax, avgMin } = state;

  if (settings.tracker.min < avgMin) {
    let newValue = settings.tracker.min;
    saveState({avgMin: newValue});
  }

  if (settings.tracker.max > avgMax) {
    let newValue = settings.tracker.max;
    saveState({avgMax: newValue});
  }
}


function updateStepScaler() {
  const { minStepScaler } = state;
  let firstValue = state.lastAvgs[0];
  // @ts-ignore
  let lastValue = state.lastAvgs[1];

  // console.log(lastValue);
  // @ts-ignore
  let difference = firstValue - lastValue;
  
  if (difference < 100 && difference > 0) {
    // If the most recent avg is lower than the least recent avg
    let newValue = minStepScaler + 1;
    newValue = Numbers.clamp(newValue, 0, 50);
    saveState({minStepScaler: newValue})
    // @ts-ignore
  } else if (firstValue < lastValue) {
    // If the most recent avg is lower than the least recent avg
    let newValue = minStepScaler + 2;
    newValue = Numbers.clamp(newValue, 0, 50);
    saveState({minStepScaler: newValue})
  }

}

function updateLastAvgs(newAvg, numberOfValues = settings.avgValuesStorageLenght) {
  let { lastAvgs } = state;
  if (lastAvgs.length < numberOfValues) {
    lastAvgs.unshift(newAvg);
  } else {
    lastAvgs.pop();
    lastAvgs.unshift(newAvg);
  }
}

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