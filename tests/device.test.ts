import {mapWindFromAPIToHomeKit, mapWindFromHomeKitToApi} from '../src/device';

describe('mapWindFromHomeKitToApi', () => {
  [{rotation: 0, wind: 'low'},
    {rotation: 25, wind: 'low'},
    {rotation: 26, wind: 'mid'},
    {rotation: 51, wind: 'high'},
    {rotation: 75, wind: 'high'},
    {rotation: 76, wind: 'auto'},
    {rotation: 100, wind: 'auto'}].forEach((testData) => {
    it(`should return wind ${testData.wind} value for rotation ${testData.rotation}`, () => {
      expect(mapWindFromHomeKitToApi(testData.rotation)).toBe(testData.wind); // Assuming winds[0] is the expected value for minRotationSpeed
    });
  });


  // Add more test cases as needed
});

describe('mapWindFromAPIToHomeKit', () => {
  [ {rotation: 25, wind: 'low'},
    {rotation: 50, wind: 'mid'},
    {rotation: 75, wind: 'high'},
    {rotation: 100, wind: 'auto'}].forEach((testData) => {
    it(`should return rotation ${testData.rotation} for wind ${testData.wind}`, () => {
      expect(mapWindFromAPIToHomeKit(testData.wind)).toBe(testData.rotation); // Assuming winds[0] is the expected value for minRotationSpeed
    });
  });


  // Add more test cases as needed
});