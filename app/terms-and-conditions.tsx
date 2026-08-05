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

export default function TermsAndConditionsScreen() {
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
            <ThemedText style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 20 : 26 }]}>Terms & Conditions</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ThemedText style={[styles.lastUpdated, { color: theme.mutedText }]}>
              Last Updated: August 5, 2026
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              By accessing or using DIBS (Digital Image Biometric Systems), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the App.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>2. Service Description</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              DIBS is a biometric-secured media protection application that uses facial recognition and liveness detection to control access to your sensitive images and videos. The App provides:{'\n\n'}
              • Biometric enrollment and identity verification{'\n'}
              • Secure encrypted storage for media files{'\n'}
              • Access control via face recognition with liveness detection{'\n'}
              • Screenshot and screen recording prevention (mobile only){'\n'}
              • Watermarking for protected content{'\n'}
              • Audit logging and activity tracking{'\n'}
              • Limited offline access functionality
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>3. Eligibility</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You must be at least 18 years of age to use DIBS. By using the App, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>4. Account Registration</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • You must provide accurate, current, and complete information during registration{'\n'}
              • You are responsible for maintaining the confidentiality of your account credentials{'\n'}
              • You are responsible for all activities that occur under your account{'\n'}
              • You must immediately notify us of any unauthorized access to your account{'\n'}
              • We reserve the right to suspend or terminate accounts that violate these Terms
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>5. Biometric Enrollment and Use</ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>5.1 Consent</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              By enrolling your face in DIBS, you provide explicit consent for the collection, storage, and use of your biometric data for identity verification purposes. This consent can be revoked at any time by resetting your Face ID enrollment.
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>5.2 Data Accuracy</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You acknowledge that biometric recognition technology is not 100% accurate and may occasionally fail to recognize you or incorrectly recognize another person. We are not liable for access denials or unauthorized access resulting from technical limitations of biometric systems.
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>5.3 Liveness Detection</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              The App employs liveness detection to prevent spoofing attacks using photos, videos, or masks. You agree to cooperate with liveness checks during verification and understand that failure to pass liveness detection will result in access denial.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>6. Prohibited Uses</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You agree NOT to:{'\n\n'}
              • Upload illegal, obscene, defamatory, or infringing content{'\n'}
              • Use the App to harass, threaten, or harm others{'\n'}
              • Attempt to bypass biometric security controls{'\n'}
              • Reverse engineer, decompile, or disassemble the App{'\n'}
              • Interfere with or disrupt the App's servers or networks{'\n'}
              • Impersonate another person or misrepresent your identity{'\n'}
              • Use the App for any unlawful purpose or in violation of applicable laws{'\n'}
              • Share your biometric enrollment or account access with others{'\n'}
              • Attempt to circumvent screenshot protection or watermarking features
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>7. Content Ownership and Responsibility</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              • You retain all rights to the media files you upload to DIBS{'\n'}
              • You are solely responsible for the content you upload and share{'\n'}
              • You represent that you have all necessary rights to upload your content{'\n'}
              • You grant us a limited license to store, encrypt, and display your content as necessary to provide the Service{'\n'}
              • We reserve the right to remove content that violates these Terms or applicable laws
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>8. Security Features</ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>8.1 Screenshot Protection</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              On supported mobile platforms, DIBS can block screenshots and screen recordings. This feature is enforced by the operating system and is not available in web browsers. We cannot guarantee absolute prevention of screen capture on all devices.
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>8.2 Watermarking</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              When enabled, the App applies a "PROTECTED" watermark overlay to media files during viewing. This serves as a visual indicator and deterrent but does not prevent all forms of content capture.
            </ThemedText>

            <ThemedText style={[styles.subheading, { color: theme.text }]}>8.3 Audit Logs</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              All vault access attempts, whether successful or blocked, are logged with timestamps, device information, and verification status. These logs are accessible to you and retained for security purposes.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>9. Offline Access</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              When offline access is enabled, the App may cache biometric templates and recently accessed media locally. Offline access has reduced security compared to online verification and requires periodic re-verification. We are not liable for unauthorized access that occurs during offline operation.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>10. Disclaimer of Warranties</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:{'\n\n'}
              • Merchantability and fitness for a particular purpose{'\n'}
              • Accuracy, reliability, or completeness of biometric verification{'\n'}
              • Uninterrupted or error-free operation{'\n'}
              • Security against all forms of unauthorized access{'\n'}
              • Prevention of all data breaches or losses
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>11. Limitation of Liability</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:{'\n\n'}
              • Unauthorized access to your vault resulting from biometric system limitations{'\n'}
              • Loss, corruption, or unauthorized disclosure of your media files{'\n'}
              • Indirect, incidental, consequential, or punitive damages{'\n'}
              • Damages resulting from circumvention of security features{'\n'}
              • Failure of screenshot protection or watermarking features{'\n\n'}
              Our total liability shall not exceed the amount you paid for the App in the past 12 months.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>12. Indemnification</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses (including legal fees) arising from:{'\n\n'}
              • Your use of the App{'\n'}
              • Your violation of these Terms{'\n'}
              • Your violation of any rights of third parties{'\n'}
              • Content you upload or share through the App
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>13. Data Export and Account Deletion</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              You may export your user data at any time from the Settings menu. Upon account deletion, all personal data, biometric templates, and media files will be permanently removed within 30 days. This action is irreversible.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>14. Third-Party Services</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              The App may integrate with third-party services for authentication, storage, and analytics. Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party service failures or data practices.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>15. Termination</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              We may suspend or terminate your access to DIBS at any time for:{'\n\n'}
              • Violation of these Terms{'\n'}
              • Fraudulent or illegal activity{'\n'}
              • Extended periods of inactivity{'\n'}
              • At our sole discretion with or without notice{'\n\n'}
              You may terminate your account at any time from the Settings menu.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>16. Changes to Terms</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via in-app notification or email. Continued use of DIBS after changes constitutes acceptance of the updated Terms.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>17. Governing Law</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be resolved in the courts of competent jurisdiction.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>18. Severability</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>19. Contact Information</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              For questions about these Terms, contact us at:{'\n\n'}
              Email: legal@dibsapp.com{'\n'}
              Support: support@dibsapp.com
            </ThemedText>

            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>20. Entire Agreement</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.mutedText }]}>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and DIBS regarding use of the App and supersede all prior agreements and understandings.
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
