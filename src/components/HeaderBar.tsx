import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, RotateCcw, Clock, Footprints } from 'lucide-react-native';

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
        <ArrowLeft size={22} color="#F8FAFC" />
      </TouchableOpacity>

      <View style={styles.centerInfo}>
        <Text style={styles.levelBadge}>NIVEAU {levelId}</Text>
        <Text style={styles.levelTitle} numberOfLines={1}>
          {levelName}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statPill}>
          <Clock size={14} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.statText}>{formatTime(elapsedTimeSeconds)}</Text>
        </View>

        <View style={styles.statPill}>
          <Footprints size={14} color="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={styles.statText}>{moves}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.7} onPress={onRestart} style={styles.iconBtn}>
        <RotateCcw size={20} color="#F8FAFC" />
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
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  levelBadge: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  levelTitle: {
    color: '#F8FAFC',
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
