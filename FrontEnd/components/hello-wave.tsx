import Animated from 'react-native-reanimated';
import { styles } from './styles/hello-wave.styles';

export function HelloWave() {
  return (
    <Animated.Text style={styles.wave}>
      👋
    </Animated.Text>
  );
}
