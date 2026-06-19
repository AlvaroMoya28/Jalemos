import { Platform } from "react-native";
import MapModalWeb from "./map-modal.web";
import MapModalNative from "./map-modal.native";

const InteractiveMapModal = Platform.OS === "web" ? MapModalWeb : MapModalNative;

export default InteractiveMapModal;
