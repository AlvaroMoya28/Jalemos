// Stub for expo-image-manipulator
module.exports = {
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'file://manipulated.jpg', width: 100, height: 100 }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  FlipType: { Vertical: 'vertical', Horizontal: 'horizontal' },
};
