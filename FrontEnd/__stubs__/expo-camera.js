// Stub for expo-camera
const React = require('react');
module.exports = {
  CameraView:   ({ children, style }) => React.createElement('div', { style }, children),
  useCameraPermissions: jest.fn().mockReturnValue([{ granted: true }, jest.fn()]),
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
};
