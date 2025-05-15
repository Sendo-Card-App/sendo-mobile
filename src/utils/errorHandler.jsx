import Toast from 'react-native-toast-message';

export const showErrorToast = (errorType, customMessage = null) => {
  let title = 'Erreur';
  let message = 'Une erreur est survenue';
  
  switch(errorType) {
    case 'SERVICE_UNAVAILABLE':
      title = 'Service indisponible';
      message = customMessage || 'Service temporairement indisponible';
      break;
    case 'ACTION_FAILED':
      title = 'Échec';
      message = customMessage || 'Action échouée';
      break;
  }

  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};