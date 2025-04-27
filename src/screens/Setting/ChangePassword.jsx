import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useResetPasswordMutation } from '../../services/Auth/authAPI'; 
import Toast from 'react-native-toast-message'; 
import Loader from "../../components/Loader"; // Importing the Loader component

const ChangePassword = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [showOldPassword, setShowOldPassword] = useState(false); // State for old password visibility
  const [showNewPassword, setShowNewPassword] = useState(false); // State for new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [resetPassword] = useResetPasswordMutation();

  const handleSubmit = async () => {
    // Validation des champs
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Field required', 
        text2: 'All fields are required',
      });
      return;
    }

    if (oldPassword === newPassword) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Password same as old', 
        text2: 'The new password must be different from the old one.',
      });
      return;
    }

    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Password too short', 
        text2: 'The password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Password mismatch', 
        text2: 'The passwords do not match.',
      });
      return;
    }

    try {
      setIsLoading(true); // Start loading
      // Appel API pour la mise à jour du mot de passe
      const response = await resetPassword({
        token: 'USER_AUTH_TOKEN', // Replace with the actual user's token
        newPassword: newPassword,
      });

      if (response.error) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Current password incorrect', // Don't translate the error message
          text2: 'The current password you entered is incorrect.',
        });
      } else {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Password updated', // Don't translate the success message
          text2: 'Your password has been successfully updated.',
        });
        // Redirect or perform another action after the update
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Something went wrong', // Don't translate the error message
        text2: 'There was an issue updating your password.',
      });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        {t('change_password')}
      </Text>

      <TextInput
        secureTextEntry={!showOldPassword}
        placeholder={t('old_password')}
        value={oldPassword}
        onChangeText={setOldPassword}
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          borderRadius: 15,
          paddingLeft: 10,
        }}
      />
      <TouchableOpacity
        onPress={() => setShowOldPassword(prev => !prev)}
        style={{ position: 'absolute', right: 10, top: 10 }}
      >
        <Text>{showOldPassword ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>

      <TextInput
        secureTextEntry={!showNewPassword}
        placeholder={t('new_password')}
        value={newPassword}
        onChangeText={setNewPassword}
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          borderRadius: 15,
          paddingLeft: 10,
        }}
      />
      <TouchableOpacity
        onPress={() => setShowNewPassword(prev => !prev)}
        style={{ position: 'absolute', right: 10, top: 10 }}
      >
        <Text>{showNewPassword ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>

      <TextInput
        secureTextEntry={!showConfirmPassword}
        placeholder={t('confirm_new_password')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{
          height: 40,
          borderRadius: 15,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
        }}
      />
      <TouchableOpacity
        onPress={() => setShowConfirmPassword(prev => !prev)}
        style={{ position: 'absolute', right: 10, top: 10 }}
      >
        <Text>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: '#7ddd7d',
          paddingVertical: 15,
          borderRadius: 50,
          marginTop: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isLoading ? <Loader /> : (
          <Text style={{ fontSize: 18, textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            {t('submit')}
          </Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default ChangePassword;
