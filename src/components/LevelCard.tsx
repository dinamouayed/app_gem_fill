import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Star, Play, CheckCircle2 } from 'lucide-react-native';
import { Level } from '../types/level';
import { LevelProgress } from '../types/game';

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
        {isLocked && <Lock size={16} color="#64748B" />}
        {isCompleted && <CheckCircle2 size={18} color="#10B981" />}
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
                color={starIndex <= (progress.stars || 1) ? '#F59E0B' : '#475569'}
                fill={starIndex <= (progress.stars || 1) ? '#F59E0B' : 'transparent'}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        ) : !isLocked ? (
          <View style={styles.playRow}>
            <Play size={14} color="#38BDF8" fill="#38BDF8" style={{ marginRight: 4 }} />
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
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    width: '45%',
  },
  cardLocked: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    opacity: 0.6,
  },
  cardCompleted: {
    borderColor: '#059669',
    backgroundColor: '#064E3B22',
  },
  cardInProgress: {
    borderColor: '#0284C7',
    backgroundColor: '#07598522',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNum: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 2,
  },
  textLocked: {
    color: '#64748B',
  },
  gridDimensions: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedHint: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  inProgressBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inProgressText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
