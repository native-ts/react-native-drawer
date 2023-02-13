import React, {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import {
  Animated,
  Easing,
  EasingFunction,
  LayoutChangeEvent,
  Modal,
  ModalProps,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";

import useWindow from "@native-ts/common/hooks/use-window";

export interface DrawerRef{
  open(): void;
  close(): void;
}

export interface DrawerProps
  extends Partial<Omit<ModalProps,
    | 'animationType'
    | 'transparent'
  >>{
    easing?: EasingFunction;
    duration?: number;
    opacity?: number;
    direction?: 'top' | 'right' | 'bottom' | 'left';
    fullSize?: boolean;
    size?: string | number;
    componentProps?: {
      container?: ViewProps;
    }
  }

const isVertical = (d: 'top' | 'right' | 'bottom' | 'left') => {
  return d === 'top' || d === 'bottom';
}

const Drawer = forwardRef<DrawerRef, PropsWithChildren<DrawerProps>>(
  function Drawer(props, ref) {

    const {
      children,
      easing = Easing.linear,
      duration = 250,
      opacity = 0.5,
      direction = 'right',
      fullSize = false,
      size,
      onLayout,
      componentProps = {},
      ...rest
    } = props;

    const dimension = useWindow();
    const [ contentSize, setContentSize ] = useState(0);
    const [ visible, setVisible ] = useState(false);

    const opacityAnimated = useRef(new Animated.Value(0));
    const opacityTiming = useRef<Animated.CompositeAnimation>();

    const translate = useRef(new Animated.Value(contentSize));
    const translateTiming = useRef<Animated.CompositeAnimation>();

    // useEffect(() => {console.log({ visible, contentSize })
    //   if (visible && contentSize) {
    //     stop();
    //     animated(opacity, 0);
    //     start();
    //   }
    // }, [ visible, contentSize ]);

    useLayoutEffect(() => {
      if (visible && contentSize) {
        stop();
        animated(opacity, 0);
        start();
      }
    }, [ visible ]);

    const vertical = isVertical(direction);

    useImperativeHandle(ref, () => ({
      open() {
        setVisible(true);
      },
      close() {
        stop();
        animated(opacity, 0);
        start(() => setVisible(false));
      }
    }))

    const getSize = useCallback(() => {
      if (fullSize) {
        return '100%';
      }

      if (size) {
        return size;
      }

      if (contentSize === 0) {
        return 'auto';
      }

      return Math.min(
        contentSize,
        vertical ? dimension.height : dimension.width
      );
    }, [ fullSize, size, contentSize, dimension ]);

    const stop = () => {
      opacityTiming.current && opacityTiming.current.stop();
      translateTiming.current && translateTiming.current.stop();
    }

    const start = (callback?: (() => void)) => {
      opacityTiming.current?.start();
      translateTiming.current?.start(callback);
    }

    const animated = (o: number, c: number) => {
      opacityTiming.current = Animated.timing(opacityAnimated.current, {
        toValue: o,
        duration,
        useNativeDriver: true,
        easing,
      });
  
      translateTiming.current = Animated.timing(translate.current, {
        toValue: c,
        duration,
        useNativeDriver: true,
        easing,
      });
    }

    const handleLayoutContainer = (e: LayoutChangeEvent) => {
      const { width: ew, height: eh } = e.nativeEvent.layout;
      const size = isVertical(direction) ? eh : ew;
      
      if (size === contentSize) {
        stop();
        animated(opacity, 0);
        start();
      }
      else {
        setContentSize(size);
      }

      onLayout?.(e);
    }

    return (
      <Modal
        { ...rest }
        visible={ visible }
        animationType="none"
        transparent
      >
        <Animated.View
          style={[
            styles.backdrop, 
            { opacity: opacityAnimated.current }
          ]}
        />
        <Animated.View
          style={[
            styles.container,
            StyleSheet.flatten(componentProps.container?.style),
            vertical && {
              width: dimension.width,
              height: getSize()
            },
            !vertical && {
              width: getSize(),
              height: dimension.height
            },
            { transform: [{ translateX: translate.current }] }
          ]}
          onLayout={ handleLayoutContainer }
        >
          
          <ScrollView contentInsetAdjustmentBehavior="always">
            { children }
          </ScrollView>
        </Animated.View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {

  },
  container: {
    backgroundColor: '#fff'
  }
});

Drawer.displayName = 'Drawer';
export default Drawer;