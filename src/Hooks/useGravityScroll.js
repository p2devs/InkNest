import { useEffect, useRef } from 'react';
import { gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Platform } from 'react-native';

const THRESHOLD = 1; // Adjust sensitivity as needed
const DEBOUNCE_TIME = 1000; // Time in ms to wait before accepting another gesture

export const useGravityScroll = (enabled, onNext, onPrevious) => {
    const lastActionTime = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        // Set update interval (e.g., 100ms)
        setUpdateIntervalForType(SensorTypes.gyroscope, 100);

        const subscription = gyroscope.subscribe(({ x, y, z }) => {
            const now = Date.now();
            if (now - lastActionTime.current < DEBOUNCE_TIME) return;

            // Detect Twist (Y-axis for left/right, X-axis for forward/backward)
            // Note: Axis orientation might vary based on device holding position.
            // Assuming portrait mode mostly, but we can check both.

            // Horizontal Twist (Left/Right) - usually Y or Z axis depending on grip
            // Let's check Y axis for "steering wheel" motion or Z for "doorknob" motion
            // "Twist of wrist" usually implies rotation around the forearm axis.
            // If holding phone in portrait:
            // - Twist wrist left/right (supination/pronation) -> Rotation around Y axis (vertical axis of phone) if phone is vertical?
            // Actually, if you hold phone in front of you:
            // - X axis: Left-Right edge
            // - Y axis: Top-Bottom edge
            // - Z axis: Through the screen

            // "Twist left to right" (like turning a doorknob clockwise) -> Z axis rotation?
            // Or "Twist wrist" like tilting the phone left/right? -> Y axis rotation (Roll)

            // Let's try to detect significant rotation on any axis that maps to the user's intent.

            // Case 1: Twist Left-to-Right (Next Page)
            // If we assume "Twist" means rolling the phone to the right.
            if (y > THRESHOLD || z > THRESHOLD) {
                // Twist Right / Forward
                onNext();
                lastActionTime.current = now;
            }
            // Case 2: Twist Right-to-Left (Previous Page)
            else if (y < -THRESHOLD || z < -THRESHOLD) {
                // Twist Left / Backward
                onPrevious();
                lastActionTime.current = now;
            }
            // Case 3: Forward/Backward Tilt (Pitch) - X axis
            else if (x > THRESHOLD) {
                // Tilt Forward
                onNext();
                lastActionTime.current = now;
            } else if (x < -THRESHOLD) {
                // Tilt Backward
                onPrevious();
                lastActionTime.current = now;
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [enabled, onNext, onPrevious]);
};
