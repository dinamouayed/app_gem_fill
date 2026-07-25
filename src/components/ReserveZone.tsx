import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gem } from './Gem';
import { GemColor } from '../types/level';
import { Inbox } from 'lucide-react-native';

interface ReserveZoneProps {
  reserve: (string | null)[];
  paletteMap: Record<string, GemColor>;
  selectedReserveIndex: number | null;
  hasSelection?: boolean;
  onSlotPress: (index: number) => void;
}

export const ReserveZone: React.FC<ReserveZoneProps> = ({
  reserve,
  paletteMap,
  selectedReserveIndex,
  hasSelection = false,
  onSlotPress,
}) => {
  const occupiedCount = reserve.filter((item) => item !== null).length;
  const slotSize = 48;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Inbox size={18} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.titleText}>Zone de Réserve</Text>
        </View>
        <Text style={styles.capacityText}>
          {occupiedCount}/{reserve.length} gemmes
        </Text>
      </View>

      <View style={styles.slotsRow}>
        {reserve.map((gemId, index) => {
          const gemColor = gemId ? paletteMap[gemId] ?? null : null;
          const isSelected = selectedReserveIndex === index;
          const isDimmed = hasSelection && !isSelected && gemColor !== null;

          return (
            <TouchableOpacity
              key={`reserve-slot-${index}`}
              activeOpacity={0.7}
              onPress={() => onSlotPress(index)}
              style={[
                styles.slotBox,
                {
                  width: slotSize,
                  height: slotSize,
                  borderRadius: Math.round(slotSize * 0.2),
                  borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.15)',
                  backgroundColor: gemColor ? 'transparent' : 'rgba(30, 41, 59, 0.6)',
                },
              ]}
            >
              {gemColor ? (
                <Gem
                  colorHex={gemColor.hex}
                  size={slotSize - 4}
                  isSelected={isSelected}
                  isDimmed={isDimmed}
                  onPress={() => onSlotPress(index)}
                />
              ) : (
                <Text style={styles.emptyIndex}>{index + 1}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  capacityText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  slotBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyIndex: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
