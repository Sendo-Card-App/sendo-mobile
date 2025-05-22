// SkeletonLoader.js
import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

const SkeletonLoader = ({
  skeletonEnabled = true,
  skeletonDuration = 3000,
  skeletonType = 'list',
  fallbackToSpinner = true,
  isLoading,
  error,
  children
}) => {
  const [showSkeleton, setShowSkeleton] = React.useState(true);
  const [slowConnection, setSlowConnection] = React.useState(false);
  
  React.useEffect(() => {
    let skeletonTimer;
    let slowConnectionTimer;
    
    if (isLoading && skeletonEnabled) {
      setShowSkeleton(true);
      
      // Slow connection timer
      slowConnectionTimer = setTimeout(() => {
        setSlowConnection(true);
      }, 10000);
      
      // Skeleton duration timer
      skeletonTimer = setTimeout(() => {
        setShowSkeleton(false);
      }, skeletonDuration);
    } else {
      setShowSkeleton(false);
      setSlowConnection(false);
    }
    
    return () => {
      clearTimeout(skeletonTimer);
      clearTimeout(slowConnectionTimer);
    };
  }, [isLoading, skeletonEnabled, skeletonDuration]);
  
  if (error) {
    return (
      <View style={styles.errorMessage}>
        <Text>An error occurred while loading data.</Text>
      </View>
    );
  }
  
  if (slowConnection) {
    return (
      <View style={styles.slowConnectionMessage}>
        <Text>Slow connection... Check your network.</Text>
      </View>
    );
  }
  
  if (isLoading && showSkeleton) {
    return (
      <View style={[styles.skeletonContainer, styles[skeletonType]]}>
        {renderSkeletonByType(skeletonType)}
      </View>
    );
  }
  
  if (isLoading && !showSkeleton && fallbackToSpinner) {
    return (
      <View style={styles.spinnerFallback}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }
  
  return children;
};

const renderSkeletonByType = (type) => {
  switch (type) {
    case 'list':
      return (
        <>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[styles.skeletonItem, styles.skeletonListItem]} />
          ))}
        </>
      );
    case 'card':
      return (
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonCardHeader} />
          <View style={styles.skeletonCardContent} />
          <View style={styles.skeletonCardFooter} />
        </View>
      );
    default:
      return (
        <>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[styles.skeletonItem, styles.skeletonListItem]} />
          ))}
        </>
      );
  }
};

const styles = StyleSheet.create({
  skeletonContainer: {
    width: '100%',
    padding: 16,
  },
  skeletonItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonListItem: {
    height: 80,
    marginBottom: 16,
    borderRadius: 12,
  },
  skeletonCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  skeletonCardHeader: {
    height: 20,
    width: '60%',
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
    borderRadius: 4,
  },
  skeletonCardContent: {
    height: 100,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
    borderRadius: 4,
  },
  skeletonCardFooter: {
    height: 15,
    width: '30%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  errorMessage: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  slowConnectionMessage: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  spinnerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

SkeletonLoader.propTypes = {
  skeletonEnabled: PropTypes.bool,
  skeletonDuration: PropTypes.number,
  skeletonType: PropTypes.oneOf(['list', 'card', 'detail', 'dashboard', 'profile']),
  fallbackToSpinner: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  children: PropTypes.node.isRequired,
};

export default SkeletonLoader;