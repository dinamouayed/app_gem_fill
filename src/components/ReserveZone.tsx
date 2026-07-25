import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Gem } from "./Gem";
import { GemColor } from "../types/level";
import { Inbox } from "lucide-react-native";

interface ReserveZoneProps {
  reserve: (string | null)[];
  paletteMap: Record<string, GemColor>;
  selectedReserveColorId: string | null;
  onSlotPress: (index: number) => void;
}

const SLOTS_PER_ROW = 6;

interface ReserveSlotProps {
  gemId: string | null;
  index: number;
  slotSize: number;
  paletteMap: Record<string, GemColor>;
  selectedReserveColorId: string | null;
  onSlotPress: (index: number) => void;
}

const ReserveSlot: React.FC<ReserveSlotProps> = ({
  gemId,
  index,
  slotSize,
  paletteMap,
  selectedReserveColorId,
  onSlotPress,
}) => {
  const gemColor = gemId ? (paletteMap[gemId] ?? null) : null;
  const isSelected =
    gemId !== null && selectedReserveColorId === gemId;
  const isDimmed =
    selectedReserveColorId !== null && gemId !== null && !isSelected;

  return (
    <Pressable
      onPress={() => onSlotPress(index)}
      style={[
        styles.slotBox,
        {
          width: slotSize,
          height: slotSize,
          borderRadius: Math.round(slotSize * 0.2),
          backgroundColor: gemColor
            ? "transparent"
            : "rgba(30, 41, 59, 0.6)",
        },
      ]}
    >
      {gemColor ? (
        <Gem
          colorHex={gemColor.hex}
          size={Math.max(12, slotSize - 2)}
          isSelected={isSelected}
          isDimmed={isDimmed}
          interactive={false}
        />
      ) : (
        <Text style={styles.emptyIndex}>{index + 1}</Text>
      )}
    </Pressable>
  );
};

export const ReserveZone: React.FC<ReserveZoneProps> = ({
  reserve,
  paletteMap,
  selectedReserveColorId,
  onSlotPress,
}) => {
  const occupiedCount = reserve.filter((item) => item !== null).length;
  const slotSize = 42;

  const rows: (string | null)[][] = [];

  for (let index = 0; index < reserve.length; index += SLOTS_PER_ROW) {
    rows.push(reserve.slice(index, index + SLOTS_PER_ROW));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Inbox size={18} color="#94A3B8" style={styles.titleIcon} />
          <Text style={styles.titleText}>Zone de Réserve</Text>
        </View>

        <Text style={styles.capacityText}>
          {occupiedCount}/{reserve.length} gemmes
        </Text>
      </View>

      <View style={styles.slotsGrid}>
        {rows.map((rowSlots, rowIndex) => (
          <View key={`reserve-row-${rowIndex}`} style={styles.slotsRow}>
            {rowSlots.map((gemId, columnIndex) => {
              const slotIndex = rowIndex * SLOTS_PER_ROW + columnIndex;

              return (
                <ReserveSlot
                  key={`reserve-slot-${slotIndex}`}
                  gemId={gemId}
                  index={slotIndex}
                  slotSize={slotSize}
                  paletteMap={paletteMap}
                  selectedReserveColorId={selectedReserveColorId}
                  onSlotPress={onSlotPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  titleIcon: {
    marginRight: 6,
  },

  titleText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  capacityText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },

  slotsGrid: {
    alignItems: "center",
    gap: 8,
  },

  slotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  slotBox: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "visible",
  },

  emptyIndex: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
});
