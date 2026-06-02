// Stub for expo-location
module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync:           jest.fn().mockResolvedValue({ coords: { latitude: 9.93, longitude: -84.09 } }),
  reverseGeocodeAsync:               jest.fn().mockResolvedValue([{ street: 'Test', city: 'San José' }]),
  Accuracy: { Balanced: 3, High: 4, Low: 2 },
};
