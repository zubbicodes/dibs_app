import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isMobile, isTablet } = useViewportDimensions();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ResponsiveWrapper maxWidth={isTablet ? 700 : 600} style={styles.content}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 20 : 26 }]}>Privacy Policy</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ThemedText style={[styles.lastUpdated, { color: theme.mutedText }]}>
              Last Updated: August 5, 2026
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>1. Introduction</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              DIBS (Digital Image Biometric Systems) ("we," "our," or "the App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our biometric-secured media protection application.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>2. Information We Collect</ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>2.1 Biometric Data</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Face recognition data captured during enrollment and verification{'\n'}
              • Liveness detection data to prevent spoofing attacks{'\n'}
              • Facial feature embeddings stored securely in encrypted format{'\n'}
              • This data is used exclusively for identity verification and vault access control
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>2.2 Account Information</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Full name and email address{'\n'}
              • User ID and device identifiers{'\n'}
              • Authentication credentials (passwords are encrypted and never stored in plain text)
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>2.3 Media Files</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Images and videos you upload to the secure vault{'\n'}
              • Media metadata including file type, size, and upload timestamp{'\n'}
              • All media files are encrypted at rest and in transit
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>2.4 Access and Activity Logs</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Timestamps of vault access attempts{'\n'}
              • Verification status (verified or blocked){'\n'}
              • Device information and platform details{'\n'}
              • Actions performed within the app
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>3. How We Use Your Information</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Authenticate your identity using biometric verification{'\n'}
              • Control access to your protected media vault{'\n'}
              • Prevent unauthorized viewing, sharing, or manipulation of your content{'\n'}
              • Maintain audit trails for security and compliance purposes{'\n'}
              • Detect and prevent fraudulent access attempts{'\n'}
              • Enable offline access to previously verified content{'\n'}
              • Improve app security and user experience
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>4. Data Storage and Security</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • All biometric data is encrypted using industry-standard AES-256 encryption{'\n'}
              • Face embeddings are stored locally on your device and in secure cloud storage{'\n'}
              • Media files are encrypted before upload and remain encrypted at rest{'\n'}
              • Access logs are retained for security auditing and compliance{'\n'}
              • We implement physical, technical, and administrative safeguards to protect your data{'\n'}
              • Data transmission uses TLS/SSL encryption protocols
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>5. Data Retention</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • Biometric enrollment data: Retained until you delete your enrollment or account{'\n'}
              • Media files: Retained until you explicitly delete them from your vault{'\n'}
              • Access logs: Retained for 12 months for security and compliance purposes{'\n'}
              • Account information: Retained until account deletion is requested{'\n'}
              • Upon account deletion, all personal data is permanently removed within 30 days
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>6. Data Sharing and Disclosure</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              We do not sell, rent, or share your personal information with third parties except:{'\n\n'}
              • With your explicit consent{'\n'}
              • To comply with legal obligations, court orders, or law enforcement requests{'\n'}
              • To protect our rights, property, or safety, or that of our users{'\n'}
              • With service providers who assist in app operation (under strict confidentiality agreements){'\n\n'}
              We never share biometric data for marketing or advertising purposes.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>7. Your Rights</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You have the right to:{'\n\n'}
              • Access your personal data stored in the app{'\n'}
              • Export your user data in portable format{'\n'}
              • Request deletion of your biometric enrollment and account{'\n'}
              • Revoke consent for data processing (may limit app functionality){'\n'}
              • Object to automated decision-making based on biometric data{'\n'}
              • File a complaint with relevant data protection authorities
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>8. Children's Privacy</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              DIBS is not intended for users under 18 years of age. We do not knowingly collect biometric or personal information from children. If we discover such data has been collected, it will be promptly deleted.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>9. Biometric Data Consent</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              By enrolling your face in DIBS, you provide explicit, informed consent for:{'\n\n'}
              • Collection and storage of your facial biometric data{'\n'}
              • Use of this data for identity verification purposes{'\n'}
              • Storage of encrypted biometric templates on device and in secure cloud{'\n\n'}
              You may revoke this consent at any time by resetting your Face ID enrollment from the Settings menu. This will permanently delete your biometric data.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>10. Offline Access</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              When offline access is enabled, your biometric templates and recently accessed media may be cached locally on your device. This allows vault access without internet connectivity. Re-verification is required periodically and when reconnected online.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>11. Changes to This Policy</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              We may update this Privacy Policy periodically. We will notify you of material changes via in-app notification or email. Continued use of DIBS after changes constitutes acceptance of the updated policy.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>12. Contact Us</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:{'\n\n'}
              Email: privacy@dibsapp.com{'\n'}
              Support: support@dibsapp.com
            </ThemedText>

            <View style={{ height: 40 }} />
          </ScrollView>
        </ResponsiveWrapper>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: FontFamilies.semiBold, flex: 1 },
  divider: { height: 1, opacity: 0.1, marginBottom: 8 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamilies.semiBold,
    marginTop: 20,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    fontFamily: FontFamilies.medium,
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: FontFamilies.regular,
    lineHeight: 22,
    marginBottom: 12,
  },
});
