import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Volume2, Vibrate, Trash2, HelpCircle, Info } from 'lucide-react-native';
import { useProgress } from '../src/hooks/useProgress';
import { theme } from '../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { progress, toggleSound, toggleHaptics, resetProgress } = useProgress();

  const handleResetProgress = () => {
    Alert.alert(
      'Réinitialiser la progression ?',
      'Toutes vos étoiles, temps records et niveaux débloqués seront réinitialisés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            Alert.alert('Progression réinitialisée', 'Votre jeu a été remis à zéro.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Audio & Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUDIO & RETOURS</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowLabelGroup}>
              <Volume2 size={20} color={theme.colors.accent} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabelText}>Effets Sonores</Text>
            </View>
            <Switch
              value={progress?.soundEnabled ?? true}
              onValueChange={toggleSound}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentDark }}
              thumbColor={progress?.soundEnabled ? theme.colors.accent : theme.colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLabelGroup}>
              <Vibrate size={20} color={theme.colors.accent} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabelText}>Vibrations Haptiques</Text>
            </View>
            <Switch
              value={progress?.hapticsEnabled ?? true}
              onValueChange={toggleHaptics}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentDark }}
              thumbColor={progress?.hapticsEnabled ? theme.colors.accent : theme.colors.textMuted}
            />
          </View>
        </View>

        {/* How to Play Guide Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RÈGLES DU JEU</Text>
          <View style={styles.guideBox}>
            <HelpCircle size={20} color={theme.colors.warning} style={{ marginBottom: 6 }} />
            <Text style={styles.guideTitle}>Comment jouer à Gem Fill ?</Text>
            <Text style={styles.guideText}>
              {'\u2022'} Chaque case affiche en fond la couleur cible : c{"'"}est là que la gemme correspondante doit se trouver.{'\n\n'}
              {'\u2022'} Touchez une gemme mal placée pour sélectionner tout son groupe (gemmes de même couleur connectées). Les gemmes déjà bien placées sont verrouillées.{'\n\n'}
              {'\u2022'} Avec un groupe sélectionné, touchez une case vide dont la couleur cible correspond pour y placer les gemmes.{'\n\n'}
              {'\u2022'} Le plateau est souvent plein : utilisez la Zone de Réserve (12 emplacements en bas) pour libérer des cases. Touchez un emplacement vide de la réserve pour y envoyer le groupe sélectionné.{'\n\n'}
              {'\u2022'} Depuis la réserve, touchez une couleur de gemme puis une case vide compatible pour la replacer sur le plateau.{'\n\n'}
              {'\u2022'} Appui long sur une gemme : envoi direct vers la réserve.{'\n\n'}
              {'\u2022'} Objectif : toutes les gemmes sur les bonnes cases pour révéler l{"'"}image en pixel art !
            </Text>
          </View>
        </View>

        {/* Data Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DONNÉES</Text>

          <TouchableOpacity activeOpacity={0.8} onPress={handleResetProgress} style={styles.resetBtn}>
            <Trash2 size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.resetBtnText}>Réinitialiser toute la progression</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.infoFooter}>
          <Info size={16} color={theme.colors.textDim} style={{ marginRight: 4 }} />
          <Text style={styles.infoText}>Gem Fill v1.0.0 — React Native & Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabelText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  guideBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
  },
  guideTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  guideText: {
    color: theme.colors.guideText,
    fontSize: 13,
    lineHeight: 20,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.errorSurface,
    borderColor: theme.colors.errorBorder,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
  },
  resetBtnText: {
    color: theme.colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  infoText: {
    color: theme.colors.textDim,
    fontSize: 12,
  },
});
