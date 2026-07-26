import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Star, Play, CheckCircle2 } from 'lucide-react-native';
import { Level } from '../types/level';
import { LevelProgress } from '../types/game';
import { theme } from '../constants/theme';

interface LevelCardProps {
  level: Level;
  status: 'completed' | 'available' | 'locked' | 'in_progress';
  progress?: LevelProgress;
  onPress: () => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  status,
  progress,
  onPress,
}) => {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <TouchableOpacity
      activeOpacity={isLocked ? 1 : 0.75}
      onPress={isLocked ? undefined : onPress}
      style={[
        styles.card,
        isLocked && styles.cardLocked,
        isCompleted && styles.cardCompleted,
        isInProgress && styles.cardInProgress,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.levelNum, isLocked && styles.textLocked]}>
          Niveau {level.id}
        </Text>
        {isLocked && <Lock size={16} color={theme.colors.textDim} />}
        {isCompleted && <CheckCircle2 size={18} color={theme.colors.success} />}
        {isInProgress && (
          <View style={styles.inProgressBadge}>
            <Text style={styles.inProgressText}>En cours</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, isLocked && styles.textLocked]} numberOfLines={1}>
        {level.name}
      </Text>

      <Text style={styles.gridDimensions}>
        {level.rows} × {level.columns} • {level.difficulty || 'Moyen'}
      </Text>

      {/* Stars & Score footer */}
      <View style={styles.footer}>
        {isCompleted && progress ? (
          <View style={styles.starsRow}>
            {[1, 2, 3].map((starIndex) => (
              <Star
                key={starIndex}
                size={14}
                color={starIndex <= (progress.stars || 1) ? theme.colors.warning : theme.colors.textFaint}
                fill={starIndex <= (progress.stars || 1) ? theme.colors.warning : 'transparent'}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        ) : !isLocked ? (
          <View style={styles.playRow}>
            <Play size={14} color={theme.colors.accent} fill={theme.colors.accent} style={{ marginRight: 4 }} />
            <Text style={styles.playText}>Jouer</Text>
          </View>
        ) : (
          <Text style={styles.lockedHint}>Verrouillé</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    width: '45%',
  },
  cardLocked: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.surface,
    opacity: 0.6,
  },
  cardCompleted: {
    borderColor: theme.colors.successDark,
    backgroundColor: theme.colors.successSurface,
  },
  cardInProgress: {
    borderColor: theme.colors.accentDark,
    backgroundColor: theme.colors.inProgressSurface,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNum: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 2,
  },
  textLocked: {
    color: theme.colors.textDim,
  },
  gridDimensions: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  lockedHint: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
  inProgressBadge: {
    backgroundColor: theme.colors.accentDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inProgressText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
