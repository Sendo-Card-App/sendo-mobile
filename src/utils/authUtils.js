// utils/authUtils.js
import { getData, storeData } from '../services/storage';
import { loginSuccess } from '../features/Auth/authSlice';

export const refreshAuthToken = async (dispatch, loginWithPhone) => {
  try {
    const authData = await getData('@authData');
    if (!authData?.refreshToken || !authData?.deviceId) return null;

    const result = await loginWithPhone({
      refreshToken: authData.refreshToken,
      deviceId: authData.deviceId
    }).unwrap();

    if (result?.data?.accessToken) {
      const newAuthData = {
        ...authData,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken || authData.refreshToken
      };
      
      await storeData('@authData', newAuthData);
      dispatch(loginSuccess(newAuthData));
      return newAuthData.accessToken;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};