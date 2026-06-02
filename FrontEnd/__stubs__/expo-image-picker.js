// Stub for expo-image-picker
module.exports = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
  launchCameraAsync:       jest.fn().mockResolvedValue({ canceled: true, assets: null }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
};
