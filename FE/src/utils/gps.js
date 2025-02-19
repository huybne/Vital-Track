import GetLocation from 'react-native-get-location';

const MAPBOX_API_KEY = 'sk.eyJ1IjoiYnVpcXVhbmdodXkiLCJhIjoiY20yeDVicWVvMDFuYjJpczhkMnU0dmY1aiJ9.ixhdUrd9L8ORwfZya6DaQg';
 
export const getCurrentLocation = async () => {
  try {
    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
    const { latitude, longitude } = location;
    return { latitude, longitude };
  } catch (error) {
    throw new Error(`Error fetching current location: ${error.message}`);
  } 
};
 
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    } else {
      throw new Error('Could not fetch address');
    }
  } catch (error) {
    console.error('Error fetching address:', error.message);
    return null; 
  }
};


