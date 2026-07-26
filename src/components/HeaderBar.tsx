import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, RotateCcw, Clock, Footprints } from 'lucide-react-native';
import { theme } from '../constants/theme';

interface HeaderBarProps {
  levelId: number;
  levelName: string;
  moves: number;
  elapsedTimeSeconds: number;
  onBack: () => void;
  onRestart: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  levelId,
  levelName,
  moves,
  elapsedTimeSeconds,
  onBack,
  onRestart,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.iconBtn}>
        <ArrowLeft size={22} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.centerInfo}>
        <Text style={styles.levelBadge}>NIVEAU {levelId}</Text>
        <Text style={styles.levelTitle} numberOfLines={1}>
          {levelName}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statPill}>
          <Clock size={14} color={theme.colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.statText}>{formatTime(elapsedTimeSeconds)}</Text>
        </View>

        <View style={styles.statPill}>
          <Footprints size={14} color={theme.colors.warning} style={{ marginRight: 4 }} />
          <Text style={styles.statText}>{moves}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.7} onPress={onRestart} style={styles.iconBtn}>
        <RotateCcw size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  levelBadge: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  levelTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
