import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence,
  withTiming
} from 'react-native-reanimated';

// Colors configuration (you might want to move this to a separate file)
const Colors = {
  primary: {
    main: '#7ddd7d',
  },
  secondary: {
    main: '#f1c40f',
  },
  status: {
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#7ddd7d',
  },
  neutral: {
    background: '#F2F2F7',
    white: '#FFFFFF',
    text: '#000000',
    caption: '#8E8E93',
    border: '#C6C6C8',
  },
};

// Spacing configuration
const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Border radius configuration
const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 20,
};

// Typography configuration
const Typography = {
  header2: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
  },
  caption: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
  },
};

// Button component (simplified version for this example)
const Button = ({ 
  title, 
  onPress, 
  loading, 
  variant = 'contained', 
  color = 'primary', 
  style, 
  icon 
}) => {
  return (
    <View style={[buttonStyles.button, buttonStyles[variant], style]}>
      <Text style={buttonStyles.text} onPress={!loading ? onPress : undefined}>
        {loading ? 'Chargement...' : title}
      </Text>
      {icon && !loading && <View style={buttonStyles.icon}>{icon}</View>}
      {loading && <ActivityIndicator size="small" color={Colors[color].main} />}
    </View>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
  },
  contained: {
    backgroundColor: Colors.primary.main,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.secondary.main,
  },
  text: {
    color: Colors.neutral.white,
    ...Typography.body,
    fontWeight: '600',
  },
  icon: {
    marginLeft: Spacing.sm,
  },
});

const NetworkErrorBoundary = ({
  children,
  onRetry,
  error,
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [isCheckingInternet, setIsCheckingInternet] = useState(false);
  const [showErrorScreen, setShowErrorScreen] = useState(false);
  const [netInfo, setNetInfo] = useState(null);
  const rotation = useSharedValue(0);

  // Animation pour l'icône de rechargement
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Vérification de la connectivité internet utilisant NetInfo
  const checkInternetConnectivity = async () => {
    try {
      const state = await NetInfo.fetch();
      setNetInfo(state);
      
      // Vérifier la connectivité générale
      if (!state.isConnected) {
        return false;
      }
      
      // Pour une vérification plus approfondie, on peut tester l'accès internet
      if (state.isInternetReachable !== null) {
        return state.isInternetReachable;
      }
      
      // Si isInternetReachable n'est pas disponible, faire un test manuel
      return await testInternetAccess();
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  };

  // Test manuel d'accès internet (fallback)
  const testInternetAccess = async () => {
    try {
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        'https://httpbin.org/status/200'
      ];
      
      for (const url of testUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return true;
        } catch (error) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // Vérification complète avec gestion de l'affichage
  const performConnectivityCheck = async (showCheckingState = false) => {
    if (showCheckingState) {
      setIsCheckingInternet(true);
    }
    
    const hasInternet = await checkInternetConnectivity();
    setIsOffline(!hasInternet);
    
    if (hasInternet) {
      setShowErrorScreen(false);
      if (onRetry) {
        onRetry();
      }
    } else {
      setShowErrorScreen(true);
    }
    
    setIsCheckingInternet(false);
    return hasInternet;
  };

  // Gestion automatique silencieuse pour les problèmes d'internet
  useEffect(() => {
    let intervalId;
    
    if (isOffline && showErrorScreen) {
      // Vérification automatique toutes les 5 secondes
      intervalId = setInterval(async () => {
        const hasInternet = await checkInternetConnectivity();
        
        if (hasInternet) {
          setIsOffline(false);
          setShowErrorScreen(false);
          
          if (onRetry) {
            onRetry();
          }
        }
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOffline, showErrorScreen, onRetry]);

  // Écoute des changements de connexion avec NetInfo - C'EST LA PARTIE CLÉ
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 NetInfo state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });
      
      setNetInfo(state);
      
      // Mettre à jour l'état en fonction de la connectivité
      const isOnline = state.isConnected && (state.isInternetReachable === null || state.isInternetReachable);
      
      if (isOnline) {
        setIsOffline(false);
        if (showErrorScreen) {
          setShowErrorScreen(false);
          if (onRetry) {
            onRetry();
          }
        }
      } else {
        setIsOffline(true);
        setShowErrorScreen(true);
      }
    });

    // Vérification initiale
    const checkInitialConnection = async () => {
      const hasInternet = await checkInternetConnectivity();
      setIsOffline(!hasInternet);
      setShowErrorScreen(!hasInternet);
    };

    checkInitialConnection();

    return () => unsubscribe();
  }, [showErrorScreen, onRetry]);

  // SIMPLIFIER la détection d'erreur - enlever la logique complexe
  useEffect(() => {
    // Si on a une erreur spécifique, on peut l'utiliser
    // Mais pour les tests de connexion, on se base principalement sur NetInfo
    if (error) {
      console.log('🔍 Error detected in NetworkErrorBoundary:', error);
      // Si c'est une erreur réseau, on vérifie la connexion
      if (error.message?.includes('Network') || error.code === 'NETWORK_ERROR') {
        performConnectivityCheck(true);
      }
    }
  }, [error]);

  const handleManualRetry = async () => {
    setIsCheckingInternet(true);
    
    rotation.value = withSequence(
      withTiming(360, { duration: 500 }),
      withTiming(0, { duration: 0 })
    );
    
    await performConnectivityCheck(false);
  };

  // Afficher l'erreur seulement pour les problèmes de connexion internet
  if (showErrorScreen && isOffline) {
    console.log('🚨 Showing offline error screen');
    return (
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(300)}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: Colors.status.error + '10' }
          ]}>
            <WifiOff size={64} color={Colors.status.error} />
          </View>

          <Text style={styles.title}>Pas de connexion internet</Text>
          
          <Text style={styles.message}>
            Vérifiez votre connexion internet. L'application vérifie automatiquement la reconnexion.
          </Text>

          {/* Informations détaillées sur la connexion */}
          {netInfo && (
            <View style={styles.networkInfo}>
              <Text style={styles.networkInfoText}>
                Type: {netInfo.type} | Connecté: {netInfo.isConnected ? 'Oui' : 'Non'}
              </Text>
              <Text style={styles.networkInfoText}>
                Internet accessible: {netInfo.isInternetReachable ? 'Oui' : 'Non'}
              </Text>
            </View>
          )}

          {/* Vérification manuelle */}
          {isCheckingInternet && (
            <Animated.View entering={FadeIn} style={styles.checkingContainer}>
              <Animated.View style={animatedStyle}>
                <RefreshCw size={20} color={Colors.status.error} />
              </Animated.View>
              <Text style={[styles.checkingText, { color: Colors.status.error }]}>
                Vérification de la connexion...
              </Text>
            </Animated.View>
          )}

          {/* Indicateur de statut */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: Colors.status.error }
            ]} />
            <Text style={styles.statusText}>Hors ligne</Text>
          </View>

          {/* Bouton de retry manuel */}
          <Button
            title="Vérifier la connexion"
            onPress={handleManualRetry}
            loading={isCheckingInternet}
            variant="outlined"
            color="secondary"
            style={styles.retryButton}
            icon={<RefreshCw size={20} color={Colors.secondary.main} />}
          />

          {/* Message d'information */}
          <Text style={styles.autoRetryText}>
            Vérification automatique toutes les 5 secondes
          </Text>

          {/* Conseils spécifiques */}
          <View style={[
            styles.tipsContainer,
            { backgroundColor: Colors.status.error + '05' }
          ]}>
            <Text style={styles.tipsTitle}>
              Conseils pour résoudre le problème :
            </Text>
            <Text style={styles.tipText}>• Vérifiez votre connexion WiFi ou données mobiles</Text>
            <Text style={styles.tipText}>• Redémarrez votre routeur si nécessaire</Text>
            <Text style={styles.tipText}>• Contactez votre fournisseur d'accès internet</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.primary.main,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.neutral.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.header2,
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.neutral.text,
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.neutral.caption,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  networkInfo: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  networkInfoText: {
    ...Typography.small,
    color: Colors.neutral.caption,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.md,
    shadowColor: Colors.neutral.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkingText: {
    ...Typography.caption,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins-Medium',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.xl,
    shadowColor: Colors.neutral.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: 'Poppins-Medium',
  },
  retryButton: {
    marginBottom: Spacing.md,
    minWidth: 200,
  },
  autoRetryText: {
    ...Typography.small,
    color: Colors.neutral.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  tipsContainer: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  tipsTitle: {
    ...Typography.caption,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: Spacing.sm,
    color: Colors.neutral.text,
  },
  tipText: {
    ...Typography.small,
    color: Colors.neutral.caption,
    marginBottom: 2,
    lineHeight: 18,
  },
});

export default NetworkErrorBoundary;