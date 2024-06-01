import {maxRotationSpeed, minRotationSpeed, winds} from './consts';

export interface Device {
    id: string;
    name: string;
    power: string;
    mode: string;
    setTemp: string;
    wind: string;
    swing: string;
    lock: string;
    factTemp: string;
    modeLockValue: string;
    coolLockValue: string;
    heatLockValue: string;
    windLockValue: string;
    unlock: string;
}

export function mapWindFromAPIToHomeKit(wind: string) {
  const range = maxRotationSpeed - minRotationSpeed;
  const step = range / winds.length;
  const index = winds.indexOf(wind) + 1;
  return (step * index);
}

export function mapWindFromHomeKitToApi(wind: number) {

  const range = maxRotationSpeed - minRotationSpeed + 1;
  const step = range / winds.length;

  for (let i = 0; i < winds.length; i++) {
    if (((i + 1) * step) > wind) {
      return winds[i];
    }
  }
  //Return last as default.
  return winds[winds.length + 1];
}