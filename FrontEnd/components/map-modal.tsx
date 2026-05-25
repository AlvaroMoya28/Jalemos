import { Platform } from "react-native";

const InteractiveMapModal =
  Platform.OS === "web"
    ? require("./map-modal.web").default
    : require("./map-modal.native").default;

export default InteractiveMapModal;
