import React from 'react';
import { PricePoint } from '../types';
import { RechartsTrendChart } from './RechartsTrendChart';

interface SvgChartProps {
  data: PricePoint[];
  height?: number;
  currency?: string;
  isPositive?: boolean;
  valuePrefix?: string;
  showCandleToggle?: boolean;
}

export const SvgChart: React.FC<SvgChartProps> = ({
  data,
  height = 240,
  currency = '₹',
  isPositive,
  valuePrefix = '',
}) => {
  return (
    <RechartsTrendChart
      data={data}
      height={height}
      currency={currency}
      isPositive={isPositive}
      valuePrefix={valuePrefix}
      showControls={true}
    />
  );
};
