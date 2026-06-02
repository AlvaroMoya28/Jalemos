// Stub for @react-navigation/native
module.exports = {
  CommonActions: { navigate: jest.fn(), reset: jest.fn(), goBack: jest.fn() },
  useNavigation: jest.fn().mockReturnValue({ dispatch: jest.fn(), setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() }),
  useRoute:      jest.fn().mockReturnValue({ params: {} }),
  NavigationContainer: ({ children }) => children,
};
