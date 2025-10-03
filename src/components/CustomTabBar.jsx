import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Colors } from '../constants/colors';

function CustomTabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scaleValue = new Animated.Value(1);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start();
  };

  const handlePress = (route, isFocused) => {
    animateButton();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.tabContainer, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Floating center button (Send Money)
        if (route.name === 'BeneficiaryTab') {
          return (
            <Animated.View 
              key={route.key}
              style={[
                styles.centerButton,
                { transform: [{ scale: scaleValue }] }
              ]}
            >
              <TouchableOpacity
                onPress={() => handlePress(route, isFocused)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('tabs.send_money')}
                style={styles.centerButtonTouchable}
              >
                <View style={styles.centerButtonInner}>
                  <FontAwesome5 
                    name="money-bill-wave" 
                    size={24} 
                    color="#fff" 
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }

        // Default icon and label logic
        let iconName;
        let label;
       switch (route.name) {
        case 'HomeTab':
          iconName = isFocused ? 'grid' : 'grid-outline'; // Better for dashboard/home view
          // Alternatives: 'speedometer', 'pie-chart', 'dashboard'
          label = t('tabs.home');
          break;
          
        case 'TransferTab':
          iconName = isFocused ? 'repeat' : 'repeat-outline'; // Better represents transactions/transfers
          // Alternatives: 'swap-vertical', 'sync', 'trending-up'
          label = t('tabs.history');
          break;
          
        case 'ManageVirtualCardTab':
          iconName = isFocused ? 'wallet' : 'wallet-outline'; // More intuitive for cards/money management
          // Alternatives: 'credit-card', 'card', 'cash'
          label = t('tabs.cards');
          break;
          
        case 'SettingsTab':
          iconName = isFocused ? 'settings' : 'settings-outline'; // Better for user profile/settings
          // Alternatives: 'cog', 'options', 'menu'
          label = t('tabs.settings');
          break;
          
        default:
          iconName = 'help-circle-outline';
          label = '';
      }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            testID={options.tabBarTestID}
            onPress={() => handlePress(route, isFocused)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.tabButtonContent}>
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? Colors.primary : Colors.text}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? Colors.primary : Colors.text,
                    fontFamily: isFocused ? 'Font-Bold' : 'Font-Regular',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
             
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 95,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  centerButton: {
    position: 'absolute',
     bottom: 55,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  centerButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    height: '100%',
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    maxWidth: '80%',
    includeFontPadding: false,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 10 : 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  activeIndicatorCenter: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});

export default CustomTabBar;