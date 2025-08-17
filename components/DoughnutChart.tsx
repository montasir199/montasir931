
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  size: number;
  strokeWidth: number;
  percentage: number; // 0..1
  primaryColor: string;
  secondaryColor: string;
  centerLabel?: string;
}

export const DoughnutChart: React.FC<Props> = ({
  size,
  strokeWidth,
  percentage,
  primaryColor,
  secondaryColor,
  centerLabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const primaryLength = circumference * Math.min(Math.max(percentage, 0), 1);
  const secondaryLength = circumference - primaryLength;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${secondaryLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${primaryLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {centerLabel ? <Text style={styles.centerText}>{centerLabel}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerText: { position: 'absolute', fontWeight: '800' },
});
