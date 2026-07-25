import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Trophy, Star, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react-native';
import { Level, GemColor } from '../types/level';

interface VictoryModalProps {
  visible: boolean;
  level: Level;
  moves: number;
  timeSeconds: number;
  stars: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  visible,
  level,
  moves,
  timeSeconds,
  stars,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  // Create palette color mapping
  const paletteMap = React.useMemo(() => {
    const map: Record<string, GemColor> = {};
    level.palette.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [level]);

  // Compute pixel art preview cell size
  const previewCellSize = Math.max(8, Math.min(24, Math.floor(220 / Math.max(level.rows, level.columns))));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { width: Math.min(windowWidth - 40, 360) }]}>
          {/* Top Banner Icon */}
          <View style={styles.trophyContainer}>
            <Sparkles size={24} color="#FBBF24" style={styles.sparkleLeft} />
            <View style={styles.trophyCircle}>
              <Trophy size={40} color="#F59E0B" fill="#FBBF24" />
            </View>
            <Sparkles size={24} color="#FBBF24" style={styles.sparkleRight} />
          </View>

          <Text style={styles.congratsTitle}>Niveau Réussi !</Text>
          <Text style={styles.levelTitle}>{level.name}</Text>

          {/* Stars display */}
          <View style={styles.starsRow}>
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                size={32}
                color={starIdx <= stars ? '#F59E0B' : '#334155'}
                fill={starIdx <= stars ? '#FBBF24' : 'transparent'}
                style={{ marginHorizontal: 4 }}
              />
            ))}
          </View>

          {/* Full Pixel Art Revealed Preview */}
          <View style={styles.pixelArtPreviewContainer}>
            <Text style={styles.previewLabel}>Image Complétée</Text>
            <View style={styles.pixelArtGrid}>
              {level.targetGrid.map((row, r) => (
                <View key={`pv-row-${r}`} style={{ flexDirection: 'row' }}>
                  {row.map((colorId, c) => {
                    const color = paletteMap[colorId]?.hex || '#000';
                    return (
                      <View
                        key={`pv-cell-${r}-${c}`}
                        style={{
                          width: previewCellSize,
                          height: previewCellSize,
                          backgroundColor: color,
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Temps</Text>
              <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Mouvements</Text>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            {hasNextLevel && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNextLevel}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Niveau Suivant</Text>
                <ArrowRight size={20} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}

            <View style={styles.secondaryRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onReplay}
                style={styles.secondaryBtn}
              >
                <RotateCcw size={18} color="#F8FAFC" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Rejouer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onHome}
                style={styles.secondaryBtn}
              >
                <Home size={18} color="#F8FAFC" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Accueil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  trophyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 8,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  sparkleLeft: {
    marginRight: 8,
  },
  sparkleRight: {
    marginLeft: 8,
  },
  congratsTitle: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  levelTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  pixelArtPreviewContainer: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pixelArtGrid: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  actionsColumn: {
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
});
